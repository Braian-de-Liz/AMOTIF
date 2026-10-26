import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { previewPlayer } from '@/utility/previewPlayer'

// jsdom não toca mídia: play/pause/load viram spies e guardamos o <audio> para disparar eventos.
let el: HTMLAudioElement | null = null
let play: ReturnType<typeof vi.spyOn>
let pause: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLAudioElement) {
    el = this
    return Promise.resolve()
  })
  pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
})

afterEach(() => {
  previewPlayer.stop()
  vi.restoreAllMocks()
})

describe('previewPlayer', () => {
  it('toca a prévia pedida', async () => {
    await previewPlayer.toggle('a', 'https://x/a.mp3')
    expect(previewPlayer.getState()).toMatchObject({ id: 'a', playing: true })
    expect(el?.src).toBe('https://x/a.mp3')
  })

  it('tocar outra prévia pausa a anterior e troca a fonte', async () => {
    await previewPlayer.toggle('a', 'https://x/a.mp3')
    pause.mockClear()
    await previewPlayer.toggle('b', 'https://x/b.mp3')

    expect(pause).toHaveBeenCalled()
    expect(previewPlayer.getState()).toMatchObject({ id: 'b', playing: true, progress: 0 })
    expect(el?.src).toBe('https://x/b.mp3')
  })

  it('a mesma prévia alterna entre pausar e retomar', async () => {
    await previewPlayer.toggle('a', 'https://x/a.mp3')
    await previewPlayer.toggle('a', 'https://x/a.mp3')
    expect(previewPlayer.getState()).toMatchObject({ id: 'a', playing: false })

    await previewPlayer.toggle('a', 'https://x/a.mp3')
    expect(previewPlayer.getState()).toMatchObject({ id: 'a', playing: true })
  })

  it('volta ao repouso e rejeita quando o navegador não consegue tocar', async () => {
    play.mockRejectedValueOnce(new DOMException('bloqueado', 'NotAllowedError'))
    await expect(previewPlayer.toggle('a', 'https://x/a.mp3')).rejects.toThrow()
    expect(previewPlayer.getState()).toEqual({ id: null, playing: false, progress: 0 })
  })

  it('stop() e o fim do áudio zeram o estado', async () => {
    await previewPlayer.toggle('a', 'https://x/a.mp3')
    el!.dispatchEvent(new Event('ended'))
    expect(previewPlayer.getState()).toEqual({ id: null, playing: false, progress: 0 })

    await previewPlayer.toggle('a', 'https://x/a.mp3')
    previewPlayer.stop()
    expect(previewPlayer.getState()).toEqual({ id: null, playing: false, progress: 0 })
  })

  it('avisa os inscritos a cada mudança', async () => {
    const listener = vi.fn()
    const unsubscribe = previewPlayer.subscribe(listener)
    await previewPlayer.toggle('a', 'https://x/a.mp3')
    expect(listener).toHaveBeenCalled()

    unsubscribe()
    listener.mockClear()
    previewPlayer.stop()
    expect(listener).not.toHaveBeenCalled()
  })
})
