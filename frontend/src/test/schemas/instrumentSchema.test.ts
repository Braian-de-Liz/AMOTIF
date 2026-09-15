import { describe, it, expect } from 'vitest'
import { instrumentSchema } from '@/schemas/instrumentSchema'

describe('instrumentSchema', () => {
  it('deve aceitar um instrumento', () => {
    const result = instrumentSchema.safeParse({ instrumentos: ['Guitarra'] })
    expect(result.success).toBe(true)
  })

  it('deve aceitar multiplos instrumentos', () => {
    const result = instrumentSchema.safeParse({
      instrumentos: ['Guitarra', 'Baixo', 'Bateria'],
    })
    expect(result.success).toBe(true)
  })

  it('deve aceitar ate 10 instrumentos', () => {
    const result = instrumentSchema.safeParse({
      instrumentos: Array(10).fill('Instrumento'),
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar array vazio', () => {
    const result = instrumentSchema.safeParse({ instrumentos: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('pelo menos um')
    }
  })

  it('deve rejeitar mais de 10 instrumentos', () => {
    const result = instrumentSchema.safeParse({
      instrumentos: Array(11).fill('Instrumento'),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('10 instrumentos')
    }
  })

  it('deve rejeitar string vazia no array', () => {
    const result = instrumentSchema.safeParse({ instrumentos: [''] })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar instrumento com mais de 50 caracteres', () => {
    const result = instrumentSchema.safeParse({ instrumentos: ['A'.repeat(51)] })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar campo ausente', () => {
    const result = instrumentSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
