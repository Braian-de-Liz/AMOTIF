import { useState } from 'react'
import { URL_API_TESTE } from '../utility/url_apis'

interface FollowButtonProps {
    targetUserId: string
    initialFollowing?: boolean
    onToggle?: (following: boolean) => void
    className?: string
}

function FollowButton({ targetUserId, initialFollowing = false, onToggle, className = '' }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialFollowing)
    const [loading, setLoading] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function handleClick(e: React.MouseEvent) {
        e.stopPropagation()
        if (loading) return

        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${URL_API_TESTE}/follow/${targetUserId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setIsFollowing(data.seguindo)
                onToggle?.(data.seguindo)
                setErro(null)
            } else {
                const data = await response.json()
                setErro(data.mensagem || "Erro ao seguir.")
                setTimeout(() => setErro(null), 3000)
            }
        } catch {
            setErro("Erro de conexão.")
            setTimeout(() => setErro(null), 3000)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                className={`btn-follow ${isFollowing ? 'following' : ''} ${className}`}
                onClick={handleClick}
                disabled={loading}
                aria-pressed={isFollowing}
                aria-label={isFollowing ? "Deixar de seguir" : "Seguir"}
            >
                {loading ? '...' : isFollowing ? 'Seguindo' : 'Seguir'}
            </button>
            {erro && <small style={{ color: 'var(--erro-texto)', display: 'block', marginTop: '0.25rem' }}>{erro}</small>}
        </>
    )
}

export { FollowButton }
