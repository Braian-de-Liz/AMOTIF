import { describe, it, expect } from 'vitest'
import { ZodError } from 'zod'
import { formatZodErrors } from '@/utility/validationHelpers'

describe('formatZodErrors', () => {
  it('deve retornar null para null', () => {
    expect(formatZodErrors(null)).toBeNull()
  })

  it('deve retornar null para undefined', () => {
    expect(formatZodErrors(undefined)).toBeNull()
  })

  it('deve retornar string vazia para error sem issues', () => {
    const error = new ZodError([])
    expect(formatZodErrors(error)).toBe('')
  })

  it('deve retornar a mensagem de um unico erro', () => {
    const error = new ZodError([
      { code: 'too_small', minimum: 8, type: 'string', inclusive: true, message: 'Minimo 8 caracteres', path: ['senha'] },
    ])
    expect(formatZodErrors(error)).toBe('Minimo 8 caracteres')
  })

  it('deve juntar multiplos erros com ". "', () => {
    const error = new ZodError([
      { code: 'too_small', minimum: 8, type: 'string', inclusive: true, message: 'Email invalido', path: ['email'] },
      { code: 'too_small', minimum: 8, type: 'string', inclusive: true, message: 'Senha curta', path: ['senha'] },
    ])
    expect(formatZodErrors(error)).toBe('Email invalido. Senha curta')
  })
})
