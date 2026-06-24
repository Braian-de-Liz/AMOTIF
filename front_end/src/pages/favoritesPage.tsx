import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { URL_API_TESTE } from '../utility/url_apis';
import { Heart } from 'lucide-react';
import { ProjectCard } from '../components/project_Card';
import type { Project } from '../types';
import '../styles/User.css';

function FavoritesPage() {
    const navigate = useNavigate();
    const { data, loading, error } = useApi<{ favoritos: Project[] }>(
        `/projetos/favoritos`,
        { immediate: true }
    );

    if (loading) return <div className="loading-txt">Carregando favoritos...</div>;

    const favoritos = data?.favoritos || [];

    return (
        <div className="favorites-page">
            <div className="page-header">
                <h1><Heart size={28} className="heart-icon" /> Favoritos</h1>
                <p>Projetos que você salvou</p>
            </div>

            <div className="favorites-content">
                {error && <div className="error-msg">{error}</div>}

                {favoritos.length === 0 ? (
                    <div className="empty-favorites">
                        <Heart size={48} />
                        <h3>Nenhum favorito ainda</h3>
                        <p>Explore projetos e salve seus favoritos aqui.</p>
                    </div>
                ) : (
                    <div className="feed-grid">
                        {favoritos.map(fav => (
                            <div
                                key={fav.id}
                                className="favorite-item"
                                onClick={() => navigate(`/studio/${fav.id}`)}
                            >
                                <ProjectCard proj={fav} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export { FavoritesPage };
