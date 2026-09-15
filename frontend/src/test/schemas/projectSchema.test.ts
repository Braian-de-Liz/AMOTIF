import { describe, it, expect } from 'vitest'
import { projectSchema, generos } from '@/schemas/projectSchema'

describe('projectSchema', () => {
  const validData = {
    titulo: 'Meu Projeto',
    genero: 'ROCK' as const,
    bpm: 120,
  }

  it('deve aceitar dados validos', () => {
    const result = projectSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('deve aceitar dados com campos opcionais', () => {
    const result = projectSchema.safeParse({
      ...validData,
      escala: 'C',
      descricao: 'Uma descricao legal',
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar titulo muito curto', () => {
    const result = projectSchema.safeParse({ ...validData, titulo: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('2 caracteres')
    }
  })

  it('deve rejeitar genero invalido', () => {
    const result = projectSchema.safeParse({ ...validData, genero: 'BLAH' })
    expect(result.success).toBe(false)
  })

  it('deve aceitar todos os generos validos', () => {
    for (const genero of generos) {
      const result = projectSchema.safeParse({ ...validData, genero })
      expect(result.success).toBe(true)
    }
  })

  it('deve rejeitar bpm menor que 40', () => {
    const result = projectSchema.safeParse({ ...validData, bpm: 39 })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar bpm maior que 300', () => {
    const result = projectSchema.safeParse({ ...validData, bpm: 301 })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar bpm nao inteiro', () => {
    const result = projectSchema.safeParse({ ...validData, bpm: 120.5 })
    expect(result.success).toBe(false)
  })

  it('deve aceitar bpm nos limites (40 e 300)', () => {
    expect(projectSchema.safeParse({ ...validData, bpm: 40 }).success).toBe(true)
    expect(projectSchema.safeParse({ ...validData, bpm: 300 }).success).toBe(true)
  })

  it('deve rejeitar titulo ausente', () => {
    const result = projectSchema.safeParse({ genero: 'ROCK', bpm: 120 })
    expect(result.success).toBe(false)
  })
})
