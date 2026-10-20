import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mixdown, mixdownToWav, downloadBlob } from '@/utility/mixdown'

interface FakeBuf {
  length: number
  numberOfChannels: number
  sampleRate: number
  duration: number
  getChannelData: (c: number) => Float32Array
}

function makeBuf(channels: Float32Array[], sampleRate = 44100, duration?: number): FakeBuf {
  return {
    length: channels[0].length,
    numberOfChannels: channels.length,
    sampleRate,
    duration: duration ?? channels[0].length / sampleRate,
    getChannelData: c => channels[c],
  }
}

const state = {
  contexts: [] as FakeCtx[],
  decodeDurations: [] as number[],
  render: makeBuf([new Float32Array([0, 0.5]), new Float32Array([0, -0.5])]),
}

class FakeCtx {
  sources: { buffer: unknown; start: ReturnType<typeof vi.fn> }[] = []
  gains: { gain: { value: number } }[] = []
  destination = {}
  constructor(public channels: number, public length: number, public sampleRate: number) {
    state.contexts.push(this)
  }
  async decodeAudioData() {
    const d = state.decodeDurations.shift() ?? 1
    return makeBuf([new Float32Array(2)], 44100, d)
  }
  createBufferSource() {
    const s = { buffer: null as unknown, start: vi.fn(), connect: (n: unknown) => n }
    this.sources.push(s)
    return s
  }
  createGain() {
    const g = { gain: { value: 0 }, connect: (n: unknown) => n }
    this.gains.push(g)
    return g
  }
  async startRendering() {
    return state.render
  }
}

async function readBlob(blob: Blob): Promise<DataView> {
  const buf = await new Promise<ArrayBuffer>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as ArrayBuffer)
    r.onerror = () => reject(r.error)
    r.readAsArrayBuffer(blob)
  })
  return new DataView(buf)
}
const text = (v: DataView, o: number, n: number) =>
  Array.from({ length: n }, (_, i) => String.fromCharCode(v.getUint8(o + i))).join('')

const mockFetch = vi.fn()
const track = (o = {}) => ({ url: 'a', delayMs: 0, volume: 1, ...o })

