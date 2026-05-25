import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectCard } from '../components/project_Card';
import { FollowButton } from '../components/FollowButton';
import { URL_API_TESTE } from '../utility/url_apis';
import type { User, Project } from '../types';
import '../styles/User.css';

function UserProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [projetos, setProjetos] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('projetos');

    const currentUserId = localStorage.getItem("usuario_id");

    useEffect(() => {
        if (id) fetchUserData();
    }, [id]);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem("token");

            const [userRes, projectsRes] = await Promise.all([
                fetch(`${URL_API_TESTE}/usuario/${id}/completo`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                }),
                fetch(`${URL_API_TESTE}/projetos/${id}/get`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                })
            ]);

            const userData = await userRes.json();
            const projectsData = await projectsRes.json();

            if (userRes.ok) {
                setUser(userData.usuario);
            }

            if (projectsRes.ok) {
                setProjetos(projectsData.projetos || []);
            }
        } catch (err) {
            setErro("Erro ao carregar dados do usuário.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-txt">Carregando perfil...</div>;
    if (erro) return <div className="error-msg">{erro}</div>;
    if (!user) return <div className="error-msg">Usuário não encontrado.</div>;

    const isOwnProfile = currentUserId === id;

    return (
        <div className="user-dashboard">

            <header className="user-header profile-header">
                <div className="profile-avatar">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.nome_completo} />
                    ) : (
                        <div className="avatar-placeholder large">
                            {user.nome_completo?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="profile-info">
                    <h1>{user.nome_completo}</h1>
                    {user.bio && <p className="profile-bio">{user.bio}</p>}

                    {user.instrumentos && user.instrumentos.length > 0 && (
                        <div className="profile-instruments">
                            {user.instrumentos.map((inst, idx) => (
                                <span key={idx} className="instrument-tag">{inst}</span>
                            ))}
                        </div>
                    )}

                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">{user._count?.projetos || 0}</span>
                            <span className="stat-label">Projetos</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{user._count?.seguidores || 0}</span>
                            <span className="stat-label">Seguidores</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{user._count?.seguindo || 0}</span>
                            <span className="stat-label">Seguindo</span>
                        </div>
                    </div>

                    {!isOwnProfile && (
                        <FollowButton targetUserId={id!} initialFollowing={user.isFollowing} className="btn-follow-profile" />
                    )}
                </div>
            </header>

            <div className="profile-tabs">
                <button
                    className={`tab-btn ${activeTab === 'projetos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('projetos')}
                >
                    Projetos ({projetos.length})
                </button>
            </div>

            <main className="profile-content">
                {activeTab === 'projetos' && (
                    <div className="feed-grid">
                        {projetos.length > 0 ? (
                            projetos.map(proj => (
                                <div key={proj.id} onClick={() => navigate(`/studio/${proj.id}`)}>
                                    <ProjectCard proj={proj} />
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                Este usuário ainda não tem projetos.
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export { UserProfile };
