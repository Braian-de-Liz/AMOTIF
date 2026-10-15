import { describe, it, expect } from 'vitest'
import { encodeWav } from '@/utility/wavEncoder'
import { encodeMp3 } from '@/utility/mp3Core'
import { measureDelaySamples } from '@/utility/audioAlignment'
import { renderStretched } from '@/utility/stretchRender'

const SR = 44100

function sine(seconds: number, freq = 440, sr = SR): Float32Array {
  const out = new Float32Array(Math.round(seconds * sr))
  for (let i = 0; i < out.length; i++) out[i] = 0.5 * Math.sin((2 * Math.PI * freq * i) / sr)
  return out
}

/** Sinal sem periodicidade curta (ruído determinístico com envelope), bom para correlação. */
function noiseBurst(seconds: number, seed = 1): Float32Array {
  const out = new Float32Array(Math.round(seconds * SR))
  let s = seed
  for (let i = 0; i < out.length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const env = Math.sin((Math.PI * i) / out.length)
    out[i] = ((s / 0x7fffffff) * 2 - 1) * 0.5 * env
  }
  return out
}

function shift(x: Float32Array, samples: number): Float32Array {
  const out = new Float32Array(x.length + Math.max(0, samples))
  for (let i = 0; i < x.length; i++) {
    const j = i + samples
    if (j >= 0 && j < out.length) out[j] = x[i]
  }
  return out
}

describe('encodeWav', () => {
  it('gera cabeçalho RIFF/WAVE PCM 16-bit correto', async () => {
    const left = sine(0.1)
    const right = sine(0.1, 220)
    const blob = encodeWav([left, right], SR)
    const view = new DataView(await blob.arrayBuffer())
    const str = (o: number, n: number) => String.fromCharCode(...Array.from({ length: n }, (_, i) => view.getUint8(o + i)))

    expect(blob.type).toBe('audio/wav')
    expect(str(0, 4)).toBe('RIFF')
    expect(str(8, 4)).toBe('WAVE')
    expect(view.getUint16(20, true)).toBe(1)        // PCM
    expect(view.getUint16(22, true)).toBe(2)        // canais
    expect(view.getUint32(24, true)).toBe(SR)
    expect(view.getUint16(34, true)).toBe(16)
    expect(view.getUint32(40, true)).toBe(left.length * 2 * 2)
    expect(blob.size).toBe(44 + left.length * 4)
  })

  it('satura amostras fora de -1..1', async () => {
    const blob = encodeWav([new Float32Array([2, -2])], SR)
    const view = new DataView(await blob.arrayBuffer())
    expect(view.getInt16(44, true)).toBe(0x7fff)
    expect(view.getInt16(46, true)).toBe(-0x8000)
  })
})

describe('encodeMp3', () => {
  it('gera MP3 com frame MPEG válido e tamanho coerente com 320 kbps', async () => {
    const seconds = 2
    const progress: number[] = []
    const mp3 = await encodeMp3([sine(seconds), sine(seconds, 330)], SR, f => progress.push(f))

    // Procura o primeiro sync word de frame MPEG (0xFFE) — o LAME pode gravar um frame Xing/Info antes.
    let syncAt = -1
    for (let i = 0; i < mp3.length - 1; i++) {
      if (mp3[i] === 0xff && (mp3[i + 1] & 0xe0) === 0xe0) { syncAt = i; break }
    }
    expect(syncAt).toBeGreaterThanOrEqual(0)
    // MPEG-1 Layer III: bits de versão = 11, camada = 01
    expect((mp3[syncAt + 1] >> 3) & 0x3).toBe(0x3)
    expect((mp3[syncAt + 1] >> 1) & 0x3).toBe(0x1)

    const expectedBytes = (320_000 / 8) * seconds
    expect(mp3.length).toBeGreaterThan(expectedBytes * 0.9)
    expect(mp3.length).toBeLessThan(expectedBytes * 1.2)
    expect(progress[progress.length - 1]).toBe(1)
  })

  it('mixa mais de 2 canais para estéreo', async () => {
    const ch = sine(0.5)
    const mp3 = await encodeMp3([ch, ch, ch, ch], SR)
    expect(mp3.length).toBeGreaterThan(0)
  })
})

describe('measureDelaySamples', () => {
  const ref = new Float32Array(SR * 3)
  ref.set(noiseBurst(2), SR / 2) // silêncio inicial + trecho audível

  it.each([0, 1105, 2257, -300])('encontra atraso de %i amostras', (delay) => {
    const cand = shift(ref, delay)
    expect(measureDelaySamples(ref, cand, SR)).toBe(delay)
  })

  it('aceita canais e mixa para mono', () => {
    const cand = shift(ref, 529)
    expect(measureDelaySamples([ref, ref], [cand, cand], SR)).toBe(529)
  })
})


describe('renderStretched', () => {
  it('devolve o próprio buffer quando não há ajuste (sem carregar o motor)', async () => {
    const fake = { duration: 1, numberOfChannels: 1, sampleRate: SR } as unknown as AudioBuffer
    expect(await renderStretched(fake, 1, 0)).toBe(fake)
  })

  it('recusa velocidade inválida', async () => {
    const fake = { duration: 1, numberOfChannels: 1, sampleRate: SR } as unknown as AudioBuffer
    await expect(renderStretched(fake, 0, 2)).rejects.toThrow(/Velocidade inválida/)
  })
})
