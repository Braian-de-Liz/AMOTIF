import { describe, it, expect } from 'vitest'
import { URL_API, URL_API_TESTE } from '@/utility/url_apis'

describe('url_apis', () => {
  it('URL_API_TESTE deve ser uma string nao vazia', () => {
    expect(typeof URL_API_TESTE).toBe('string')
    expect(URL_API_TESTE.length).toBeGreaterThan(0)
  })

  it('URL_API e URL_API_TESTE devem ser iguais', () => {
    expect(URL_API).toBe(URL_API_TESTE)
  })

  it('deve conter /api no final', () => {
    expect(URL_API_TESTE).toContain('/api')
  })
})
