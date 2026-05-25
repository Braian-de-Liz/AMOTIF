import { useState } from 'react'
import { URL_API_TESTE } from '../utility/url_apis'

function FollowButton({ targetUserId, initialFollowing = false, onToggle, className = '' }) {
    const [isFollowing, setIsFollowing] = useState(initialFollowing)
    const [loading, setLoading] = useState(false)

    async function handleClick(e) {
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
            }
        } catch (err) {
            console.error("Erro ao seguir/deixar de seguir:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            className={`btn-follow ${isFollowing ? 'following' : ''} ${className}`}
            onClick={handleClick}
            disabled={loading}
        >
            {loading ? '...' : isFollowing ? 'Seguindo' : 'Seguir'}
        </button>
    )
}

export { FollowButton }
