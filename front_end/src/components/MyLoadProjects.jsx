// front_end/src/components/MyLoadProjects.jsx
import { useState, useEffectEvent } from "react";
import { URL_API_TESTE } from "../utility/url_apis";

function MyProjetosLoader() {
    const [projetos, setProjetos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    const token = localStorage.getItem("token");
    const usuarioId = localStorage.getItem("usuario_id");

    useEffect(() => {
        async function load() {
            if (!usuarioId) {
                setErro("Sessão inválida. Faça login novamente.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${URL_API_TESTE}/projetos/${usuarioId}/get`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();
                if (response.ok) {
                    setProjetos(data.projetos || []);
                } else {
                    setErro(data.mensagem);
                }
            } catch (err) {
                setErro("Erro de conexão com a API.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [token, usuarioId]);

    if (loading) return <div className="loading-state">Sintonizando suas trilhas...</div>;
    if (erro) return <div className="error-msg">{erro}</div>;

    return (
        <div className="card-container">
            {projetos.length > 0 ? (
                projetos.map(projeto => (
                    <article key={projeto.id} className="card">
                        <div className="card-header">
                            <h3>{projeto.titulo}</h3>
                            <span className="badge">{projeto.bpm} BPM</span>
                        </div>
                        <p>{projeto.descricao || "Sem descrição disponível."}</p>
                        <button className="btn-small">Abrir no Studio</button>
                    </article>
                ))
            ) : (
                <p className="empty-state">Nenhum projeto encontrado. Que tal criar um agora?</p>
            )}
        </div>
    );
}

export { MyProjetosLoader };