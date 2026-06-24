import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectCard } from '../components/project_Card';
import { FollowButton } from '../components/FollowButton';
import { Avatar } from '../components/Avatar';
import { URL_API_TESTE } from '../utility/url_apis';
import type { User, Project } from '../types';
import '../styles/User.css';
import { SEOHead } from '../components/SEOHead';

function UserProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [projetos, setProjetos] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

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

            if (userRes.ok) setUser(userData.usuario);
            if (projectsRes.ok) setProjetos(projectsData.projetos || []);
        } catch {
            setErro("Erro ao carregar dados do usuário.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-txt">Carregando perfil...</div>;
    if (erro) return <div className="error-msg">{erro}</div>;
    if (!user) return <div className="error-msg">Usuário não encontrado.</div>;

    const isOwnProfile = currentUserId === user.id;

    return (
        <div className="user-dashboard">
            <SEOHead
                title={user.nome_completo}
                description={user.bio || `Perfil de ${user.nome_completo} na AMOTIF - projetos, instrumentos e colaboração musical.`}
                url={`/usuario/${user.id}`}
            />
            <div className="page-header">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <Avatar
                            src={user.avatar_url}
                            name={user.nome_completo}
                            size={120}
                        />
                    </div>
                    <div className="profile-info">
                        <h1>{user.nome_completo}</h1>
                        {user.bio && <p className="profile-bio">{user.bio}</p>}
                        {user.instrumentos && user.instrumentos.length > 0 && (
                            <div className="profile-instruments">
                                {user.instrumentos.map((inst, i) => (
                                    <span key={i} className="instrument-tag">{inst}</span>
                                ))}
                            </div>
                        )}
                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">{user._count?.seguidores ?? 0}</span>
                                <span className="stat-label">Seguidores</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{user._count?.seguindo ?? 0}</span>
                                <span className="stat-label">Seguindo</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{user._count?.projetos ?? 0}</span>
                                <span className="stat-label">Projetos</span>
                            </div>
                        </div>
                        {!isOwnProfile && (
                            <FollowButton targetUserId={user.id} initialFollowing={user.isFollowing} />
                        )}
                    </div>
                </div>
            </div>

            <section className="my-projects-section">
                <h2>Projetos de {user.nome_completo}</h2>
                <div className="feed-grid" style={{ marginTop: '1rem' }}>
                    {projetos.length > 0 ? (
                        projetos.map(proj => (
                            <ProjectCard key={proj.id} proj={proj} />
                        ))
                    ) : (
                        <p className="empty-state">Este usuário ainda não tem projetos.</p>
                    )}
                </div>
            </section>
        </div>
    );
}

export default UserProfile;