beforeEach(() => {
  state.contexts = []
  state.decodeDurations = []
  state.render = makeBuf([new Float32Array([0, 0.5]), new Float32Array([0, -0.5])])
  vi.stubGlobal('OfflineAudioContext', FakeCtx)
  mockFetch.mockReset()
  mockFetch.mockResolvedValue({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) })
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('mixdown (mp3)', () => {
  it('gera um MP3 menor que o WAV equivalente', async () => {
    const n = 44100 * 3
    const tone = (hz: number) => Float32Array.from({ length: n }, (_, i) => 0.5 * Math.sin((2 * Math.PI * hz * i) / 44100))
    state.render = makeBuf([tone(440), tone(660)])

    const mp3 = await mixdown([track()], 'mp3')
    const wav = await mixdown([track()], 'wav')

    expect(mp3.type).toBe('audio/mpeg')
    expect(mp3.size).toBeGreaterThan(0)
    expect(mp3.size).toBeLessThan(wav.size / 4)

    const v = await readBlob(mp3)
    // Quadro MP3 começa com sync de 11 bits (0xFFE).
    expect(v.getUint8(0)).toBe(0xff)
    expect(v.getUint8(1) & 0xe0).toBe(0xe0)
  })

  it('aceita mix mono', async () => {
    state.render = makeBuf([new Float32Array(4410).fill(0.1)])
    const mp3 = await mixdown([track()], 'mp3')
    expect(mp3.size).toBeGreaterThan(0)
  })
})

describe('mixdownToWav', () => {
  it('lança erro com lista vazia', async () => {
    await expect(mixdownToWav([])).rejects.toThrow('Nenhuma faixa')
  })

  it('lança erro se o download falhar', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 })
    await expect(mixdownToWav([track()])).rejects.toThrow('Falha ao baixar áudio (404)')
  })

  it('inclui o nome da faixa na mensagem quando o download falha', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 })
    await expect(mixdownToWav([track({ label: 'Baixo base' })])).rejects.toThrow(
      'Falha ao baixar áudio (404) da faixa "Baixo base"'
    )
  })

  it('identifica a faixa quando a rede falha', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(mixdownToWav([track({ label: 'Flauta melodia' })])).rejects.toThrow(
      'Falha de rede ao baixar áudio da faixa "Flauta melodia"'
    )
  })

  it('gera cabeçalho WAV válido (RIFF/WAVE/fmt/data, 16 bits, 2 canais)', async () => {
    const blob = await mixdownToWav([track()])
    expect(blob.type).toBe('audio/wav')
    const v = await readBlob(blob)
    const dataSize = 2 * 2 * 2
    expect(text(v, 0, 4)).toBe('RIFF')
    expect(v.getUint32(4, true)).toBe(36 + dataSize)
    expect(text(v, 8, 4)).toBe('WAVE')
    expect(text(v, 12, 4)).toBe('fmt ')
    expect(v.getUint32(16, true)).toBe(16)
    expect(v.getUint16(20, true)).toBe(1)
    expect(v.getUint16(22, true)).toBe(2)
    expect(v.getUint32(24, true)).toBe(44100)
    expect(v.getUint32(28, true)).toBe(44100 * 2 * 2)
    expect(v.getUint16(32, true)).toBe(4)
    expect(v.getUint16(34, true)).toBe(16)
    expect(text(v, 36, 4)).toBe('data')
    expect(v.getUint32(40, true)).toBe(dataSize)
    expect(v.byteLength).toBe(44 + dataSize)
  })

  it('intercala os canais e converte para int16', async () => {
    const v = await readBlob(await mixdownToWav([track()]))
    expect(v.getInt16(44, true)).toBe(0)
    expect(v.getInt16(46, true)).toBe(0)
    expect(v.getInt16(48, true)).toBe(Math.trunc(0.5 * 0x7fff))
    expect(v.getInt16(50, true)).toBe(-0.5 * 0x8000)
  })

  it('aplica delay (ms -> s) e volume em cada faixa', async () => {
    await mixdownToWav([
      track({ delayMs: 500, volume: 0.25 }),
      track({ delayMs: 2000, volume: 0.8 }),
    ])
    const ctx = state.contexts[1]
    expect(ctx.sources[0].start).toHaveBeenCalledWith(0.5)
    expect(ctx.sources[1].start).toHaveBeenCalledWith(2)
    expect(ctx.gains[0].gain.value).toBe(0.25)
    expect(ctx.gains[1].gain.value).toBe(0.8)
  })

  it('delay/volume inválidos (NaN) viram 0 e 1; delay negativo vira 0', async () => {
    await mixdownToWav([track({ delayMs: NaN, volume: NaN }), track({ delayMs: -100 })])
    const ctx = state.contexts[1]
    expect(ctx.sources[0].start).toHaveBeenCalledWith(0)
    expect(ctx.gains[0].gain.value).toBe(1)
    expect(ctx.sources[1].start).toHaveBeenCalledWith(0)
  })

  it('dimensiona o contexto final pela maior duração + delay', async () => {
    state.decodeDurations = [1, 2]
    await mixdownToWav([track({ delayMs: 3000 }), track()])
    const ctx = state.contexts[1]
    expect(ctx.length).toBe(4 * 44100)
    expect(ctx.channels).toBe(2)
    expect(ctx.sampleRate).toBe(44100)
  })

  it('normaliza quando o pico passa de 1.0 (pico vira 0.98)', async () => {
    state.render = makeBuf([new Float32Array([2, -1]), new Float32Array([0, 0])])
    const v = await readBlob(await mixdownToWav([track()]))
    expect(v.getInt16(44, true)).toBe(Math.trunc(0.98 * 0x7fff))
    expect(v.getInt16(48, true)).toBe(Math.trunc(-0.49 * 0x8000))
  })

  it('não altera amostras quando o pico é <= 1.0', async () => {
    state.render = makeBuf([new Float32Array([1, -1]), new Float32Array([0.25, 0])])
    const v = await readBlob(await mixdownToWav([track()]))
    expect(v.getInt16(44, true)).toBe(0x7fff)
    expect(v.getInt16(46, true)).toBe(Math.trunc(0.25 * 0x7fff))
    expect(v.getInt16(48, true)).toBe(-0x8000)
  })
})

describe('downloadBlob', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('cria <a>, clica com o nome do arquivo e revoga a URL depois', () => {
    const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: revoke })
    let seen: { download: string; href: string; attached: boolean } | undefined
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      seen = { download: this.download, href: this.href, attached: document.body.contains(this) }
    })
    downloadBlob(new Blob(['x']), 'mix.wav')
    expect(click).toHaveBeenCalledTimes(1)
    expect(seen).toEqual({ download: 'mix.wav', href: 'blob:fake', attached: true })
    expect(document.querySelector('a[download]')).toBeNull()
    expect(revoke).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(revoke).toHaveBeenCalledWith('blob:fake')
  })
})
