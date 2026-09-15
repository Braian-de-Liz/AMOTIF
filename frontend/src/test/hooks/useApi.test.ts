import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useApi, useApiMutation } from '@/hooks/useApi'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

const BASE_URL = 'http://localhost:3333/api'

describe('useApi', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'bypass' })
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
  })

  it('deve carregar dados com sucesso', async () => {
    const { result } = renderHook(() => useApi<{ id: string }[]>('/projetos/feed'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.error).toBeNull()
  })

  it('deve retornar erro em caso de falha', async () => {
    server.use(
      http.get(`${BASE_URL}/rota-que-falha`, () => {
        return HttpResponse.json({ mensagem: 'Erro de teste' }, { status: 500 })
      })
    )

    const { result } = renderHook(() => useApi('/rota-que-falha'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Erro de teste')
    expect(result.current.data).toBeNull()
  })

  it('nao deve carregar quando immediate e false', () => {
    const { result } = renderHook(() =>
      useApi('/projetos/feed', { immediate: false })
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeNull()
  })

  it('deve ter funcao refetch', async () => {
    const { result } = renderHook(() => useApi('/projetos/feed'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.data).toBeDefined()
  })
})

describe('useApiMutation', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'bypass' })
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
  })

  it('deve inicializar com estado padrao', () => {
    const { result } = renderHook(() => useApiMutation())

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.mutate).toBe('function')
  })

  it('deve executar mutate com sucesso', async () => {
    server.use(
      http.post(`${BASE_URL}/test-mutate`, () => {
        return HttpResponse.json({ ok: true })
      })
    )

    const { result } = renderHook(() => useApiMutation())

    let response: unknown = null
    await act(async () => {
      response = await result.current.mutate('/test-mutate', 'POST', { name: 'test' })
    })

    expect(response).toEqual({ ok: true })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('deve capturar erros do mutate', async () => {
    server.use(
      http.post(`${BASE_URL}/test-mutate-error`, () => {
        return HttpResponse.json({ mensagem: 'Falhou' }, { status: 400 })
      })
    )

    const { result } = renderHook(() => useApiMutation())

    await act(async () => {
      await result.current.mutate('/test-mutate-error', 'POST')
    })

    expect(result.current.error).toBe('Falhou')
  })
})
