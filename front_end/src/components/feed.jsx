import { useState, useEffect } from "react";
import { URL_API_TESTE } from "../utility/url_apis";
import '../styles/Shared.css';
import {ProjectCard} from './project_Card'

function Feed() {
    const [projetos, setProjetos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [filtroInstrumento, setFiltroInstrumento] = useState(""); 

    async function carregarFeed() {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const url = new URL(`${URL_API_TESTE}/projetos/feed`);
            
            if (filtroInstrumento) url.searchParams.append("instrumentoFaltante", filtroInstrumento);

            const response = await fetch(url, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            const data = await response.json();
            if (response.ok) {
                setProjetos(data.projetos || []);
            } else {
                setErro(data.mensagem);
            }
        } catch (err) {
            setErro("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { carregarFeed(); }, [filtroInstrumento]); 

    if (loading && projetos.length === 0) return <div>Carregando...</div>;

    return (
        <div className="feed-container">
            <header className="feed-header">
                <h2 className="feed-title">Explorar Projetos</h2>
                
                <select 
                    className="filter-select"
                    onChange={(e) => setFiltroInstrumento(e.target.value)}
                >
                    <option value="">Todos os instrumentos</option>
                    <option value="Baixo">Precisando de Baixo</option>
                    <option value="Guitarra">Precisando de Guitarra</option>
                    <option value="Vocal">Precisando de Vocal</option>
                </select>
            </header>

            {projetos.length > 0 ? (
                <div className="feed-grid">
                    {projetos.map(proj => (
                        <ProjectCard key={proj.id} proj={proj} />
                    ))}
                </div>
            ) : (
                <p>Nenhum projeto precisando de {filtroInstrumento} no momento.</p>
            )}
        </div>
    );
}

export {Feed}