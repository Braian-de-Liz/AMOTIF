import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { PlaybackEngine, type PlaybackState } from '../utility/playbackEngine'

/** Cria o motor de reprodução do Studio (um por tela) e o descarta ao sair. */
export function usePlayback(): PlaybackEngine {
    // O AudioContext só nasce no primeiro uso, então criar o motor no render é inofensivo
    // (inclusive com o StrictMode chamando o inicializador duas vezes).
    const [engine] = useState(() => new PlaybackEngine())

    useEffect(() => () => engine.dispose(), [engine])

    return engine
}

/** Estado observável do motor (tocando, solo, loop, duração, época). */
export function usePlaybackState(engine: PlaybackEngine): PlaybackState {
    return useSyncExternalStore(engine.subscribe, engine.getState)
}

/**
 * Chama `onFrame(posição)` a cada quadro de animação enquanto toca, e uma vez a cada mudança
 * (seek, pausa, loop) quando parado. Serve para mover cursores e relógios direto no DOM,
 * sem re-renderizar o React 60 vezes por segundo.
 */
export function usePlaybackFrame(engine: PlaybackEngine, onFrame: (position: number) => void): PlaybackState {
    const state = usePlaybackState(engine)

    const callback = useRef(onFrame)
    useEffect(() => { callback.current = onFrame })

    useEffect(() => {
        callback.current(engine.getPosition())
        if (!state.playing) return

        let frame = 0
        const loop = () => {
            callback.current(engine.getPosition())
            frame = requestAnimationFrame(loop)
        }
        frame = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frame)
    }, [engine, state.playing, state.epoch])

    return state
}
