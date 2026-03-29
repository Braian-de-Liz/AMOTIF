import { useState } from "react";
import { URL_API_TESTE } from "../utility/url_apis";
import { Heart, MessageSquare, Music } from "lucide-react"; 

function ProjectCard({ proj }) {
    const [isLiked, setIsLiked] = useState(proj.userHasLiked);
    const [likesCount, setLikesCount] = useState(proj._count.likes);

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
                    onClick={() => window.location.href = `/studio/${proj.id}`}
                >
                    Entrar no Studio
                </button>
            </div>
        </article>
    );
}

export { ProjectCard };