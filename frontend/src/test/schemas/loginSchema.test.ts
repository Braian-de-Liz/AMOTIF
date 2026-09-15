import { describe, it, expect } from 'vitest'
import { loginSchema } from '@/schemas/loginSchema'

describe('loginSchema', () => {
  const validData = {
    email: 'teste@email.com',
    senha: 'senha1234',
  }

  it('deve aceitar dados validos', () => {
    const result = loginSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('deve rejeitar email invalido', () => {
    const result = loginSchema.safeParse({ ...validData, email: 'email-ruim' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar email ausente', () => {
    const result = loginSchema.safeParse({ senha: 'senha1234' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar senha muito curta', () => {
    const result = loginSchema.safeParse({ ...validData, senha: '1234567' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('8 caracteres')
    }
  })

  it('deve rejeitar senha ausente', () => {
    const result = loginSchema.safeParse({ email: 'teste@email.com' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar objeto vazio', () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBe(2)
    }
  })
})
