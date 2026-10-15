import { describe, it, expect } from 'vitest'
import {
  computeStretchRatio,
  isQualityRisk,
  isOutOfRange,
  semitonesToPitchFactor,
  clampSemitones,
  needsProcessing,
  formatAdjustmentLabel,
} from '@/utility/tempo'

describe('computeStretchRatio', () => {
  it('acelera camada gravada mais devagar que o projeto', () => {
    expect(computeStretchRatio(110, 100)).toBeCloseTo(1.1)
  })

  it('desacelera camada gravada mais rápido', () => {
    expect(computeStretchRatio(100, 120)).toBeCloseTo(0.8333, 3)
  })

  it('trata metade e dobro do tempo como equivalentes', () => {
    expect(computeStretchRatio(140, 70)).toBe(1)
    expect(computeStretchRatio(70, 140)).toBe(1)
    expect(computeStretchRatio(120, 240)).toBe(1)
  })

  it('normaliza ajustes grandes para perto de 1', () => {
    // 100/60 = 1,667 -> metade = 0,833
    expect(computeStretchRatio(100, 60)).toBeCloseTo(0.8333, 3)
  })

  it('retorna 1 sem BPM da camada', () => {
    expect(computeStretchRatio(120, null)).toBe(1)
    expect(computeStretchRatio(120, undefined)).toBe(1)
    expect(computeStretchRatio(120, 0)).toBe(1)
  })

  it('retorna exatamente 1 com BPMs iguais', () => {
    expect(computeStretchRatio(120, 120)).toBe(1)
  })
})

describe('isQualityRisk / isOutOfRange', () => {
  it('avisa acima de 20% de ajuste', () => {
    expect(isQualityRisk(1.1)).toBe(false)
    expect(isQualityRisk(1.2)).toBe(false)
    expect(isQualityRisk(1.25)).toBe(true)
    expect(isQualityRisk(0.75)).toBe(true)
  })

  it('detecta razão fora da faixa do motor', () => {
    expect(isOutOfRange(0.74)).toBe(true)
    expect(isOutOfRange(1.51)).toBe(true)
    expect(isOutOfRange(1)).toBe(false)
  })
})

describe('semitons', () => {
  it('converte semitons em fator de frequência', () => {
    expect(semitonesToPitchFactor(12)).toBeCloseTo(2)
    expect(semitonesToPitchFactor(-12)).toBeCloseTo(0.5)
    expect(semitonesToPitchFactor(0)).toBe(1)
  })

  it('limita e arredonda', () => {
    expect(clampSemitones(15)).toBe(12)
    expect(clampSemitones(-20)).toBe(-12)
    expect(clampSemitones(2.4)).toBe(2)
  })
})

describe('needsProcessing / formatAdjustmentLabel', () => {
  it('só processa se houver ajuste', () => {
    expect(needsProcessing(1, 0)).toBe(false)
    expect(needsProcessing(1.1, 0)).toBe(true)
    expect(needsProcessing(1, -2)).toBe(true)
  })

  it('monta o rótulo', () => {
    expect(formatAdjustmentLabel(110, 100, 0)).toBe('100→110 BPM')
    expect(formatAdjustmentLabel(110, 100, 2)).toBe('100→110 BPM · +2 st')
    expect(formatAdjustmentLabel(110, null, -3)).toBe('-3 st')
    expect(formatAdjustmentLabel(140, 70, 0)).toBe('')
  })
})
