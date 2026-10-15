import { useCallback, useEffect, useState } from 'react'
import { api } from '../utility/apiClient'

export interface Comentario {
    id: string
    camadaId: string
    segundos: number
    texto: string
    /** Versão da camada ouvida quando o comentário foi feito. */
    versaoNumero: number | null
    resolvido: boolean
    createdAt: string
    updatedAt: string
    autor: { id: string; nome_completo: string; avatar_url: string | null }
}

const porPosicao = (a: Comentario, b: Comentario) => a.segundos - b.segundos || a.createdAt.localeCompare(b.createdAt)

/** Comentários marcados no tempo de uma camada. Só busca quando `enabled` (quem participa do projeto). */
export function useComentarios(layerId: string, enabled: boolean) {
    const [comentarios, setComentarios] = useState<Comentario[]>([])
    const [erro, setErro] = useState<string | null>(null)

    useEffect(() => {
        if (!enabled) return
        let cancelado = false
        api.get<{ comentarios: Comentario[] }>(`/layer/${layerId}/comentarios`)
            .then(data => { if (!cancelado) setComentarios(data.comentarios) })
            .catch(err => { if (!cancelado) setErro(err instanceof Error ? err.message : 'Erro ao carregar comentários') })
        return () => { cancelado = true }
    }, [layerId, enabled])

    const executar = useCallback(async (acao: () => Promise<void>) => {
        setErro(null)
        try {
            await acao()
            return true
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao salvar comentário')
            return false
        }
    }, [])

    const criar = useCallback((segundos: number, texto: string) => executar(async () => {
        const { comentario } = await api.post<{ comentario: Comentario }>(`/layer/${layerId}/comentarios`, { segundos, texto })
        setComentarios(prev => [...prev, comentario].sort(porPosicao))
    }), [layerId, executar])

    const alternarResolvido = useCallback((c: Comentario) => executar(async () => {
        const { comentario } = await api.patch<{ comentario: Comentario }>(`/comentarios/${c.id}`, { resolvido: !c.resolvido })
        setComentarios(prev => prev.map(x => (x.id === c.id ? comentario : x)))
    }), [executar])

    const remover = useCallback((c: Comentario) => executar(async () => {
        await api.delete(`/comentarios/${c.id}`)
        setComentarios(prev => prev.filter(x => x.id !== c.id))
    }), [executar])

    return { comentarios, erro, criar, alternarResolvido, remover }
}
