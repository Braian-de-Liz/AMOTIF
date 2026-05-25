import { FollowButton } from './FollowButton'
import type { User } from '../types'

interface UserCardProps {
    user: User
    onClick?: () => void
}

function UserCard({ user, onClick }: UserCardProps) {
    return (
        <div className="user-card" onClick={onClick}>
            <div className="user-card-avatar">
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.nome_completo} />
                ) : (
                    <div className="avatar-placeholder">
                        {user.nome_completo?.charAt(0).toUpperCase() || '?'}
                    </div>
                )}
            </div>

            <div className="user-card-info">
                <h4>{user.nome_completo}</h4>
                {user.bio && <p className="user-bio">{user.bio}</p>}

                {user.instrumentos && user.instrumentos.length > 0 && (
                    <div className="user-instruments">
                        {user.instrumentos.slice(0, 3).map((inst, idx) => (
                            <span key={idx} className="instrument-tag">{inst}</span>
                        ))}
                        {user.instrumentos.length > 3 && (
                            <span className="instrument-more">+{user.instrumentos.length - 3}</span>
                        )}
                    </div>
                )}
            </div>

            <FollowButton targetUserId={user.id} initialFollowing={user.isFollowing} />
        </div>
    );
}

export { UserCard };
