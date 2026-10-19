/**
 * Operações de edição sobre canais de áudio (Float32). Puras, sem Web Audio, para o editor
 * poder testá-las e reaproveitá-las na renderização final.
 */

type Channels = Float32Array[]

/** Menor trecho que o editor aceita selecionar, em segundos. */
const MIN_SELECTION_SECONDS = 0.05
/** Fusão entre o que sobra antes e depois de um trecho removido, para não estalar no corte. */
const SPLICE_CROSSFADE_SECONDS = 0.01

function clampSelection(start: number, end: number, duration: number): { start: number; end: number } {
    const total = Math.max(0, duration)
    const min = Math.min(MIN_SELECTION_SECONDS, total)
    let a = Math.min(Math.max(0, start), total)
    let b = Math.min(Math.max(0, end), total)
    if (a > b) [a, b] = [b, a]
    if (b - a < min) {
        // Preserva o lado que o usuário não mexeu: expande para o lado que cabe.
        if (a + min <= total) b = a + min
        else a = Math.max(0, b - min)
    }
    return { start: a, end: b }
}

/** Mantém só [startSec, endSec). */
function sliceChannels(channels: Channels, sampleRate: number, startSec: number, endSec: number): Channels {
    return channels.map(data => {
        const from = Math.max(0, Math.floor(startSec * sampleRate))
        const to = Math.min(data.length, Math.floor(endSec * sampleRate))
        return data.slice(from, Math.max(from, to))
    })
}

/** Apaga [startSec, endSec) e junta as pontas com um crossfade curto. */
function removeRange(channels: Channels, sampleRate: number, startSec: number, endSec: number): Channels {
    return channels.map(data => {
        const from = Math.min(data.length, Math.max(0, Math.floor(startSec * sampleRate)))
        const to = Math.min(data.length, Math.max(from, Math.floor(endSec * sampleRate)))
        if (from === 0 && to === data.length) return new Float32Array(0)
        if (from === to) return data.slice()

        const head = data.subarray(0, from)
        const tail = data.subarray(to)
        const fade = Math.min(Math.floor(SPLICE_CROSSFADE_SECONDS * sampleRate), head.length, tail.length)

        const out = new Float32Array(head.length + tail.length - fade)
        out.set(head)
        for (let i = 0; i < fade; i++) {
            const t = (i + 1) / (fade + 1)
            const at = head.length - fade + i
            out[at] = head[at] * (1 - t) + tail[i] * t
        }
        out.set(tail.subarray(fade), head.length)
        return out
    })
}

/** Rampa linear de entrada e de saída, aplicada no lugar. */
function applyFades(channels: Channels, sampleRate: number, fadeInSec: number, fadeOutSec: number) {
    for (const data of channels) {
        const fadeIn = Math.min(data.length, Math.floor(fadeInSec * sampleRate))
        const fadeOut = Math.min(data.length, Math.floor(fadeOutSec * sampleRate))
        for (let i = 0; i < fadeIn; i++) data[i] *= i / fadeIn
        for (let i = 0; i < fadeOut; i++) data[data.length - 1 - i] *= i / fadeOut
    }
}

/** Emenda trechos; o que tiver menos canais repete o primeiro. */
function concatChannels(parts: Channels[]): Channels {
    const nonEmpty = parts.filter(p => p.length > 0 && p[0].length > 0)
    if (nonEmpty.length === 0) return [new Float32Array(0)]

    const numChannels = Math.max(...nonEmpty.map(p => p.length))
    const total = nonEmpty.reduce((sum, p) => sum + p[0].length, 0)
    const out = Array.from({ length: numChannels }, () => new Float32Array(total))

    let offset = 0
    for (const part of nonEmpty) {
        for (let ch = 0; ch < numChannels; ch++) {
            out[ch].set(part[ch] ?? part[0], offset)
        }
        offset += part[0].length
    }
    return out
}

/** "1:23,45", "1:23.45", "83.5" ou "83" → segundos; `null` se não der para entender. */
function parseTime(text: string): number | null {
    const clean = text.trim().replace(',', '.')
    if (!clean) return null
    const match = /^(?:(\d+):)?(\d+(?:\.\d+)?)$/.exec(clean)
    if (!match) return null
    const minutes = match[1] ? Number(match[1]) : 0
    const seconds = Number(match[2])
    if (!match[1] && /^\d+:/.test(clean)) return null
    return minutes * 60 + seconds
}

/** Segundos → "m:ss.cc" (centésimos, o bastante para um corte preciso). */
function formatTimePrecise(seconds: number): string {
    const safe = Math.max(0, seconds)
    const totalCentis = Math.round(safe * 100)
    const mins = Math.floor(totalCentis / 6000)
    const secs = Math.floor((totalCentis % 6000) / 100)
    const centis = totalCentis % 100
    return `${mins}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
}

/** px por segundo para um nível de zoom 0–100 (exponencial: cada passo aproxima igual). */
function zoomToPxPerSec(level: number, fitPxPerSec: number, maxPxPerSec = 1000): number {
    const fit = Math.max(1, fitPxPerSec)
    if (maxPxPerSec <= fit) return fit
    const t = Math.min(1, Math.max(0, level / 100))
    return fit * Math.pow(maxPxPerSec / fit, t)
}

export {
    MIN_SELECTION_SECONDS,
    clampSelection,
    sliceChannels,
    removeRange,
    applyFades,
    concatChannels,
    parseTime,
    formatTimePrecise,
    zoomToPxPerSec,
}
export type { Channels }
