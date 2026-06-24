import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Shared.css';
import { URL_API_TESTE } from "../utility/url_apis";
import { Heart, Music, Bookmark } from "lucide-react";
import type { Project } from "../types";

interface ProjectCardProps {
    proj: Project
}

function ProjectCardInner({ proj }: ProjectCardProps) {
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = React.useState(proj.userHasLiked);
    const [likesCount, setLikesCount] = React.useState(proj._count.likes);
    const [isFavorited, setIsFavorited] = React.useState(proj.userHasFavorited || false);
    const [erro, setErro] = React.useState<string | null>(null);

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
                setErro(null);
            } else {
                setErro(data.mensagem || "Erro ao curtir.");
                setTimeout(() => setErro(null), 3000);
            }
        } catch {
            setErro("Erro de conexão ao curtir.");
            setTimeout(() => setErro(null), 3000);
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
                setErro(null);
            } else {
                setErro(data.mensagem || "Erro ao favoritar.");
                setTimeout(() => setErro(null), 3000);
            }
        } catch {
            setErro("Erro de conexão ao favoritar.");
            setTimeout(() => setErro(null), 3000);
        }
    }

    return (
        <article className="feed-card">
            {erro && <div className="form-error" style={{ marginBottom: '0.5rem' }}>{erro}</div>}
            <div className="feed-card-header">
                <h3>{proj.titulo}</h3>
                <span className="badge-bpm">{proj.bpm} BPM</span>
            </div>

            <p className="feed-card-desc">{proj.descricao || "Sem descrição."}</p>

            <div className="feed-stats-bar">
                <button
                    onClick={handleLike}
                    className={`btn-like ${isLiked ? 'active' : ''}`}
                    aria-label={isLiked ? "Descurtir" : "Curtir"}
                    aria-pressed={isLiked}
                >
                    <Heart size={18} fill={isLiked ? "var(--erro)" : "none"} color={isLiked ? "var(--erro)" : "currentColor"} />
                    <span>{likesCount}</span>
                </button>

                <button
                    onClick={handleFavorite}
                    className={`btn-favorite ${isFavorited ? 'active' : ''}`}
                    aria-label={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    aria-pressed={isFavorited}
                >
                    <Bookmark size={18} fill={isFavorited ? "var(--aviso)" : "none"} color={isFavorited ? "var(--aviso)" : "currentColor"} />
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

const ProjectCard = React.memo(ProjectCardInner);

export { ProjectCard };
