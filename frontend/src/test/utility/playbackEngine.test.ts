import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PlaybackEngine } from '@/utility/playbackEngine'
import { FakeCtx, fakeBuffer } from '../mocks/fakeAudio'

const buf = fakeBuffer

let ctx: FakeCtx
let engine: PlaybackEngine

/** Fontes criadas desde a última chamada, com os argumentos de start(). */
const starts = () => ctx.sources.filter(s => s.start.mock.calls.length > 0).map(s => s.start.mock.calls[0])

beforeEach(() => {
  vi.useFakeTimers()
  ctx = new FakeCtx()
  engine = new PlaybackEngine(() => ctx as unknown as AudioContext)
})

afterEach(() => {
  engine.dispose()
  vi.useRealTimers()
})

function twoTracks() {
  engine.registerTrack('guia', buf(3))
  engine.registerTrack('flauta', buf(3), { delayMs: 500, volume: 0.7 })
}

describe('registro de faixas', () => {
  it('a duração total considera o delay da faixa mais longa', () => {
    twoTracks()
    expect(engine.getState().duration).toBeCloseTo(3.5)
  })

  it('aplica volume e mute no ganho, ao vivo', () => {
    twoTracks()
    expect(ctx.gains[1].gain.value).toBe(0.7)
    engine.updateTrack('flauta', { muted: true })
    expect(ctx.gains[1].gain.value).toBe(0)
    engine.updateTrack('flauta', { muted: false, volume: 0.3 })
    expect(ctx.gains[1].gain.value).toBe(0.3)
  })

  it('avisa os assinantes a cada mudança', () => {
    const listener = vi.fn()
    engine.subscribe(listener)
    engine.registerTrack('guia', buf(3))
    engine.play()
    expect(listener).toHaveBeenCalledTimes(2)
  })
})

describe('play', () => {
  it('agenda cada faixa respeitando o delay', () => {
    twoTracks()
    engine.play()
    expect(starts()).toEqual([[10, 0], [10.5, 0]])
    expect(engine.getState().playing).toBe(true)
  })

  it('retoma o contexto no gesto do usuário', () => {
    twoTracks()
    engine.play()
    expect(ctx.resume).toHaveBeenCalled()
  })

  it('tocar de novo com o mix já tocando não duplica fontes', () => {
    twoTracks()
    engine.play()
    engine.play()
    expect(ctx.sources).toHaveLength(2)
  })

  it('a posição acompanha o relógio do contexto', () => {
    twoTracks()
    engine.play()
    ctx.currentTime += 1.25
    expect(engine.getPosition()).toBeCloseTo(1.25)
  })
})

describe('pause e seek', () => {
  it('pausar guarda a posição e para as fontes', () => {
    twoTracks()
    engine.play()
    ctx.currentTime += 1.2
    engine.pause()
    expect(engine.getState().playing).toBe(false)
    expect(engine.getPosition()).toBeCloseTo(1.2)
    expect(ctx.sources.every(s => s.stop.mock.calls.length === 1)).toBe(true)
  })

  it('tocar depois de pausar continua de onde parou', () => {
    twoTracks()
    engine.play()
    ctx.currentTime += 2
    engine.pause()
    ctx.sources.length = 0
    ctx.currentTime += 5
    engine.play()
    // guia entra a 2 s do arquivo; flauta (delay 0,5) a 1,5 s do arquivo
    const t = ctx.currentTime
    expect(starts()).toEqual([[t, 2], [t, 1.5]])
  })

  it('seek durante a reprodução reagenda as faixas na nova posição', () => {
    twoTracks()
    engine.play()
    ctx.sources.length = 0
    engine.seek(2)
    const t = ctx.currentTime
    expect(starts()).toEqual([[t, 2], [t, 1.5]])
    expect(engine.getPosition()).toBeCloseTo(2)
  })

  it('seek para antes do delay agenda a faixa para depois', () => {
    twoTracks()
    engine.seek(0.2)
    engine.play()
    const t = ctx.currentTime
    expect(starts()[0]).toEqual([t, 0.2])
    expect(starts()[1][0]).toBeCloseTo(t + 0.3)
    expect(starts()[1][1]).toBe(0)
  })

  it('seek além do fim de uma faixa não a toca', () => {
    twoTracks()
    engine.seek(3.2)
    engine.play()
    // guia (3 s) já acabou; só a flauta (termina em 3,5) entra, a 2,7 s do arquivo
    expect(starts()).toHaveLength(1)
    expect(starts()[0][1]).toBeCloseTo(2.7)
  })

  it('seek é limitado ao tamanho do projeto e muda a época (redesenho mesmo pausado)', () => {
    twoTracks()
    const antes = engine.getState().epoch
    engine.seek(99)
    expect(engine.getPosition()).toBeCloseTo(3.5)
    expect(engine.getState().epoch).toBeGreaterThan(antes)
  })

  it('stop volta ao início', () => {
    twoTracks()
    engine.play()
    ctx.currentTime += 1
    engine.stop()
    expect(engine.getState().playing).toBe(false)
    expect(engine.getPosition()).toBe(0)
  })
})

