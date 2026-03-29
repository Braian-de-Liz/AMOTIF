// front_end/src/pages/studio.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Nav } from "../components/nav";
import { URL_API_TESTE } from "../utility/url_apis";
import { Play, Pause, Mic } from "lucide-react";

export function Studio() { 
    const { id } = useParams();
    const [projeto, setProjeto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        async function carregarProjeto() {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${URL_API_TESTE}/projetos/detalhes/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const data = await response.json();

                if (response.ok) {
                    setProjeto(data.projeto || data); 
                } else {
                    setErro(data.mensagem || "Erro ao carregar projeto.");
                }
            } catch (err) {
                setErro("Não foi possível conectar ao servidor do Studio.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (id) carregarProjeto();
    }, [id]);

    if (loading) return <div className="loading-txt">Montando setup do estúdio...</div>;
    if (erro) return <div className="error-msg">{erro}</div>;
    if (!projeto) return <div className="error-msg">Projeto não encontrado.</div>;

    return (
        <div className="user-dashboard"> 
            <Nav />
            <div className="user-header">
                <h1>Estúdio: {projeto.titulo}</h1>
                <p>BPM: <strong>{projeto.bpm}</strong> | Gênero: {projeto.genero}</p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                    <button className="btn-create-proj"><Play size={18}/> Ouvir Tudo</button>
                    <button className="btn-small" style={{borderColor: 'var(--verde-medio)'}}><Mic size={18}/> Gravar</button>
                </div>
            </div>

            <main className="my-projects-section" style={{marginTop: '2rem'}}>
                <h3>Tracks</h3>
                <div className="card-container">
                    <div className="card">
                        <div className="card-header"><h4>Guia Principal</h4></div>
                        <audio controls src={projeto.audio_guia} style={{width: '100%'}}></audio>
                    </div>

                    {projeto.camadas?.map(camada => (
                        <div key={camada.id} className="card">
                            <div className="card-header">
                                <h4>{camada.instrumento_tag}</h4>
                                <small>{camada.autor?.nome_completo}</small>
                            </div>
                            <audio controls src={camada.audio_url} style={{width: '100%'}}></audio>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}