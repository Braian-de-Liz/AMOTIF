import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { ProjectCard } from './project_Card';
import type { Project } from '../types';

interface FavoritesListProps {
    userId?: string | null
    limit?: number
}

function FavoritesList({ userId, limit }: FavoritesListProps) {
    const { data, loading, error } = useApi<{ favoritos: Project[] }>(
        `/projetos/favoritos`,
        { immediate: !!userId }
    );

    const navigate = useNavigate();

    const handleProjectClick = (projetoId: string) => {
        navigate(`/studio/${projetoId}`);
    };

    if (loading) return <div className="loading">Carregando favoritos...</div>;
    if (error) return <div className="error-msg">{error}</div>;

    let favoritos = data?.favoritos || [];
    if (limit) favoritos = favoritos.slice(0, limit);

    if (favoritos.length === 0) {
        return (
            <div className="empty-favorites-mini">
                <p>Nenhum favorito ainda.</p>
            </div>
        );
    }

    return (
        <div className="favorites-list">
            <div className="favorites-grid">
                {favoritos.map(fav => (
                    <div
                        key={fav.id}
                        className="favorite-item"
                        onClick={() => handleProjectClick(fav.id)}
                    >
                        <ProjectCard proj={fav} />
                    </div>
                ))}
            </div>

            {limit && favoritos.length > limit && (
                <button
                    className="btn-view-all"
                    onClick={() => navigate('/favoritos')}
                >
                    Ver todos os favoritos ({favoritos.length})
                </button>
            )}
        </div>
    );
}

export { FavoritesList };
