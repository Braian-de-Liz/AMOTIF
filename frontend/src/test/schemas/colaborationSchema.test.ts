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

  it('usa "membro" e papel MUSICO quando função e papel não são informados', () => {
    const result = inviteSchema.safeParse({ email_destinatario: 'amigo@email.com' })
    expect(result.success && result.data).toEqual({ email_destinatario: 'amigo@email.com', cargo: 'membro', papel: 'MUSICO' })
  })

  it('mantém função e papel informados', () => {
    const result = inviteSchema.safeParse({ email_destinatario: 'amigo@email.com', cargo: ' baixista ', papel: 'PRODUTOR' })
    expect(result.success && result.data).toEqual({ email_destinatario: 'amigo@email.com', cargo: 'baixista', papel: 'PRODUTOR' })
  })

  it('rejeita papel inválido e função curta demais', () => {
    expect(inviteSchema.safeParse({ email_destinatario: 'a@b.com', papel: 'DONO' }).success).toBe(false)
    expect(inviteSchema.safeParse({ email_destinatario: 'a@b.com', cargo: 'x' }).success).toBe(false)
  })
})
