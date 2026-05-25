import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Shared.css';
import { URL_API_TESTE } from "../utility/url_apis";
import { Heart, Music, Bookmark } from "lucide-react";
import type { Project } from "../types";

interface ProjectCardProps {
    proj: Project
}

function ProjectCard({ proj }: ProjectCardProps) {
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(proj.userHasLiked);
    const [likesCount, setLikesCount] = useState(proj._count.likes);
    const [isFavorited, setIsFavorited] = useState(proj.userHasFavorited || false);

    async function handleLike() {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${URL_API_TESTE}/like/${proj.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setIsLiked(data.liked);
                setLikesCount(data.count);
            }
        } catch (err) {
            console.error("Erro ao curtir:", err);
        }
    }

    async function handleFavorite(e: React.MouseEvent) {
        e.stopPropagation();
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${URL_API_TESTE}/projetos/favoritos/${proj.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setIsFavorited(data.favoritado);
            }
        } catch (err) {
            console.error("Erro ao favoritar:", err);
        }
    }

    return (
        <article className="feed-card">
            <div className="feed-card-header">
                <h3>{proj.titulo}</h3>
                <span className="badge-bpm">{proj.bpm} BPM</span>
            </div>

            <p className="feed-card-desc">{proj.descricao || "Sem descrição."}</p>

            <div className="feed-stats-bar">
                <button
                    onClick={handleLike}
                    className={`btn-like ${isLiked ? 'active' : ''}`}
                >
                    <Heart size={18} fill={isLiked ? "red" : "none"} color={isLiked ? "red" : "currentColor"} />
                    <span>{likesCount}</span>
                </button>

                <button
                    onClick={handleFavorite}
                    className={`btn-favorite ${isFavorited ? 'active' : ''}`}
                    title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                    <Bookmark size={18} fill={isFavorited ? "#fbbf24" : "none"} color={isFavorited ? "#fbbf24" : "currentColor"} />
                </button>

                <div className="stat-item">
                    <Music size={18} />
                    <span>{proj._count.camadas} camadas</span>
                </div>
            </div>

            <div className="feed-card-footer">
                <div className="feed-card-author">
                    <strong>{proj.autor?.nome_completo || "Anônimo"}</strong>
                    <small> • {proj.genero}</small>
                </div>
                <button
                    className="btn-small"
                    onClick={() => navigate(`/studio/${proj.id}`)}
                >
                    Entrar no Studio
                </button>
            </div>
        </article>
    );
}

export { ProjectCard };
