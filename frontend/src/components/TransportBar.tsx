import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Square, X, Repeat } from 'lucide-react'
import type { PlaybackEngine } from '../utility/playbackEngine'
import { usePlaybackFrame } from '../hooks/usePlayback'
import { formatClock, normalizeLoop, positionFromFraction } from '../utility/playbackMath'

/** Quanto as setas andam no tempo, em segundos. */
const SKIP_SECONDS = 5
/** Movimento mínimo (px) para um arrasto virar seleção de loop em vez de clique. */
const DRAG_THRESHOLD_PX = 4

const TEXT_FIELDS = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]'
const CLICKABLE = 'button, a, [role="button"]'

/**
 * Atalhos de teclado não devem roubar teclas de quem digita, nem a barra de espaço de um botão
 * focado (que já o aciona), nem valer por trás de um modal aberto.
 */
export function isShortcutBlocked(event: Pick<KeyboardEvent, 'key' | 'target' | 'ctrlKey' | 'metaKey' | 'altKey'>): boolean {
    if (event.ctrlKey || event.metaKey || event.altKey) return true

    const target = event.target instanceof Element ? event.target : null
    if (target?.closest(TEXT_FIELDS)) return true
    if (event.key === ' ' && target?.closest(CLICKABLE)) return true

    return document.querySelector('[role="dialog"][aria-modal="true"]') !== null
}

interface TransportBarProps {
    engine: PlaybackEngine
}

function TransportBar({ engine }: TransportBarProps) {
    const playheadRef = useRef<HTMLDivElement | null>(null)
    const clockRef = useRef<HTMLSpanElement | null>(null)
    const scrubberRef = useRef<HTMLDivElement | null>(null)
    const drag = useRef<{ startFraction: number; startX: number; moved: boolean } | null>(null)
    const [selection, setSelection] = useState<{ a: number; b: number } | null>(null)

    const state = usePlaybackFrame(engine, position => {
        const { duration } = engine.getState()
        if (playheadRef.current) {
            playheadRef.current.style.left = `${duration > 0 ? Math.min(100, (position / duration) * 100) : 0}%`
        }
        if (clockRef.current) clockRef.current.textContent = formatClock(position)
    })

    const { duration, playing, loop } = state
    const ready = duration > 0

    // ---------- atalhos ----------
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (isShortcutBlocked(event)) return

            switch (event.key) {
                case ' ':
                    event.preventDefault()
                    if (engine.getState().playing) engine.pause()
                    else engine.play()
                    break
                case 'Home':
                    event.preventDefault()
                    engine.seek(0)
                    break
                case 'ArrowLeft':
                    event.preventDefault()
                    engine.seek(engine.getPosition() - SKIP_SECONDS)
                    break
                case 'ArrowRight':
                    event.preventDefault()
                    engine.seek(engine.getPosition() + SKIP_SECONDS)
                    break
            }
        }

        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [engine])

    // ---------- linha do tempo: clique = ir; arrastar = selecionar loop ----------
    const fractionAt = (clientX: number) => {
        const rect = scrubberRef.current?.getBoundingClientRect()
        if (!rect || rect.width === 0) return 0
        return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!ready) return
        e.currentTarget.setPointerCapture?.(e.pointerId)
        drag.current = { startFraction: fractionAt(e.clientX), startX: e.clientX, moved: false }
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current
        if (!d) return
        if (!d.moved && Math.abs(e.clientX - d.startX) > DRAG_THRESHOLD_PX) d.moved = true
        if (d.moved) setSelection({ a: d.startFraction, b: fractionAt(e.clientX) })
    }

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current
        drag.current = null
        setSelection(null)
        if (!d) return

        const end = fractionAt(e.clientX)
        if (d.moved) {
            const region = normalizeLoop(d.startFraction * duration, end * duration, duration)
            if (region) {
                engine.setLoop(region)
                return
            }
        }
        engine.seek(positionFromFraction(end, duration))
    }

    const cancelDrag = () => {
        drag.current = null
        setSelection(null)
    }

    const region = selection
        ? { left: Math.min(selection.a, selection.b) * 100, width: Math.abs(selection.a - selection.b) * 100 }
        : loop && ready
            ? { left: (loop.start / duration) * 100, width: ((loop.end - loop.start) / duration) * 100 }
            : null

    return (
        <div className="transport-bar" role="region" aria-label="Reprodução">
            <div className="transport-buttons">
                <button
                    className="transport-btn"
                    onClick={() => engine.stop()}
                    disabled={!ready}
                    title="Parar e voltar ao início"
                    aria-label="Parar"
                >
                    <Square size={16} />
                </button>
                <button
                    className="transport-btn transport-play"
                    onClick={() => (playing ? engine.pause() : engine.play())}
                    disabled={!ready}
                    title={playing ? 'Pausar (Espaço)' : 'Ouvir tudo (Espaço)'}
                    aria-label={playing ? 'Pausar' : 'Ouvir tudo'}
                >
                    {playing ? <Pause size={20} /> : <Play size={20} />}
                </button>
            </div>

            <div className="transport-clock" aria-hidden="true">
                <span ref={clockRef}>0:00</span>
                <span className="transport-clock-sep"> / </span>
                <span>{formatClock(duration)}</span>
            </div>

            <div
                ref={scrubberRef}
                className={`transport-scrubber${ready ? '' : ' disabled'}`}
                role="slider"
                tabIndex={ready ? 0 : -1}
                aria-label="Posição da reprodução"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(engine.getPosition())}
                aria-valuetext={formatClock(engine.getPosition())}
                aria-disabled={!ready}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={cancelDrag}
                title={ready ? 'Clique para ir a um ponto; arraste para repetir um trecho' : 'Carregando faixas…'}
            >
                {region && (
                    <div
                        className={`transport-region${selection ? ' selecting' : ''}`}
                        style={{ left: `${region.left}%`, width: `${region.width}%` }}
                    />
                )}
                <div ref={playheadRef} className="transport-playhead" />
            </div>

            {loop && ready ? (
                <button
                    className="transport-loop active"
                    onClick={() => engine.setLoop(null)}
                    title="Parar de repetir o trecho"
                    aria-label={`Repetindo de ${formatClock(loop.start)} a ${formatClock(loop.end)}. Limpar trecho`}
                >
                    <Repeat size={14} />
                    {formatClock(loop.start)}–{formatClock(loop.end)}
                    <X size={14} />
                </button>
            ) : (
                <span className="transport-hint" aria-hidden="true">Arraste na linha para repetir um trecho</span>
            )}
        </div>
    )
}

export { TransportBar }