describe('ajuste ao vivo durante a reprodução', () => {
  it('mudar o delay reinicia só aquela faixa na posição atual', () => {
    twoTracks()
    engine.play()
    ctx.currentTime += 1
    ctx.sources.length = 0
    engine.updateTrack('flauta', { delayMs: 0 })
    const t = ctx.currentTime
    expect(ctx.sources).toHaveLength(1)
    expect(starts()).toEqual([[t, 1]])
  })

  it('faixa que fica pronta no meio da reprodução entra na posição atual', () => {
    engine.registerTrack('guia', buf(3))
    engine.play()
    ctx.currentTime += 1
    engine.registerTrack('violao', buf(3))
    const t = ctx.currentTime
    const todas = starts()
    expect(todas[todas.length - 1]).toEqual([t, 1])
  })

  it('remover uma faixa tocando para a fonte dela', () => {
    twoTracks()
    engine.play()
    engine.unregisterTrack('flauta')
    expect(ctx.sources[1].stop).toHaveBeenCalled()
    expect(engine.getState().duration).toBeCloseTo(3)
  })

  it('remover a última faixa pausa', () => {
    engine.registerTrack('guia', buf(3))
    engine.play()
    engine.unregisterTrack('guia')
    expect(engine.getState().playing).toBe(false)
  })
})

describe('ouvir só uma camada', () => {
  it('toca apenas a camada escolhida', () => {
    twoTracks()
    engine.playSolo('flauta')
    expect(starts()).toEqual([[10.5, 0]])
    expect(engine.getState().soloId).toBe('flauta')
  })

  it('tocar a mesma camada de novo pausa', () => {
    twoTracks()
    engine.playSolo('flauta')
    engine.playSolo('flauta')
    expect(engine.getState().playing).toBe(false)
    expect(engine.getState().soloId).toBeNull()
  })

  it('passar do solo para o mix mantém a posição e toca tudo', () => {
    twoTracks()
    engine.playSolo('guia')
    ctx.currentTime += 1
    ctx.sources.length = 0
    engine.play()
    const t = ctx.currentTime
    expect(starts()).toEqual([[t, 1], [t, 0.5]])
    expect(engine.getState().soloId).toBeNull()
  })

  it('o solo termina no fim da própria camada', () => {
    twoTracks()
    engine.playSolo('guia')
    ctx.currentTime += 3.1
    engine.tick()
    expect(engine.getState().playing).toBe(false)
  })
})

describe('loop e fim do projeto', () => {
  it('ao passar do fim do loop volta para o início da região', () => {
    twoTracks()
    engine.setLoop({ start: 1, end: 2 })
    engine.play()
    expect(engine.getPosition()).toBeCloseTo(1)
    ctx.currentTime += 1.05
    ctx.sources.length = 0
    engine.tick()
    const t = ctx.currentTime
    expect(engine.getPosition()).toBeCloseTo(1)
    expect(starts()).toEqual([[t, 1], [t, 0.5]])
    expect(engine.getState().playing).toBe(true)
  })

  it('o setInterval interno aplica o loop sem ninguém chamar tick()', () => {
    twoTracks()
    engine.setLoop({ start: 1, end: 2 })
    engine.play()
    ctx.currentTime += 1.2
    vi.advanceTimersByTime(60)
    expect(engine.getPosition()).toBeCloseTo(1)
  })

  it('região curta demais é descartada', () => {
    twoTracks()
    engine.setLoop({ start: 1, end: 1.01 })
    expect(engine.getState().loop).toBeNull()
  })

  it('limpar o loop com null', () => {
    twoTracks()
    engine.setLoop({ start: 1, end: 2 })
    engine.setLoop(null)
    expect(engine.getState().loop).toBeNull()
  })

  it('ao chegar ao fim do projeto para e volta ao início', () => {
    twoTracks()
    engine.play()
    ctx.currentTime += 3.6
    engine.tick()
    expect(engine.getState().playing).toBe(false)
    expect(engine.getPosition()).toBe(0)
  })

  it('tocar com posição no fim recomeça do início', () => {
    twoTracks()
    engine.seek(3.5)
    engine.play()
    expect(starts()[0][1]).toBe(0)
  })
})

describe('dispose', () => {
  it('para tudo e fecha o contexto', () => {
    twoTracks()
    engine.play()
    engine.dispose()
    expect(ctx.close).toHaveBeenCalled()
    expect(ctx.sources.every(s => s.stop.mock.calls.length === 1)).toBe(true)
  })
})
