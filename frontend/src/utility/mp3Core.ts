import { createMp3Encoder } from 'wasm-media-encoders';

/** Taxas aceitas pelo MP3 (MPEG-1). Outras são reamostradas para 48 kHz pelo LAME. */
const MP3_SAMPLE_RATES = [32000, 44100, 48000];

const MP3_BITRATE = 320;

/** Amostras por chamada ao encoder (múltiplo do frame MP3 de 1152). */
const CHUNK_FRAMES = 1152 * 64;

type ProgressCallback = (fraction: number) => void;

/**
 * Codifica canais PCM (Float32, -1..1) em MP3 CBR 320 kbps.
 * Função pura e síncrona após o carregamento do WASM; roda em Worker ou no Node (testes).
 */
async function encodeMp3(
    channels: Float32Array[],
    sampleRate: number,
    onProgress?: ProgressCallback
): Promise<Uint8Array> {
    // O LAME aceita no máximo 2 canais; mixa o excedente para estéreo.
    const input = channels.length > 2 ? downmixToStereo(channels) : channels;
    const numFrames = input[0]?.length ?? 0;

    const encoder = await createMp3Encoder();
    encoder.configure({
        sampleRate,
        channels: input.length as 1 | 2,
        bitrate: MP3_BITRATE,
        ...(MP3_SAMPLE_RATES.includes(sampleRate) ? {} : { outputSampleRate: 48000 }),
    });

    const parts: Uint8Array[] = [];
    let total = 0;
    const push = (data: Uint8Array) => {
        if (!data.length) return;
        // O buffer devolvido pertence ao encoder e é reutilizado: precisa ser copiado.
        parts.push(data.slice());
        total += data.length;
    };

    for (let start = 0; start < numFrames; start += CHUNK_FRAMES) {
        const end = Math.min(numFrames, start + CHUNK_FRAMES);
        push(encoder.encode(input.map(ch => ch.subarray(start, end))));
        onProgress?.(end / numFrames);
    }
    push(encoder.finalize());

    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
    }
    return out;
}

function downmixToStereo(channels: Float32Array[]): Float32Array[] {
    const n = channels[0].length;
    const left = new Float32Array(n);
    const right = new Float32Array(n);
    channels.forEach((ch, c) => {
        const target = c % 2 === 0 ? left : right;
        for (let i = 0; i < n; i++) target[i] += ch[i];
    });
    const scale = 2 / channels.length;
    for (let i = 0; i < n; i++) {
        left[i] *= scale;
        right[i] *= scale;
    }
    return [left, right];
}

export { encodeMp3, MP3_BITRATE };
export type { ProgressCallback };
