import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { refreshAccessToken } from '@/utility/refreshToken'

const mockFetch = vi.fn()

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve retornar true quando refresh retorna ok', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 })
    const result = await refreshAccessToken()
    expect(result).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/usuario/refresh'),
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    )
  })

  it('deve retornar false quando refresh retorna erro', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 })
    const result = await refreshAccessToken()
    expect(result).toBe(false)
  })

  it('deve retornar false quando fetch falha', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const result = await refreshAccessToken()
    expect(result).toBe(false)
  })

  it('deve deduplicar chamadas simultaneas', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 })
    const [r1, r2, r3] = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
    ])
    expect(r1).toBe(true)
    expect(r2).toBe(true)
    expect(r3).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
