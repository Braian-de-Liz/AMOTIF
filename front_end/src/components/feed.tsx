import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { URL_API_TESTE } from "../utility/url_apis";
import { SearchBar } from "./SearchBar";
import { UserCard } from "./UserCard";
import '../styles/Shared.css';
import { ProjectCard } from './project_Card';
import type { Project, User, SearchResults } from '../types';

interface UserWithFollowing extends User {
    isFollowing?: boolean
}

function Feed() {
    const [projetos, setProjetos] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setErro] = useState<string | null>(null);
    const [filtroInstrumento, setFiltroInstrumento] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResults | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const navigate = useNavigate();

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
            if (err instanceof Error && err.name !== 'AbortError') {
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

    const handleSearchResults = (results: SearchResults | null) => {
        setSearchResults(results);
    };

    const handleUserClick = (userId: string) => {
        navigate(`/usuario/${userId}`);
    };

    if (loading && projetos.length === 0) return <div>Carregando...</div>;

    return (
        <div className="feed-container">
            <SearchBar onSearchResults={handleSearchResults} />

            {searchResults ? (
                <div className="search-results">
                    <div className="search-results-header">
                        <h3>
                            {searchResults.type === 'projetos'
                                ? `Encontrados: ${searchResults.data.length} projeto(s)`
                                : `Encontrados: ${searchResults.data.length} músico(s)`
                            }
                        </h3>
                    </div>

                    {searchResults.type === 'projetos' ? (
                        searchResults.data.length > 0 ? (
                            <div className="feed-grid">
                                {searchResults.data.map((proj: unknown) => (
                                    <ProjectCard key={(proj as Project).id} proj={proj as Project} />
                                ))}
                            </div>
                        ) : (
                            <p className="empty-state">Nenhum projeto encontrado.</p>
                        )
                    ) : (
                        searchResults.data.length > 0 ? (
                            <div className="users-grid">
                                {searchResults.data.map((user: unknown) => (
                                    <UserCard
                                        key={(user as UserWithFollowing).id}
                                        user={user as UserWithFollowing}
                                        onClick={() => handleUserClick((user as User).id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="empty-state">Nenhum musician encontrado.</p>
                        )
                    )}
                </div>
            ) : (
                <>
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
                </>
            )}
        </div>
    );
}

export { Feed }
