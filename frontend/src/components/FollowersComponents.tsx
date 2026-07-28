import { useApi } from '../hooks/useApi';
import { Avatar } from './Avatar';
import type { User, FollowData } from '../types';

interface FollowersListProps {
    userId: string | null
}

function FollowersList({ userId }: FollowersListProps) {
    const { data, loading, error } = useApi<{ follows: FollowData[], total: number }>(
        `/follows`,
        { immediate: !!userId }
    );

    if (loading) return <div className="loading">Carregando seguidores...</div>;
    if (error) return <div className="error-msg">{error}</div>;

    const followers = data?.follows || [];
    const total = data?.total || 0;

    return (
        <div className="followers-section">
            <h3>Seguidores ({total})</h3>
            {followers.length === 0 ? (
                <p className="no-followers">Você ainda não tem seguidores.</p>
            ) : (
                <div className="followers-grid">
                    {followers.map((follow) => (
                        <div key={follow.followerId} className="follower-card">
                            <div className="follower-avatar">
                                <Avatar
                                    src={follow.follower.avatar_url}
                                    name={follow.follower.nome_completo}
                                    size={50}
                                />
                            </div>
                            <div className="follower-info">
                                <strong>{follow.follower.nome_completo}</strong>
                                {follow.follower.bio && <p>{follow.follower.bio}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

interface UserStatsProps {
    userId: string | null
}

function UserStats({ userId }: UserStatsProps) {
    const { data, loading } = useApi<{ usuario: User }>(
        `/usuario/${userId}/completo`,
        { immediate: !!userId }
    );

    if (loading) return <div className="loading">Carregando dados...</div>;
    if (!data?.usuario) return null;

    const stats = data.usuario;

    return (
        <div className="user-stats">
            <div className="stat-item">
                <span className="stat-value">{stats._count?.seguidores ?? 0}</span>
                <span className="stat-label">Seguidores</span>
            </div>
            <div className="stat-item">
                <span className="stat-value">{stats._count?.seguindo ?? 0}</span>
                <span className="stat-label">Seguindo</span>
            </div>
        </div>
    );
}

export { FollowersList, UserStats };
