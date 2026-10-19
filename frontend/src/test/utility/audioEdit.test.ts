import { describe, it, expect } from 'vitest'
import {
  clampSelection,
  sliceChannels,
  removeRange,
  applyFades,
  concatChannels,
  parseTime,
  formatTimePrecise,
  zoomToPxPerSec,
} from '@/utility/audioEdit'

const SR = 100 // 100 amostras por segundo deixa as contas legíveis

function ramp(length: number, value = 1): Float32Array {
  return new Float32Array(length).fill(value)
}

describe('clampSelection', () => {
  it('mantém valores válidos', () => {
    expect(clampSelection(1, 3, 10)).toEqual({ start: 1, end: 3 })
  })

  it('limita ao intervalo da faixa', () => {
    expect(clampSelection(-2, 15, 10)).toEqual({ start: 0, end: 10 })
  })

  it('troca as pontas quando vêm invertidas', () => {
    expect(clampSelection(5, 2, 10)).toEqual({ start: 2, end: 5 })
  })

  it('impõe um tamanho mínimo', () => {
    const { start, end } = clampSelection(4, 4, 10)
    expect(end - start).toBeGreaterThan(0)
  })

  it('expande para trás quando não cabe à frente', () => {
    const { start, end } = clampSelection(10, 10, 10)
    expect(end).toBe(10)
    expect(start).toBeLessThan(10)
  })
})

describe('sliceChannels', () => {
  it('mantém só o trecho pedido, em todos os canais', () => {
    const left = Float32Array.from({ length: 1000 }, (_, i) => i)
    const right = Float32Array.from({ length: 1000 }, (_, i) => -i)
    const [l, r] = sliceChannels([left, right], SR, 2, 4)
    expect(l.length).toBe(200)
    expect(l[0]).toBe(200)
    expect(r[0]).toBe(-200)
  })

  it('não passa do fim do áudio', () => {
    const [out] = sliceChannels([ramp(100)], SR, 0.5, 99)
    expect(out.length).toBe(50)
  })
})

describe('removeRange', () => {
  it('apaga o trecho e encurta o áudio (descontando o crossfade)', () => {
    const [out] = removeRange([ramp(1000)], SR, 3, 6)
    const crossfade = Math.floor(0.01 * SR)
    expect(out.length).toBe(1000 - 300 - crossfade)
  })

  it('o áudio fora do trecho permanece intacto', () => {
    const data = Float32Array.from({ length: 1000 }, (_, i) => i)
    const [out] = removeRange([data], SR, 3, 6)
    expect(out[0]).toBe(0)
    expect(out[250]).toBe(250)
    expect(out[out.length - 1]).toBe(999)
  })

  it('apagar tudo deixa um áudio vazio', () => {
    const [out] = removeRange([ramp(100)], SR, 0, 1)
    expect(out.length).toBe(0)
  })

  it('trecho vazio devolve uma cópia', () => {
    const data = ramp(100)
    const [out] = removeRange([data], SR, 0.5, 0.5)
    expect(out).not.toBe(data)
    expect(out.length).toBe(100)
  })
})

describe('applyFades', () => {
  it('sobe do silêncio no início e desce a zero no fim', () => {
    const [data] = (() => {
      const channels = [ramp(100)]
      applyFades(channels, SR, 0.2, 0.2)
      return channels
    })()
    expect(data[0]).toBe(0)
    expect(data[10]).toBeCloseTo(0.5)
    expect(data[50]).toBe(1)
    expect(data[99]).toBe(0)
  })

  it('sem fade não altera nada', () => {
    const channels = [ramp(50)]
    applyFades(channels, SR, 0, 0)
    expect(Array.from(channels[0]).every(v => v === 1)).toBe(true)
  })
})

describe('concatChannels', () => {
  it('emenda os trechos em ordem', () => {
    const [out] = concatChannels([[ramp(2, 1)], [ramp(3, 2)]])
    expect(Array.from(out)).toEqual([1, 1, 2, 2, 2])
  })

  it('repete o canal único quando o outro trecho é estéreo', () => {
    const out = concatChannels([[ramp(2, 1)], [ramp(2, 2), ramp(2, 3)]])
    expect(out).toHaveLength(2)
    expect(Array.from(out[1])).toEqual([1, 1, 3, 3])
  })

  it('ignora trechos vazios', () => {
    const [out] = concatChannels([[new Float32Array(0)], [ramp(2, 1)]])
    expect(out.length).toBe(2)
  })
})

describe('parseTime', () => {
  it.each([
    ['83', 83],
    ['83.5', 83.5],
    ['1:23', 83],
    ['1:23.45', 83.45],
    ['1:23,45', 83.45],
    ['  0:05 ', 5],
  ])('entende "%s"', (text, expected) => {
    expect(parseTime(text)).toBeCloseTo(expected)
  })

  it.each(['', 'abc', '1:', ':30', '1:2:3', '-5'])('rejeita "%s"', text => {
    expect(parseTime(text)).toBeNull()
  })
})

describe('formatTimePrecise', () => {
  it('formata com centésimos', () => {
    expect(formatTimePrecise(83.456)).toBe('1:23.46')
    expect(formatTimePrecise(0)).toBe('0:00.00')
  })

  it('não vira negativo', () => {
    expect(formatTimePrecise(-3)).toBe('0:00.00')
  })

  it('vai e volta com parseTime', () => {
    expect(parseTime(formatTimePrecise(125.25))).toBeCloseTo(125.25)
  })
})

describe('zoomToPxPerSec', () => {
  it('nível 0 ajusta à tela e 100 chega ao máximo', () => {
    expect(zoomToPxPerSec(0, 20)).toBeCloseTo(20)
    expect(zoomToPxPerSec(100, 20)).toBeCloseTo(1000)
  })

  it('cresce de forma monótona', () => {
    expect(zoomToPxPerSec(50, 20)).toBeGreaterThan(zoomToPxPerSec(25, 20))
  })

  it('áudio já maior que o máximo não tem zoom', () => {
    expect(zoomToPxPerSec(80, 2000)).toBe(2000)
  })
})
