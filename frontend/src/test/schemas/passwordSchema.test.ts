import { describe, it, expect } from 'vitest'
import { passwordSchema } from '@/schemas/passwordSchema'

describe('passwordSchema', () => {
  const validData = {
    senha: 'senhaantiga',
    nova_senha: 'novasenha1',
    confirmar_senha: 'novasenha1',
  }

  it('deve aceitar senhas validas e conferentes', () => {
    const result = passwordSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('deve rejeitar senhas que nao conferem', () => {
    const result = passwordSchema.safeParse({
      ...validData,
      confirmar_senha: 'outrasenha',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('não conferem'))).toBe(true)
    }
  })

  it('deve rejeitar senha atual muito curta', () => {
    const result = passwordSchema.safeParse({ ...validData, senha: '1234567' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar nova senha muito curta', () => {
    const result = passwordSchema.safeParse({ ...validData, nova_senha: '1234567', confirmar_senha: '1234567' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar confirmacao muito curta', () => {
    const result = passwordSchema.safeParse({ ...validData, confirmar_senha: '1234567' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar campos faltando', () => {
    const result = passwordSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3)
    }
  })
})
