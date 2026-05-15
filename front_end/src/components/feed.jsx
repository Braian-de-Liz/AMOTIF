import { useState, useEffect, useCallback, useRef } from "react";
import { URL_API_TESTE } from "../utility/url_apis";
import '../styles/Shared.css';
import {ProjectCard} from './project_Card'

function Feed() {
    const [projetos, setProjetos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [, setErro] = useState(null);
    const [filtroInstrumento, setFiltroInstrumento] = useState(""); 

    const abortControllerRef = useRef(null);

    const carregarFeed = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const url = new URL(`${URL_API_TESTE}/projetos/feed`);

            if (filtroInstrumento) {
                url.searchParams.append("instrumentoFaltante", filtroInstrumento);
            }

            const response = await fetch(url, {
                signal,
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            const data = await response.json();
            if (response.ok) {
                setProjetos(data.projetos || []);
            } else {
                setErro(data.mensagem);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setErro("Erro de conexão.");
            }
        } finally {
            if (!signal.aborted) {
                setLoading(false);
            }
        }
    }, [filtroInstrumento]);

    useEffect(() => {
        carregarFeed();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [carregarFeed]); 

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
                <p className="empty-state">Nenhum projeto precisando de {filtroInstrumento || 'músicos'} no momento.</p>
            )}
        </div>
    );
}

export {Feed}