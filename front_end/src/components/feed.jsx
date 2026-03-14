import { useState, useEffect } from "react";
import { URL_API_TESTE } from "../utility/url_apis";

function Feed() {
    const [projetos, setProjetos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        async function carregarFeed() {
            try {
                const token = localStorage.getItem("token");
                const headers = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(`${URL_API_TESTE}/projetos`, {
                    headers
                });

                const data = await response.json();

                if (response.ok) {
                    setProjetos(data.projetos || []);
                } else {
                    setErro(data.mensagem || "Erro ao carregar o feed.");
                }
            }
            
            catch (err) {
                setErro("Não foi possível conectar ao servidor.");
            }

            finally {
                setLoading(false);
            }
        }

        carregarFeed();
    }, []);

    if (loading) return <div className="loading-txt">Carregando projetos da comunidade...</div>;
    if (erro) return <div className="error-msg">{erro}</div>;

    return (
        <div className="feed-container">
            <h2 className="feed-title">Feed Global</h2>
            {projetos.length > 0 ? (
                <div className="feed-grid">
                    {projetos.map(proj => (
                        <article key={proj.id} className="feed-card">
                            <div className="feed-card-header">
                                <h3>{proj.titulo}</h3>
                                <span className="badge-bpm">{proj.bpm} BPM</span>
                            </div>
                            <p className="feed-card-desc">{proj.descricao || "Sem descrição."}</p>
                            <div className="feed-card-footer">
                                <div className="feed-card-author">
                                    <strong>{proj.autor?.nome_completo || "Anônimo"}</strong>
                                    {proj.autor?.instrumentos && (
                                        <small> • {Array.isArray(proj.autor.instrumentos)
                                            ? proj.autor.instrumentos.join(', ')
                                            : proj.autor.instrumentos}
                                        </small>
                                    )}
                                </div>
                                <button
                                    className="btn-small"
                                    onClick={() => window.location.href = `/studio/${proj.id}`}
                                >
                                    Ver projeto
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <p className="empty-state">Nenhum projeto encontrado. Seja o primeiro a compartilhar!</p>
            )}
        </div>
    );
}

export { Feed };