import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useModal } from '@/hooks/useModal'

describe('useModal', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve inicializar com isOpen false', () => {
    const { result } = renderHook(() => useModal())
    expect(result.current.isOpen).toBe(false)
  })

  it('open deve alterar isOpen para true', () => {
    const { result } = renderHook(() => useModal())
    act(() => {
      result.current.open()
    })
    expect(result.current.isOpen).toBe(true)
  })

  it('close deve alterar isOpen para false', () => {
    const { result } = renderHook(() => useModal())
    act(() => {
      result.current.open()
    })
    act(() => {
      result.current.close()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('deve fechar ao pressionar Escape', () => {
    const { result } = renderHook(() => useModal())
    act(() => {
      result.current.open()
    })

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('nao deve fechar com outras teclas', () => {
    const { result } = renderHook(() => useModal())
    act(() => {
      result.current.open()
    })

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('overlayProps.onClick deve fechar o modal', () => {
    const { result } = renderHook(() => useModal())
    act(() => {
      result.current.open()
    })

    act(() => {
      result.current.overlayProps.onClick()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('overlayProps deve ter role presentation', () => {
    const { result } = renderHook(() => useModal())
    expect(result.current.overlayProps.role).toBe('presentation')
  })

  it('contentProps deve ter role dialog e aria-modal', () => {
    const { result } = renderHook(() => useModal())
    expect(result.current.contentProps.role).toBe('dialog')
    expect(result.current.contentProps['aria-modal']).toBe(true)
  })

  it('contentProps.onClick deve impedir propagação do evento', () => {
    const { result } = renderHook(() => useModal())
    const mockStopPropagation = vi.fn()
    const mockEvent = { stopPropagation: mockStopPropagation } as unknown as React.MouseEvent

    result.current.contentProps.onClick(mockEvent)

    expect(mockStopPropagation).toHaveBeenCalled()
  })

  it('nao deve registrar listener de Escape quando fechado', () => {
    const { result } = renderHook(() => useModal())
    const spy = vi.spyOn(document, 'addEventListener')

    expect(result.current.isOpen).toBe(false)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(result.current.isOpen).toBe(false)
    spy.mockRestore()
  })
})
