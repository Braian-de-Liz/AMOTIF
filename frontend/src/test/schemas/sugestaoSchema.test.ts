import { describe, it, expect } from 'vitest'
import { criarSugestaoSchema } from '@/schemas/sugestaoSchema'

describe('criarSugestaoSchema', () => {
  const validData = {
    titulo: 'Minha Sugestao',
    descricao: 'Uma descricao da sugestao',
  }

  it('deve aceitar dados validos', () => {
    const result = criarSugestaoSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('deve rejeitar titulo muito curto', () => {
    const result = criarSugestaoSchema.safeParse({ ...validData, titulo: 'AB' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('3 caracteres')
    }
  })

  it('deve rejeitar titulo muito longo', () => {
    const result = criarSugestaoSchema.safeParse({ ...validData, titulo: 'A'.repeat(101) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('100 caracteres')
    }
  })

  it('deve rejeitar descricao vazia', () => {
    const result = criarSugestaoSchema.safeParse({ ...validData, descricao: '' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar descricao muito longa', () => {
    const result = criarSugestaoSchema.safeParse({ ...validData, descricao: 'A'.repeat(2001) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('2000 caracteres')
    }
  })

  it('deve rejeitar campos faltando', () => {
    const result = criarSugestaoSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBe(2)
    }
  })

  it('deve aceitar titulo no limite (3 e 100 chars)', () => {
    expect(criarSugestaoSchema.safeParse({ ...validData, titulo: 'ABC' }).success).toBe(true)
    expect(criarSugestaoSchema.safeParse({ ...validData, titulo: 'A'.repeat(100) }).success).toBe(true)
  })
})
