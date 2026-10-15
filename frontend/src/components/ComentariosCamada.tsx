import { useState } from 'react'
import { Check, RotateCcw, Trash2, Crosshair } from 'lucide-react'
import type { Comentario } from '../hooks/useComentarios'

export function formatarTempo(segundos: number) {
    const total = Math.max(0, Math.floor(segundos))
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

interface ComentariosCamadaProps {
    comentarios: Comentario[]
    erro: string | null
    currentTime: number
    versaoAtual?: number
    destacadoId?: string | null
    podeComentar: boolean
    podeResolver: (c: Comentario) => boolean
    podeRemover: (c: Comentario) => boolean
    onSeek: (segundos: number) => void
    onCriar: (segundos: number, texto: string) => Promise<boolean>
    onAlternarResolvido: (c: Comentario) => void
    onRemover: (c: Comentario) => void
}

function ComentariosCamada({
    comentarios, erro, currentTime, versaoAtual, destacadoId, podeComentar,
    podeResolver, podeRemover, onSeek, onCriar, onAlternarResolvido, onRemover,
}: ComentariosCamadaProps) {
    const [texto, setTexto] = useState('')
    // Instante fixado quando a pessoa começa a escrever, para o player poder continuar tocando.
    const [marca, setMarca] = useState<number | null>(null)
    const [enviando, setEnviando] = useState(false)
    const [mostrarResolvidos, setMostrarResolvidos] = useState(false)

    const resolvidos = comentarios.filter(c => c.resolvido).length
    const visiveis = mostrarResolvidos ? comentarios : comentarios.filter(c => !c.resolvido)
    const posicao = marca ?? currentTime

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault()
        const limpo = texto.trim()
        if (!limpo) return
        setEnviando(true)
        const ok = await onCriar(posicao, limpo)
        setEnviando(false)
        if (ok) {
            setTexto('')
            setMarca(null)
        }
    }

    return (
        <section className="comentarios-camada" aria-label="Comentários da camada">
            {podeComentar && (
                <form className="comentario-form" onSubmit={enviar}>
                    <div className="comentario-form-topo">
                        <span className="comentario-marca">Comentar em <strong>{formatarTempo(posicao)}</strong></span>
                        <button
                            type="button"
                            className="comentario-btn"
                            onClick={() => setMarca(currentTime)}
                            title="Usar a posição atual do player"
                        >
                            <Crosshair size={13} /> Posição atual
                        </button>
                    </div>
                    <textarea
                        value={texto}
                        onFocus={() => { if (marca === null) setMarca(currentTime) }}
                        onChange={e => setTexto(e.target.value)}
                        placeholder="Ex.: o baixo atravessa o tempo aqui"
                        maxLength={500}
                        rows={2}
                        aria-label="Texto do comentário"
                    />
                    <button type="submit" className="btn-small" disabled={enviando || !texto.trim()}>
                        {enviando ? 'Enviando...' : 'Comentar'}
                    </button>
                </form>
            )}

            {erro && <div className="form-error" role="alert">{erro}</div>}

            {comentarios.length === 0 ? (
                <p className="comentarios-vazio">Nenhum comentário nesta camada ainda.</p>
            ) : (
                <>
                    {resolvidos > 0 && (
                        <label className="comentarios-filtro">
                            <input
                                type="checkbox"
                                checked={mostrarResolvidos}
                                onChange={e => setMostrarResolvidos(e.target.checked)}
                            />
                            Mostrar resolvidos ({resolvidos})
                        </label>
                    )}
                    <ul className="comentarios-lista">
                        {visiveis.map(c => (
                            <li
                                key={c.id}
                                className={`comentario-item${c.resolvido ? ' resolvido' : ''}${c.id === destacadoId ? ' destacado' : ''}`}
                            >
                                <button className="comentario-tempo" onClick={() => onSeek(c.segundos)} title="Ir para este ponto">
                                    {formatarTempo(c.segundos)}
                                </button>
                                <div className="comentario-corpo">
                                    <div className="comentario-meta">
                                        <strong>{c.autor.nome_completo}</strong>
                                        {c.versaoNumero !== null && versaoAtual !== undefined && c.versaoNumero !== versaoAtual && (
                                            <span className="comentario-versao" title="Feito numa versão anterior desta camada">na v{c.versaoNumero}</span>
                                        )}
                                        {c.resolvido && <span className="comentario-resolvido-tag">Resolvido</span>}
                                    </div>
                                    <p>{c.texto}</p>
                                </div>
                                <div className="comentario-acoes">
                                    {podeResolver(c) && (
                                        <button
                                            className="comentario-btn"
                                            onClick={() => onAlternarResolvido(c)}
                                            title={c.resolvido ? 'Reabrir' : 'Marcar como resolvido'}
                                            aria-label={c.resolvido ? 'Reabrir comentário' : 'Marcar como resolvido'}
                                        >
                                            {c.resolvido ? <RotateCcw size={13} /> : <Check size={13} />}
                                        </button>
                                    )}
                                    {podeRemover(c) && (
                                        <button
                                            className="comentario-btn perigo"
                                            onClick={() => onRemover(c)}
                                            title="Apagar comentário"
                                            aria-label="Apagar comentário"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    )
}

export { ComentariosCamada }
