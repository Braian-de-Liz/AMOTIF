import { describe, it, expect } from 'vitest'
import {
  MIN_LOOP_SECONDS,
  clampPosition,
  delaySeconds,
  formatClock,
  normalizeLoop,
  planTrackStart,
  positionFromFraction,
  totalDuration,
} from '@/utility/playbackMath'

describe('delaySeconds', () => {
  it('converte ms para segundos', () => expect(delaySeconds(500)).toBe(0.5))
  it('trata negativo e inválido como 0', () => {
    expect(delaySeconds(-200)).toBe(0)
    expect(delaySeconds(NaN)).toBe(0)
  })
})

describe('planTrackStart', () => {
  it('começa já, do início do arquivo, quando posição e delay são 0', () => {
    expect(planTrackStart(0, 0, 3)).toEqual({ kind: 'now', offset: 0 })
  })

  it('agenda para depois quando o delay ainda não chegou', () => {
    const plan = planTrackStart(0, 0.5, 3)
    expect(plan.kind).toBe('later')
    expect(plan.kind === 'later' && plan.wait).toBeCloseTo(0.5)
  })

  it('quando já passou do delay entra no meio do arquivo', () => {
    const plan = planTrackStart(2, 0.5, 3)
    expect(plan.kind).toBe('now')
    expect(plan.kind === 'now' && plan.offset).toBeCloseTo(1.5)
  })

  it('exatamente no delay começa do início do arquivo', () => {
    expect(planTrackStart(0.5, 0.5, 3)).toEqual({ kind: 'now', offset: 0 })
  })

  it('faixa que já terminou não entra', () => {
    expect(planTrackStart(4, 0.5, 3)).toEqual({ kind: 'done' })
    expect(planTrackStart(3.5, 0.5, 3)).toEqual({ kind: 'done' })
  })

  it('posição e delay inválidos viram 0', () => {
    expect(planTrackStart(NaN, NaN, 3)).toEqual({ kind: 'now', offset: 0 })
    expect(planTrackStart(-5, -1, 3)).toEqual({ kind: 'now', offset: 0 })
  })
})

describe('totalDuration', () => {
  it('é o fim da última faixa a terminar', () => {
    expect(totalDuration([
      { delaySec: 0, durationSec: 3 },
      { delaySec: 0.5, durationSec: 3 },
      { delaySec: 0, durationSec: 2 },
    ])).toBeCloseTo(3.5)
  })

  it('é 0 sem faixas e ignora valores inválidos', () => {
    expect(totalDuration([])).toBe(0)
    expect(totalDuration([{ delaySec: NaN, durationSec: 4 }])).toBe(4)
    expect(totalDuration([{ delaySec: 1, durationSec: NaN }])).toBe(1)
  })
})

describe('clampPosition / positionFromFraction', () => {
  it('limita ao intervalo [0, total]', () => {
    expect(clampPosition(-1, 10)).toBe(0)
    expect(clampPosition(12, 10)).toBe(10)
    expect(clampPosition(4, 10)).toBe(4)
    expect(clampPosition(NaN, 10)).toBe(0)
  })

  it('converte fração em posição, limitando a fração', () => {
    expect(positionFromFraction(0.5, 10)).toBe(5)
    expect(positionFromFraction(-0.2, 10)).toBe(0)
    expect(positionFromFraction(1.7, 10)).toBe(10)
  })
})

describe('normalizeLoop', () => {
  it('mantém uma região válida', () => {
    expect(normalizeLoop(2, 5, 10)).toEqual({ start: 2, end: 5 })
  })

  it('ordena pontas invertidas', () => {
    expect(normalizeLoop(5, 2, 10)).toEqual({ start: 2, end: 5 })
  })

  it('limita ao tamanho do projeto', () => {
    expect(normalizeLoop(-3, 14, 10)).toEqual({ start: 0, end: 10 })
  })

  it('descarta região curta demais (vira clique)', () => {
    expect(normalizeLoop(2, 2 + MIN_LOOP_SECONDS / 2, 10)).toBeNull()
    expect(normalizeLoop(4, 4, 10)).toBeNull()
  })

  it('aceita região exatamente no tamanho mínimo', () => {
    expect(normalizeLoop(2, 2 + MIN_LOOP_SECONDS, 10)).not.toBeNull()
  })
})

describe('formatClock', () => {
  it('formata m:ss', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(75.9)).toBe('1:15')
    expect(formatClock(3600)).toBe('60:00')
  })

  it('não quebra com valores inválidos', () => {
    expect(formatClock(-4)).toBe('0:00')
    expect(formatClock(NaN)).toBe('0:00')
  })
})
