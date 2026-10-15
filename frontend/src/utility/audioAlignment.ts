/**
 * Mede quantas amostras `candidate` está atrasado em relação a `reference`
 * (positivo = candidate começa depois). Usado para compensar o atraso que o
 * codificador/decodificador MP3 insere no início do arquivo.
 *
 * Correlação cruzada em duas etapas: busca grossa num sinal dizimado e
 * refinamento em resolução cheia, para ficar rápido em áudios longos.
 */

const DECIMATION = 8;
const REFINE_RADIUS = DECIMATION * 2;

function mixToMono(channels: Float32Array[]): Float32Array {
    if (channels.length === 1) return channels[0];
    const n = channels[0].length;
    const out = new Float32Array(n);
    for (const ch of channels) for (let i = 0; i < n; i++) out[i] += ch[i] / channels.length;
    return out;
}

/** Primeiro índice com sinal audível (evita correlacionar silêncio). */
function firstAudibleIndex(x: Float32Array, threshold = 0.01): number {
    for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > threshold) return i;
    return 0;
}

function decimate(x: Float32Array, factor: number): Float32Array {
    const out = new Float32Array(Math.floor(x.length / factor));
    for (let i = 0; i < out.length; i++) {
        let sum = 0;
        for (let k = 0; k < factor; k++) sum += x[i * factor + k];
        out[i] = sum / factor;
    }
    return out;
}

/** Correlação normalizada de ref[start..start+len) com cand deslocado por lag. */
function correlationAt(ref: Float32Array, cand: Float32Array, start: number, len: number, lag: number): number {
    let dot = 0, eRef = 0, eCand = 0;
    for (let i = 0; i < len; i++) {
        const r = ref[start + i];
        const j = start + i + lag;
        const c = j >= 0 && j < cand.length ? cand[j] : 0;
        dot += r * c;
        eRef += r * r;
        eCand += c * c;
    }
    const denom = Math.sqrt(eRef * eCand);
    return denom > 0 ? dot / denom : 0;
}

function bestLag(ref: Float32Array, cand: Float32Array, start: number, len: number, from: number, to: number): number {
    let best = 0, bestScore = -Infinity;
    for (let lag = from; lag <= to; lag++) {
        const score = correlationAt(ref, cand, start, len, lag);
        if (score > bestScore) {
            bestScore = score;
            best = lag;
        }
    }
    return best;
}

/**
 * @param maxLagSamples maior atraso procurado (nos dois sentidos)
 * @param windowSamples tamanho da janela comparada
 */
function measureDelaySamples(
    reference: Float32Array[] | Float32Array,
    candidate: Float32Array[] | Float32Array,
    sampleRate: number,
    maxLagSamples = Math.round(sampleRate * 0.1),
    windowSamples = Math.round(sampleRate * 2)
): number {
    const ref = Array.isArray(reference) ? mixToMono(reference) : reference;
    const cand = Array.isArray(candidate) ? mixToMono(candidate) : candidate;

    const start = Math.max(0, firstAudibleIndex(ref) - Math.round(sampleRate * 0.05));
    const len = Math.max(0, Math.min(windowSamples, ref.length - start));
    if (len === 0) return 0;

    // Etapa 1: busca grossa
    const refD = decimate(ref, DECIMATION);
    const candD = decimate(cand, DECIMATION);
    const startD = Math.floor(start / DECIMATION);
    const lenD = Math.floor(len / DECIMATION);
    const maxLagD = Math.ceil(maxLagSamples / DECIMATION);
    const coarse = bestLag(refD, candD, startD, lenD, -maxLagD, maxLagD) * DECIMATION;

    // Etapa 2: refinamento em resolução cheia, numa janela menor
    const refineLen = Math.min(len, Math.round(sampleRate * 0.5));
    return bestLag(ref, cand, start, refineLen, coarse - REFINE_RADIUS, coarse + REFINE_RADIUS);
}

export { measureDelaySamples, mixToMono };
