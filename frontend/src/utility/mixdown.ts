import { renderStretched } from './stretchRender';

const SAMPLE_RATE = 44100;
const CHANNELS = 2;

export interface MixdownTrack {
    url: string;
    delayMs: number;
    volume: number;
    /** Velocidade da camada (1 = original; >1 acelera), com a afinação preservada. */
    rate?: number;
    /** Nome mostrado na mensagem de erro quando a faixa não pode ser baixada ou decodificada. */
    label?: string;
}

const safeDelay = (ms: number) => (Number.isFinite(ms) ? Math.max(0, ms) : 0);

async function decodeTrack(ctx: BaseAudioContext, track: MixdownTrack): Promise<AudioBuffer> {
    const onde = track.label ? ` da faixa "${track.label}"` : '';

    let res: Response;
    try {
        res = await fetch(track.url, { mode: 'cors', cache: 'no-cache' });
    } catch {
        throw new Error(`Falha de rede ao baixar áudio${onde}`);
    }
    if (!res.ok) throw new Error(`Falha ao baixar áudio (${res.status})${onde}`);

    try {
        return await ctx.decodeAudioData(await res.arrayBuffer());
    } catch {
        throw new Error(`Não foi possível decodificar o áudio${onde}`);
    }
}

// Evita clipping quando a soma das faixas passa de 1.0: reduz tudo proporcionalmente.
function peakScale(data: Float32Array[], frames: number): number {
    let peak = 0;
    for (const channel of data) {
        for (let i = 0; i < frames; i++) peak = Math.max(peak, Math.abs(channel[i]));
    }
    return peak > 1 ? 0.98 / peak : 1;
}

function encodeWav(buffer: AudioBuffer): Blob {
    const frames = buffer.length;
    const channels = buffer.numberOfChannels;
    const bytesPerSample = 2;
    const dataSize = frames * channels * bytesPerSample;
    const view = new DataView(new ArrayBuffer(44 + dataSize));

    const writeText = (offset: number, text: string) => {
        for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
    };

    writeText(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeText(8, 'WAVE');
    writeText(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * channels * bytesPerSample, true);
    view.setUint16(32, channels * bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeText(36, 'data');
    view.setUint32(40, dataSize, true);

    const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));

    const scale = peakScale(data, frames);
    let offset = 44;
    for (let i = 0; i < frames; i++) {
        for (let c = 0; c < channels; c++) {
            const sample = Math.max(-1, Math.min(1, data[c][i] * scale));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            offset += bytesPerSample;
        }
    }

    return new Blob([view], { type: 'audio/wav' });
}

const MP3_KBPS = 192;
const MP3_BLOCK = 1152;

async function encodeMp3(buffer: AudioBuffer): Promise<Blob> {
    const { Mp3Encoder } = await import('@breezystack/lamejs');
    const frames = buffer.length;
    const channels = Math.min(buffer.numberOfChannels, 2);
    const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
    const scale = peakScale(data, frames);

    const toInt16 = (src: Float32Array, start: number, end: number) => {
        const out = new Int16Array(end - start);
        for (let i = start; i < end; i++) {
            const sample = Math.max(-1, Math.min(1, src[i] * scale));
            out[i - start] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }
        return out;
    };

    const encoder = new Mp3Encoder(channels, buffer.sampleRate, MP3_KBPS);
    const chunks: Uint8Array[] = [];
    for (let start = 0; start < frames; start += MP3_BLOCK) {
        const end = Math.min(start + MP3_BLOCK, frames);
        const left = toInt16(data[0], start, end);
        const chunk = channels === 2
            ? encoder.encodeBuffer(left, toInt16(data[1], start, end))
            : encoder.encodeBuffer(left);
        if (chunk.length > 0) chunks.push(chunk);
        // Cede a thread de vez em quando para a interface não congelar em mixes longos.
        if ((start / MP3_BLOCK) % 400 === 399) await new Promise(r => setTimeout(r, 0));
    }
    const tail = encoder.flush();
    if (tail.length > 0) chunks.push(tail);

    return new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
}

export type MixdownFormat = 'mp3' | 'wav';

async function renderMix(tracks: MixdownTrack[]): Promise<AudioBuffer> {
    if (tracks.length === 0) throw new Error('Nenhuma faixa para exportar.');

    // O contexto só serve para decodificar; a duração final depende dos buffers.
    const decodeCtx = new OfflineAudioContext(CHANNELS, SAMPLE_RATE, SAMPLE_RATE);
    const decoded = await Promise.all(tracks.map(async t => {
        const buffer = await decodeTrack(decodeCtx, t);
        try {
            return await renderStretched(buffer, t.rate ?? 1, 0);
        } catch (err) {
            const onde = t.label ? ` da faixa "${t.label}"` : '';
            throw new Error(`${err instanceof Error ? err.message : 'Falha no ajuste de velocidade'}${onde}`);
        }
    }));

    const totalSeconds = Math.max(
        ...decoded.map((buf, i) => safeDelay(tracks[i].delayMs) / 1000 + buf.duration)
    );

    const ctx = new OfflineAudioContext(CHANNELS, Math.max(1, Math.ceil(totalSeconds * SAMPLE_RATE)), SAMPLE_RATE);

    decoded.forEach((buf, i) => {
        const source = ctx.createBufferSource();
        source.buffer = buf;
        const gain = ctx.createGain();
        gain.gain.value = Number.isFinite(tracks[i].volume) ? tracks[i].volume : 1;
        source.connect(gain).connect(ctx.destination);
        source.start(safeDelay(tracks[i].delayMs) / 1000);
    });

    return ctx.startRendering();
}

// Mixa as faixas respeitando delay (ms) e volume de cada uma; devolve MP3 192 kbps ou WAV 16-bit estéreo.
export async function mixdown(tracks: MixdownTrack[], format: MixdownFormat = 'mp3'): Promise<Blob> {
    const mixed = await renderMix(tracks);
    return format === 'mp3' ? encodeMp3(mixed) : encodeWav(mixed);
}

export const mixdownToWav = (tracks: MixdownTrack[]) => mixdown(tracks, 'wav');

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
