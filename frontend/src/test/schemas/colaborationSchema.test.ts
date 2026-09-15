import { describe, it, expect } from 'vitest'
import { inviteSchema } from '@/schemas/colaborationSchema'

describe('inviteSchema', () => {
  it('deve aceitar email valido', () => {
    const result = inviteSchema.safeParse({ email_destinatario: 'amigo@email.com' })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar email invalido', () => {
    const result = inviteSchema.safeParse({ email_destinatario: 'nao-e-email' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar campo ausente', () => {
    const result = inviteSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('deve rejeitar string vazia', () => {
    const result = inviteSchema.safeParse({ email_destinatario: '' })
    expect(result.success).toBe(false)
  })
})
