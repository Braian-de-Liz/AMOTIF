import { describe, it, expect } from 'vitest'
import { createLayerSchema } from '@/schemas/createLayerSchema'

describe('createLayerSchema', () => {
  const validData = {
    nome_trilha: 'Minha Trilha',
    instrumento_tag: 'Guitarra',
  }

  it('deve aceitar dados validos', () => {
    const result = createLayerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('deve rejeitar nome muito curto', () => {
    const result = createLayerSchema.safeParse({ ...validData, nome_trilha: 'AB' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('3 caracteres')
    }
  })

  it('deve rejeitar instrumento muito curto', () => {
    const result = createLayerSchema.safeParse({ ...validData, instrumento_tag: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('2 caracteres')
    }
  })

  it('deve rejeitar campos vazios', () => {
    const result = createLayerSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBe(2)
    }
  })
})
