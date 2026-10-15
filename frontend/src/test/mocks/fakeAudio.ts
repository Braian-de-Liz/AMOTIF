import { vi } from 'vitest'

// AudioContext falso para testar o motor de reprodução sem navegador.
// `currentTime` é controlado pelo teste (avance-o para simular o tempo passando).

export class FakeSource {
  buffer: unknown = null
  onended: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn()
  connect = vi.fn()
  disconnect = vi.fn()
}

export class FakeGain {
  gain = { value: 1 }
  connect = vi.fn()
  disconnect = vi.fn()
}

export class FakeCtx {
  currentTime = 10
  destination = {}
  sources: FakeSource[] = []
  gains: FakeGain[] = []
  resume = vi.fn(async () => {})
  close = vi.fn(async () => {})

  createGain() {
    const g = new FakeGain()
    this.gains.push(g)
    return g
  }

  createBufferSource() {
    const s = new FakeSource()
    this.sources.push(s)
    return s
  }
}

/** AudioBuffer mínimo: o motor só lê `duration`. */
export const fakeBuffer = (duration: number) => ({ duration }) as unknown as AudioBuffer
