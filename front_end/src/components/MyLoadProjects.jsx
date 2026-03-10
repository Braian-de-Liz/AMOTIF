import { useState, useEffect } from "react";
import { URL_API_TESTE } from "../utility/url_apis";

function MyProjetosLoader() {

    const [projetos, setProjetos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    const token = localStorage.getItem("token");
    const usuarioLogado = JSON.parse(localStorage.getItem("usuario"));

    useEffect(() => {
        async function load() {

            if (!usuarioLogado?.id) {
                setErro("Sessão inválida.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${URL_API_TESTE}/api/projetos/${usuarioLogado.id}/get`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    setProjetos(data.projetos);
                }
                else {
                    setErro(data.mensagem);
                }

            }
            catch (err) {
                setErro("Erro de conexão com a API.");
            }
            finally {
                setLoading(false);
            }
        }

        load();
    }, [token, usuarioLogado?.id]);

    if (loading) return <div>Buscando suas trilhas...</div>;
    if (erro) return <div className="error-msg">{erro}</div>;

    return (
        <div className="projetos-grid">
            {projetos.length > 0 ? (
                projetos.map(projeto => (
                    <article key={projeto.id} className="projeto-card">
                        <h3>{projeto.titulo}</h3>
                        <span>{projeto.bpm} BPM</span>
                        <p>{projeto.descricao || "Sem descrição"}</p>
                    </article>
                ))
            ) : (
                <p>Nenhum projeto encontrado. Comece a criar!</p>
            )}
        </div>
    );
}

export { MyProjetosLoader };