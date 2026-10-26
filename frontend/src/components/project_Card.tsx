import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Shared.css';
import { URL_API_TESTE } from "../utility/url_apis";
import { Heart, Music, Bookmark, Play, Pause } from "lucide-react";
import type { Project } from "../types";
import { rotuloStatus } from '../utility/papeis';
import { useFeedback } from '../contexts/FeedbackContext';
import { previewPlayer } from '../utility/previewPlayer';
import { usePreviewStatus, usePreviewProgress } from '../hooks/usePreview';
import { WaveArt } from './WaveArt';
import { Avatar } from './Avatar';

interface ProjectCardProps {
    proj: Project
}

/** Onda preenchida até o ponto tocado; só existe no card cuja prévia está ativa. */
function PreviewFill() {
    const progress = usePreviewProgress();
    return (
        <div className="preview-wave-fill" style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}>
            <WaveArt bars={32} />
        </div>
    );
}

function PreviewButton({ id, url, titulo }: { id: string, url: string, titulo: string }) {
    const feedback = useFeedback();
    const status = usePreviewStatus(id);
    const playing = status === 'playing';

    function handleToggle() {
        previewPlayer.toggle(id, url).catch(() => feedback.error("Não foi possível tocar a prévia."));
    }

    return (
        <div className="feed-card-preview">
            <button
                type="button"
                className="btn-preview"
                onClick={handleToggle}
                aria-label={playing ? `Pausar prévia de ${titulo}` : `Ouvir prévia de ${titulo}`}
                aria-pressed={playing}
            >
                {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="preview-wave">
                <WaveArt bars={32} />
                {status !== 'idle' && <PreviewFill />}
            </div>
        </div>
    );
}

function ProjectCardInner({ proj }: ProjectCardProps) {
    const feedback = useFeedback();
    const [isLiked, setIsLiked] = React.useState(proj.userHasLiked ?? false);
    const [likesCount, setLikesCount] = React.useState(proj._count.likes);
    const [isFavorited, setIsFavorited] = React.useState(proj.userHasFavorited || false);
    // Ignora cliques enquanto a requisição anterior não volta: evita curtir e descurtir num clique duplo.
    const likeInFlight = React.useRef(false);
    const favoriteInFlight = React.useRef(false);

    async function handleLike() {
        if (likeInFlight.current) return;
        likeInFlight.current = true;

        // Otimista: o coração responde na hora e volta atrás se o servidor recusar.
        const prevLiked = isLiked;
        const prevCount = likesCount;
        setIsLiked(!prevLiked);
        setLikesCount(prevCount + (prevLiked ? -1 : 1));

        try {
            const response = await fetch(`${URL_API_TESTE}/like/${proj.id}`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.mensagem || "Erro ao curtir.");

            setIsLiked(data.liked);
            setLikesCount(data.count);
        } catch (err) {
            setIsLiked(prevLiked);
            setLikesCount(prevCount);
            feedback.error(err instanceof TypeError ? "Erro de conexão ao curtir." : (err as Error).message);
        } finally {
            likeInFlight.current = false;
        }
    }

    async function handleFavorite() {
        if (favoriteInFlight.current) return;
        favoriteInFlight.current = true;

        const prevFavorited = isFavorited;
        setIsFavorited(!prevFavorited);

        try {
            const response = await fetch(`${URL_API_TESTE}/projetos/favoritos/${proj.id}`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.mensagem || "Erro ao favoritar.");

            setIsFavorited(data.favoritado);
        } catch (err) {
            setIsFavorited(prevFavorited);
            feedback.error(err instanceof TypeError ? "Erro de conexão ao favoritar." : (err as Error).message);
        } finally {
            favoriteInFlight.current = false;
        }
    }

    const studioUrl = `/studio/${proj.id}`;

    return (
        <article className="feed-card">
            <div className="feed-card-header">
                {/* O ::after do link cobre o card inteiro; botões e o autor ficam por cima (z-index). */}
                <h3><Link to={studioUrl} className="feed-card-link">{proj.titulo}</Link></h3>
                <span className="badge-bpm">{proj.bpm} BPM</span>
            </div>
            {proj.status && (
                <span className={`status-projeto status-${proj.status.toLowerCase()}`}>{rotuloStatus(proj.status)}</span>
            )}

            <p className="feed-card-desc">{proj.descricao || "Sem descrição."}</p>

            {proj.audio_guia && <PreviewButton id={proj.id} url={proj.audio_guia} titulo={proj.titulo} />}

            <div className="feed-stats-bar">
                <button
                    type="button"
                    onClick={handleLike}
                    className={`btn-like ${isLiked ? 'active' : ''}`}
                    aria-label={isLiked ? "Descurtir" : "Curtir"}
                    aria-pressed={isLiked}
                >
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                    <span>{likesCount}</span>
                </button>

                <button
                    type="button"
                    onClick={handleFavorite}
                    className={`btn-favorite ${isFavorited ? 'active' : ''}`}
                    aria-label={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    aria-pressed={isFavorited}
                >
                    <Bookmark size={18} fill={isFavorited ? "currentColor" : "none"} />
                </button>

                <div className="stat-item">
                    <Music size={18} />
                    <span>{proj._count.camadas} {proj._count.camadas === 1 ? 'camada' : 'camadas'}</span>
                </div>
            </div>

            <div className="feed-card-footer">
                <div className="feed-card-author">
                    {proj.autor?.id ? (
                        <Link to={`/usuario/${proj.autor.id}`} className="feed-card-author-link">
                            <Avatar src={proj.autor.avatar_url} name={proj.autor.nome_completo} size={24} />
                            <strong>{proj.autor.nome_completo}</strong>
                        </Link>
                    ) : (
                        <strong>{proj.autor?.nome_completo || "Anônimo"}</strong>
                    )}
                    <small> • {proj.genero}</small>
                </div>
                <Link to={studioUrl} className="btn-small" tabIndex={-1} aria-hidden="true">
                    Entrar no Studio
                </Link>
            </div>
        </article>
    );
}

const ProjectCard = React.memo(ProjectCardInner);

export { ProjectCard };
