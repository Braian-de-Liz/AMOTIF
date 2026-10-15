import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { TransportBar, isShortcutBlocked } from '@/components/TransportBar'
import { PlaybackEngine } from '@/utility/playbackEngine'
import { FakeCtx, fakeBuffer } from '../mocks/fakeAudio'

let engine: PlaybackEngine

/** Barra de 100 px de largura começando em x=0: clientX vira diretamente a % da linha do tempo. */
function mockScrubberRect() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0, right: 100, width: 100, top: 0, bottom: 34, height: 34, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect)
}

const scrubber = () => screen.getByRole('slider', { name: 'Posição da reprodução' })
const key = (k: string, target: Element | Document = document) => fireEvent.keyDown(target, { key: k })

beforeEach(() => {
  vi.useFakeTimers()
  engine = new PlaybackEngine(() => new FakeCtx() as unknown as AudioContext)
  engine.registerTrack('guia', fakeBuffer(10))
  mockScrubberRect()
})

afterEach(() => {
  engine.dispose()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('isShortcutBlocked', () => {
  const base = { key: ' ', ctrlKey: false, metaKey: false, altKey: false }

  it('libera o atalho com o foco no corpo da página', () => {
    expect(isShortcutBlocked({ ...base, target: document.body })).toBe(false)
  })

  it('bloqueia quando se digita em campos de texto', () => {
    for (const tag of ['input', 'textarea', 'select']) {
      expect(isShortcutBlocked({ ...base, target: document.createElement(tag) })).toBe(true)
    }
  })

  it('bloqueia a barra de espaço em botões (que já a usam), mas não as setas', () => {
    const botao = document.createElement('button')
    expect(isShortcutBlocked({ ...base, target: botao })).toBe(true)
    expect(isShortcutBlocked({ ...base, key: 'ArrowLeft', target: botao })).toBe(false)
  })

  it('bloqueia com Ctrl/Cmd/Alt', () => {
    expect(isShortcutBlocked({ ...base, ctrlKey: true, target: document.body })).toBe(true)
    expect(isShortcutBlocked({ ...base, metaKey: true, target: document.body })).toBe(true)
  })

  it('bloqueia com um modal aberto', () => {
    const modal = document.createElement('div')
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    document.body.appendChild(modal)
    expect(isShortcutBlocked({ ...base, target: document.body })).toBe(true)
    modal.remove()
  })
})

describe('TransportBar', () => {
  it('fica desabilitada enquanto nenhuma faixa foi carregada', () => {
    const vazio = new PlaybackEngine(() => new FakeCtx() as unknown as AudioContext)
    render(<TransportBar engine={vazio} />)
    expect(screen.getByRole('button', { name: 'Ouvir tudo' })).toBeDisabled()
    expect(scrubber()).toHaveAttribute('aria-disabled', 'true')
    vazio.dispose()
  })

  it('mostra a duração total', () => {
    render(<TransportBar engine={engine} />)
    expect(screen.getByText('0:10')).toBeInTheDocument()
  })

  it('o botão toca e pausa', () => {
    render(<TransportBar engine={engine} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ouvir tudo' }))
    expect(engine.getState().playing).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(engine.getState().playing).toBe(false)
  })

  it('o botão parar volta ao início', () => {
    render(<TransportBar engine={engine} />)
    act(() => engine.seek(4))
    fireEvent.click(screen.getByRole('button', { name: 'Parar' }))
    expect(engine.getPosition()).toBe(0)
  })

  describe('atalhos', () => {
    it('Espaço toca e pausa', () => {
      render(<TransportBar engine={engine} />)
      key(' ')
      expect(engine.getState().playing).toBe(true)
      key(' ')
      expect(engine.getState().playing).toBe(false)
    })

    it('Espaço digitado num campo de texto não toca', () => {
      render(
        <>
          <TransportBar engine={engine} />
          <textarea aria-label="comentário" />
        </>
      )
      key(' ', screen.getByLabelText('comentário'))
      expect(engine.getState().playing).toBe(false)
    })

    it('setas andam 5 s e Home volta ao início', () => {
      render(<TransportBar engine={engine} />)
      key('ArrowRight')
      key('ArrowRight')
      expect(engine.getPosition()).toBe(10)
      key('ArrowLeft')
      expect(engine.getPosition()).toBe(5)
      key('Home')
      expect(engine.getPosition()).toBe(0)
    })

    it('para de escutar ao desmontar', () => {
      const { unmount } = render(<TransportBar engine={engine} />)
      unmount()
      key(' ')
      expect(engine.getState().playing).toBe(false)
    })
  })

  describe('linha do tempo', () => {
    it('clicar vai para aquele ponto', () => {
      render(<TransportBar engine={engine} />)
      fireEvent.pointerDown(scrubber(), { clientX: 50, pointerId: 1 })
      fireEvent.pointerUp(scrubber(), { clientX: 50, pointerId: 1 })
      expect(engine.getPosition()).toBe(5)
      expect(engine.getState().loop).toBeNull()
    })

    it('arrastar seleciona um trecho para repetir', () => {
      render(<TransportBar engine={engine} />)
      fireEvent.pointerDown(scrubber(), { clientX: 20, pointerId: 1 })
      fireEvent.pointerMove(scrubber(), { clientX: 60, pointerId: 1 })
      fireEvent.pointerUp(scrubber(), { clientX: 60, pointerId: 1 })
      expect(engine.getState().loop).toEqual({ start: 2, end: 6 })
      expect(screen.getByRole('button', { name: /Repetindo de 0:02 a 0:06/ })).toBeInTheDocument()
    })

    it('arrastar da direita para a esquerda também funciona', () => {
      render(<TransportBar engine={engine} />)
      fireEvent.pointerDown(scrubber(), { clientX: 80, pointerId: 1 })
      fireEvent.pointerMove(scrubber(), { clientX: 30, pointerId: 1 })
      fireEvent.pointerUp(scrubber(), { clientX: 30, pointerId: 1 })
      expect(engine.getState().loop).toEqual({ start: 3, end: 8 })
    })

    it('movimento mínimo conta como clique, não como loop', () => {
      render(<TransportBar engine={engine} />)
      fireEvent.pointerDown(scrubber(), { clientX: 50, pointerId: 1 })
      fireEvent.pointerMove(scrubber(), { clientX: 52, pointerId: 1 })
      fireEvent.pointerUp(scrubber(), { clientX: 52, pointerId: 1 })
      expect(engine.getState().loop).toBeNull()
      expect(engine.getPosition()).toBeCloseTo(5.2)
    })

    it('limpar o trecho remove o loop', () => {
      render(<TransportBar engine={engine} />)
      act(() => engine.setLoop({ start: 2, end: 6 }))
      fireEvent.click(screen.getByRole('button', { name: /Limpar trecho/ }))
      expect(engine.getState().loop).toBeNull()
    })

    it('não faz nada sem faixas carregadas', () => {
      const vazio = new PlaybackEngine(() => new FakeCtx() as unknown as AudioContext)
      render(<TransportBar engine={vazio} />)
      fireEvent.pointerDown(scrubber(), { clientX: 50, pointerId: 1 })
      fireEvent.pointerUp(scrubber(), { clientX: 50, pointerId: 1 })
      expect(vazio.getPosition()).toBe(0)
      vazio.dispose()
    })
  })
})
