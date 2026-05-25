import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { URL_API_TESTE } from '../utility/url_apis';
import { ProjectCard } from './project_Card';
import type { Project } from '../types';

interface FavoritesListProps {
    userId?: string | null
    limit?: number
}

function FavoritesList({ userId, limit }: FavoritesListProps) {
    const [favoritos, setFavoritos] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchFavorites() {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${URL_API_TESTE}/projetos/favoritos`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (response.ok) {
                    const favList: Project[] = data.favoritos || [];
                    setFavoritos(limit ? favList.slice(0, limit) : favList);
                } else {
                    setError(data.mensagem || 'Erro ao carregar favoritos');
                }
            } catch (err) {
                setError('Erro de conexão');
            } finally {
                setLoading(false);
            }
        }

        if (userId) fetchFavorites();
    }, [userId, limit]);

    const navigate = useNavigate();

    const handleProjectClick = (projetoId: string) => {
        navigate(`/studio/${projetoId}`);
    };

    if (loading) return <div className="loading">Carregando favoritos...</div>;
    if (error) return <div className="error">{error}</div>;

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
