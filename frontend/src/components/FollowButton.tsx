import { useState } from 'react'
import { URL_API_TESTE } from '../utility/url_apis'
import { useFeedback } from '../contexts/FeedbackContext'

interface FollowButtonProps {
    targetUserId: string
    initialFollowing?: boolean
    onToggle?: (following: boolean) => void
    className?: string
}

function FollowButton({ targetUserId, initialFollowing = false, onToggle, className = '' }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialFollowing)
    const [loading, setLoading] = useState(false)
    const feedback = useFeedback()

    async function handleClick(e: React.MouseEvent) {
        e.stopPropagation()
        if (loading) return

        setLoading(true)
        try {
            const response = await fetch(`${URL_API_TESTE}/follow/${targetUserId}`, {
                method: 'POST',
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setIsFollowing(data.seguindo)
                onToggle?.(data.seguindo)
            } else {
                const data = await response.json().catch(() => ({}))
                feedback.error(data.mensagem || "Erro ao seguir.")
            }
        } catch {
            feedback.error("Erro de conexão ao seguir.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            className={`btn-follow ${isFollowing ? 'following' : ''} ${className}`}
            onClick={handleClick}
            disabled={loading}
            aria-busy={loading}
            aria-pressed={isFollowing}
            aria-label={isFollowing ? "Deixar de seguir" : "Seguir"}
        >
            {/* O rótulo fica durante a requisição: o botão não muda de largura. */}
            {isFollowing ? 'Seguindo' : 'Seguir'}
        </button>
    )
}

export { FollowButton }
