import {
    clampPosition,
    delaySeconds,
    normalizeLoop,
    planTrackStart,
    totalDuration,
    type LoopRegion,
} from './playbackMath';

// Motor de reprodução multifaixa: um AudioContext, um relógio mestre e uma fonte por faixa.
// O wavesurfer só desenha a forma de onda; quem toca é este motor, então o delay de cada camada
// (e o volume/mute, mesmo antes de salvar) vale ao vivo, igual ao que a exportação em WAV faz.

export interface PlaybackState {
    playing: boolean;
    /** Camada tocando sozinha ("ouvir só esta"), ou null quando toca o mix inteiro. */
    soloId: string | null;
    loop: LoopRegion | null;
    /** Fim da última faixa a terminar, em segundos. */
    duration: number;
    /** Muda a cada seek/ajuste, para a interface se redesenhar mesmo com a reprodução pausada. */
    epoch: number;
}

export interface TrackOptions {
    delayMs?: number;
    volume?: number;
    muted?: boolean;
}

interface TrackEntry {
    buffer: AudioBuffer;
    delayMs: number;
    volume: number;
    muted: boolean;
    gain: GainNode;
    source: AudioBufferSourceNode | null;
}

type ContextFactory = () => AudioContext;

/** Intervalo da checagem de fim de loop/fim do projeto (independe de requestAnimationFrame). */
const TICK_MS = 50;

export class PlaybackEngine {
    private ctx: AudioContext | null = null;
    private readonly tracks = new Map<string, TrackEntry>();
    private playing = false;
    private soloId: string | null = null;
    private loop: LoopRegion | null = null;
    /** Posição global quando pausado; posição de partida enquanto toca. */
    private position = 0;
    /** `ctx.currentTime` no momento da partida. */
    private startedAt = 0;
    private epoch = 0;
    private timer: ReturnType<typeof setInterval> | null = null;
    private readonly listeners = new Set<() => void>();
    private state: PlaybackState = { playing: false, soloId: null, loop: null, duration: 0, epoch: 0 };

    constructor(private readonly createContext: ContextFactory = () => new AudioContext()) {}

