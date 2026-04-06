// front_end/src/components/MyLoadProjects.jsx
import { useState, useEffect } from "react";
import { URL_API_TESTE } from "../utility/url_apis";
import '../styles/Shared.css';

function MyProjetosLoader() {
    const [projetos, setProjetos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        async function load() {
            const token = localStorage.getItem("token");
            const usuarioId = localStorage.getItem("usuario_id");

            if (!token || !usuarioId) {
                setErro("Sessão expirada. Por favor, faça login novamente.");
                setLoading(false);
                return;
            }

            try {
                // A rota no seu back-end é /api/projetos/:id/get
                const response = await fetch(`${URL_API_TESTE}/projetos/${usuarioId}/get`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    setProjetos(data.projetos || []);
                } else {
                    setErro(data.mensagem || "Erro ao carregar projetos.");
                }
            } catch {
                setErro("Não foi possível conectar ao servidor.");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []); // Array vazio para rodar apenas uma vez ao montar o componente

    if (loading) return <div className="loading-txt">Sintonizando sua estante musical...</div>;
    if (erro) return <div className="error-msg">{erro}</div>;

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
                            <button className="btn-small">Abrir Studio</button>
                        </div>
                    </article>
                ))
            ) : (
                <p className="empty-state">Você ainda não tem projetos. Que tal criar o primeiro?</p>
            )}
        </div>
    );
}

export { MyProjetosLoader };