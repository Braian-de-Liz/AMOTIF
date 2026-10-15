// Matemática pura da reprodução multifaixa (sem Web Audio), para poder testar sem navegador.
// Todas as posições e durações estão em segundos na linha do tempo global do projeto.

/** Menor trecho que vale como loop; abaixo disso o arrasto é tratado como clique. */
export const MIN_LOOP_SECONDS = 0.1;

export interface LoopRegion {
    start: number;
    end: number;
}

/** Como uma faixa deve entrar quando a reprodução começa na posição global `position`. */
export type StartPlan =
    /** Começa agora, já dentro do áudio, `offset` segundos depois do início do arquivo. */
    | { kind: 'now'; offset: number }
    /** O delay da faixa ainda não chegou: começa daqui a `wait` segundos, do início do arquivo. */
    | { kind: 'later'; wait: number }
    /** A faixa já terminou antes de `position`. */
    | { kind: 'done' };

const finiteOr = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

/** Delay em segundos; valores negativos ou inválidos contam como 0 (igual ao `safeDelay` do mixdown). */
export function delaySeconds(delayMs: number): number {
    return Math.max(0, finiteOr(delayMs, 0)) / 1000;
}

export function planTrackStart(position: number, delaySec: number, durationSec: number): StartPlan {
    const pos = Math.max(0, finiteOr(position, 0));
    const delay = Math.max(0, finiteOr(delaySec, 0));

    if (pos < delay) return { kind: 'later', wait: delay - pos };

    const offset = pos - delay;
    return offset >= durationSec ? { kind: 'done' } : { kind: 'now', offset };
}

export interface TrackTiming {
    delaySec: number;
    durationSec: number;
}

/** Fim da última faixa a terminar; 0 sem faixas. */
export function totalDuration(tracks: TrackTiming[]): number {
    let total = 0;
    for (const t of tracks) {
        total = Math.max(total, Math.max(0, finiteOr(t.delaySec, 0)) + Math.max(0, finiteOr(t.durationSec, 0)));
    }
    return total;
}

export function clampPosition(position: number, total: number): number {
    return Math.min(Math.max(0, finiteOr(position, 0)), Math.max(0, total));
}

/** Posição global a partir de uma fração (0 a 1) da largura da linha do tempo. */
export function positionFromFraction(fraction: number, total: number): number {
    return clampPosition(Math.min(Math.max(finiteOr(fraction, 0), 0), 1) * total, total);
}

/**
 * Normaliza uma região de loop: ordena as pontas, limita ao projeto e descarta se ficar curta demais.
 * Devolve null quando não vale como loop.
 */
export function normalizeLoop(a: number, b: number, total: number): LoopRegion | null {
    const start = clampPosition(Math.min(a, b), total);
    const end = clampPosition(Math.max(a, b), total);
    return end - start >= MIN_LOOP_SECONDS ? { start, end } : null;
}

/** Formata segundos como m:ss. */
export function formatClock(seconds: number): string {
    const total = Math.max(0, Math.floor(finiteOr(seconds, 0)));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
