import { useApi } from '../hooks/useApi';
import type { Project } from '../types';
import '../styles/Shared.css';

function MyProjectsList() {
    const usuarioId = localStorage.getItem("usuario_id");
    const { data, loading, error } = useApi<{ projetos: Project[] }>(
        `/projetos/${usuarioId}/get`,
        { immediate: !!usuarioId }
    );

    if (loading) return <div className="loading-txt">Sintonizando sua estante musical...</div>;
    if (error) return <div className="error-msg">{error}</div>;

    const projetos = data?.projetos || [];

    return (
        <div className="card-container">
            {projetos.length > 0 ? (
                projetos.map(proj => (
                    <article key={proj.id} className="card">
                        <div className="card-header">
                            <h3>{proj.titulo}</h3>
                            <span className="badge-bpm">{proj.bpm} BPM</span>
                        </div>
                        <p className="card-desc">{proj.descricao || "Sem descrição disponível."}</p>
                        <div className="card-footer">
                            <small>Escala: {proj.escala || 'N/A'}</small>
                        </div>
                    </article>
                ))
            ) : (
                <p className="empty-state">Você ainda não tem projetos. Que tal criar o primeiro?</p>
            )}
        </div>
    );
}

export { MyProjectsList };
