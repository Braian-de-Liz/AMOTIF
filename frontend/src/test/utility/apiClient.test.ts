import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient, api } from '@/utility/apiClient'

const mockFetch = vi.fn()

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve fazer request com credentials include', async () => {
    await apiClient('/test')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({ credentials: 'include' })
    )
  })

  it('deve retornar o json da resposta', async () => {
    const result = await apiClient('/test')
    expect(result).toEqual({ data: 'test' })
  })

  it('deve incluir Content-Type application/json', async () => {
    await apiClient('/test')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    )
  })

  it('deve lancar erro em respostas com erro', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ mensagem: 'Erro interno' }),
    })
    await expect(apiClient('/test')).rejects.toThrow('Erro interno')
  })

  it('deve lancar erro generico quando json falha', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('Parse error')),
    })
    await expect(apiClient('/test')).rejects.toThrow('Erro desconhecido')
  })
})

describe('api helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('api.get deve usar GET', async () => {
    await api.get('/test')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('api.post deve usar POST com body', async () => {
    await api.post('/test', { name: 'test' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'test' }) })
    )
  })

  it('api.put deve usar PUT com body', async () => {
    await api.put('/test', { name: 'updated' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PUT' })
    )
  })

  it('api.delete deve usar DELETE', async () => {
    await api.delete('/test')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})
