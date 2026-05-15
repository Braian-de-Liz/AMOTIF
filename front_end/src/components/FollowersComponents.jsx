import { useState, useEffect } from 'react';
import { URL_API_TESTE } from "../utility/url_apis";

function FollowersList({ userId }) {
    const [followers, setFollowers] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchFollowers() {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${URL_API_TESTE}/follows`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log("olhe quantas repetições");
                const data = await response.json();
                
                if (response.ok) {
                    setFollowers(data.follows || []);
                    setTotal(data.total || 0);
                } else {
                    setError(data.mensagem || 'Erro ao carregar seguidores');
                }
        } catch {
            setError('Erro de conexão');
            } finally {
                setLoading(false);
            }
        }

        fetchFollowers();
    }, [userId]);

    if (loading) return <div className="loading">Carregando seguidores...</div>;
    if (error) return <div className="error">{error}</div>;

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
                                {follow.follower.avatar_url ? (
                                    <img src={follow.follower.avatar_url} alt={follow.follower.nome_completo} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {follow.follower.nome_completo.charAt(0).toUpperCase()}
                                    </div>
                                )}
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

function UserStats({ userId }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUserStats() {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${URL_API_TESTE}/usuario/${userId}/completo`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();
                
                if (response.ok) {
                    setStats(data.usuario);
                }
        } catch {
            console.error("Erro ao carregar estatísticas");
            } finally {
                setLoading(false);
            }
        }

        fetchUserStats();
    }, [userId]);

    if (loading) return <div className="loading">Carregando dados...</div>;
    if (!stats) return null;

    return (
        <div className="user-stats">
            <div className="stat-item">
                <span className="stat-value">{stats._count.seguidores}</span>
                <span className="stat-label">Seguidores</span>
            </div>
            <div className="stat-item">
                <span className="stat-value">{stats._count.seguindo}</span>
                <span className="stat-label">Seguindo</span>
            </div>
        </div>
    );
}

export { FollowersList, UserStats };
