import { describe, it, expect } from 'vitest'
import { cadastroSchema } from '@/schemas/cadastroSchema'

describe('cadastroSchema', () => {
  const validData = {
    nome_completo: 'Joao da Silva',
    email: 'joao@email.com',
    senha: 'senha1234',
    cpf: '529.982.247-25',
  }

  it('deve aceitar dados validos', () => {
    const result = cadastroSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('deve rejeitar nome muito curto', () => {
    const result = cadastroSchema.safeParse({ ...validData, nome_completo: 'Joao' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('6 caracteres')
    }
  })

  it('deve rejeitar nome muito longo', () => {
    const result = cadastroSchema.safeParse({ ...validData, nome_completo: 'A'.repeat(88) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('87 caracteres')
    }
  })

  it('deve rejeitar email invalido', () => {
    const result = cadastroSchema.safeParse({ ...validData, email: 'email-invalido' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('Email inv'))).toBe(true)
    }
  })

  it('deve rejeitar email muito curto', () => {
    const result = cadastroSchema.safeParse({ ...validData, email: 'a@b.co' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('8 caracteres'))).toBe(true)
    }
  })

  it('deve rejeitar senha muito curta', () => {
    const result = cadastroSchema.safeParse({ ...validData, senha: '1234567' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('8 caracteres')
    }
  })

  it('deve rejeitar senha muito longa', () => {
    const result = cadastroSchema.safeParse({ ...validData, senha: 'A'.repeat(88) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('87 caracteres')
    }
  })

  it('deve rejeitar CPF invalido', () => {
    const result = cadastroSchema.safeParse({ ...validData, cpf: '123.456.789-00' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar campos faltando', () => {
    const result = cadastroSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(4)
    }
  })
})