    // ---------- estado observável (compatível com useSyncExternalStore) ----------

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    };

    getState = (): PlaybackState => this.state;

    private emit() {
        this.state = {
            playing: this.playing,
            soloId: this.soloId,
            loop: this.loop,
            duration: this.duration(),
            epoch: this.epoch,
        };
        this.listeners.forEach(listener => listener());
    }

    /** Contexto compartilhado (o metrônomo da gravação usa o mesmo relógio). */
    getContext(): AudioContext {
        if (!this.ctx) this.ctx = this.createContext();
        return this.ctx;
    }

    // ---------- faixas ----------

    registerTrack(id: string, buffer: AudioBuffer, options: TrackOptions = {}) {
        const ctx = this.getContext();
        const existing = this.tracks.get(id);

        if (existing) {
            this.stopSource(existing);
            existing.buffer = buffer;
            existing.delayMs = options.delayMs ?? existing.delayMs;
            existing.volume = options.volume ?? existing.volume;
            existing.muted = options.muted ?? existing.muted;
            existing.gain.gain.value = existing.muted ? 0 : existing.volume;
        } else {
            const gain = ctx.createGain();
            gain.connect(ctx.destination);
            const volume = options.volume ?? 1;
            const muted = options.muted ?? false;
            gain.gain.value = muted ? 0 : volume;
            this.tracks.set(id, { buffer, delayMs: options.delayMs ?? 0, volume, muted, gain, source: null });
        }

        // Faixa que fica pronta no meio da reprodução entra na posição atual.
        if (this.playing && this.audible(id)) this.startSource(this.tracks.get(id)!, this.getPosition());
        this.epoch++;
        this.emit();
    }

    unregisterTrack(id: string) {
        const track = this.tracks.get(id);
        if (!track) return;

        this.stopSource(track);
        track.gain.disconnect();
        this.tracks.delete(id);
        if (this.soloId === id) this.soloId = null;
        if (this.tracks.size === 0 && this.playing) this.pause();
        this.epoch++;
        this.emit();
    }

    /** Ajuste ao vivo de volume/mute/delay, inclusive valores ainda não salvos no servidor. */
    updateTrack(id: string, patch: TrackOptions) {
        const track = this.tracks.get(id);
        if (!track) return;

        const delayChanged = patch.delayMs !== undefined && patch.delayMs !== track.delayMs;
        if (patch.delayMs !== undefined) track.delayMs = patch.delayMs;
        if (patch.volume !== undefined) track.volume = patch.volume;
        if (patch.muted !== undefined) track.muted = patch.muted;
        track.gain.gain.value = track.muted ? 0 : track.volume;

        if (delayChanged && this.playing && this.audible(id)) {
            const position = this.getPosition();
            this.stopSource(track);
            this.startSource(track, position);
        }
        // Um delay novo desloca a faixa na linha do tempo: quem desenha cursores precisa recalcular.
        if (delayChanged) this.epoch++;
        this.emit();
    }

    // ---------- transporte ----------

    play() {
        if (this.playing) {
            if (this.soloId === null) return;
            // Estava ouvindo uma camada sozinha: passa para o mix inteiro sem perder a posição.
            const from = this.getPosition();
            this.stopSources();
            this.soloId = null;
            this.begin(from);
            return;
        }

        this.soloId = null;
        const total = this.activeEnd();

        // No fim do projeto, tocar de novo recomeça (do loop, se houver).
        if (total > 0 && this.position >= total) this.position = 0;
        if (this.loop && (this.position < this.loop.start || this.position >= this.loop.end)) {
            this.position = this.loop.start;
        }
        this.begin(this.position);
    }

    /** "Ouvir só esta camada" a partir da posição atual; tocar de novo a mesma camada pausa. */
    playSolo(id: string) {
        if (!this.tracks.has(id)) return;
        if (this.playing && this.soloId === id) {
            this.pause();
            return;
        }

        const from = this.playing ? this.getPosition() : this.position;
        if (this.playing) this.stopSources();
        this.soloId = id;
        this.begin(from);
    }

    pause() {
        if (!this.playing) return;
        this.position = this.getPosition();
        this.stopSources();
        this.playing = false;
        this.soloId = null;
        this.stopTimer();
        this.emit();
    }

    stop() {
        this.pause();
        this.position = 0;
        this.epoch++;
        this.emit();
    }

    seek(seconds: number) {
        const position = clampPosition(seconds, this.duration());
        if (this.playing) {
            this.stopSources();
            this.position = position;
            this.startedAt = this.getContext().currentTime;
            this.startSources(position);
        } else {
            this.position = position;
        }
        this.epoch++;
        this.emit();
    }

    setLoop(region: { start: number; end: number } | null) {
        this.loop = region ? normalizeLoop(region.start, region.end, this.duration()) : null;
        this.epoch++;
        this.emit();
    }

    getPosition(): number {
        if (!this.playing) return this.position;
        return clampPosition(this.position + (this.getContext().currentTime - this.startedAt), this.duration());
    }

    /**
     * Verifica fim de loop e fim do projeto. Roda sozinho enquanto toca (setInterval);
     * é público para os testes.
     */
    tick() {
        if (!this.playing) return;

        const raw = this.position + (this.getContext().currentTime - this.startedAt);

        if (this.loop && raw >= this.loop.end) {
            this.seek(this.loop.start);
            return;
        }

        const end = this.activeEnd();
        if (raw >= end) {
            this.pause();
            this.position = 0;
            this.epoch++;
            this.emit();
        }
    }

    dispose() {
        this.stopTimer();
        this.stopSources();
        this.tracks.forEach(track => track.gain.disconnect());
        this.tracks.clear();
        this.playing = false;
        this.listeners.clear();
        const ctx = this.ctx;
        this.ctx = null;
        void ctx?.close().catch(() => {});
    }

    // ---------- internos ----------

    private duration(): number {
        return totalDuration(
            [...this.tracks.values()].map(t => ({ delaySec: delaySeconds(t.delayMs), durationSec: t.buffer.duration }))
        );
    }

    /** Fim da reprodução atual: o projeto inteiro, ou só a camada quando toca sozinha. */
    private activeEnd(): number {
        const solo = this.soloId ? this.tracks.get(this.soloId) : null;
        return solo ? delaySeconds(solo.delayMs) + solo.buffer.duration : this.duration();
    }

    private audible(id: string): boolean {
        return this.soloId === null || this.soloId === id;
    }

    private begin(from: number) {
        const ctx = this.getContext();
        void ctx.resume();

        this.position = clampPosition(from, this.duration());
        this.startedAt = ctx.currentTime;
        this.startSources(this.position);
        this.playing = true;
        this.startTimer();
        this.epoch++;
        this.emit();
    }

    private startSources(from: number) {
        this.tracks.forEach((track, id) => {
            if (this.audible(id)) this.startSource(track, from);
        });
    }

    private startSource(track: TrackEntry, from: number) {
        const plan = planTrackStart(from, delaySeconds(track.delayMs), track.buffer.duration);
        if (plan.kind === 'done') return;

        const ctx = this.getContext();
        const source = ctx.createBufferSource();
        source.buffer = track.buffer;
        source.connect(track.gain);

        if (plan.kind === 'now') source.start(ctx.currentTime, plan.offset);
        else source.start(ctx.currentTime + plan.wait, 0);

        source.onended = () => {
            if (track.source === source) track.source = null;
        };
        track.source = source;
    }

    private stopSource(track: TrackEntry) {
        const source = track.source;
        if (!source) return;
        track.source = null;
        source.onended = null;
        try { source.stop(); } catch { /* já parou */ }
        source.disconnect();
    }

    private stopSources() {
        this.tracks.forEach(track => this.stopSource(track));
    }

    private startTimer() {
        this.stopTimer();
        this.timer = setInterval(() => this.tick(), TICK_MS);
    }

    private stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
