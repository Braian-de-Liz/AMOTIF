const SAMPLE_RATE = 44100;
const CHANNELS = 2;

export interface MixdownTrack {
    url: string;
    delayMs: number;
    volume: number;
}

const safeDelay = (ms: number) => (Number.isFinite(ms) ? Math.max(0, ms) : 0);

async function decodeTrack(ctx: BaseAudioContext, url: string): Promise<AudioBuffer> {
    const res = await fetch(url, { mode: 'cors', cache: 'no-cache' });
    if (!res.ok) throw new Error(`Falha ao baixar áudio (${res.status})`);
    return ctx.decodeAudioData(await res.arrayBuffer());
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

    // Evita clipping quando a soma das faixas passa de 1.0: reduz tudo proporcionalmente.
    let peak = 0;
    for (const channel of data) {
        for (let i = 0; i < frames; i++) peak = Math.max(peak, Math.abs(channel[i]));
    }
    const scale = peak > 1 ? 0.98 / peak : 1;
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

// Mixa as faixas respeitando delay (ms) e volume de cada uma e devolve um WAV 16-bit estéreo.
export async function mixdownToWav(tracks: MixdownTrack[]): Promise<Blob> {
    if (tracks.length === 0) throw new Error('Nenhuma faixa para exportar.');

    // O contexto só serve para decodificar; a duração final depende dos buffers.
    const decodeCtx = new OfflineAudioContext(CHANNELS, SAMPLE_RATE, SAMPLE_RATE);
    const decoded = await Promise.all(tracks.map(t => decodeTrack(decodeCtx, t.url)));

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

    return encodeWav(await ctx.startRendering());
}

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
