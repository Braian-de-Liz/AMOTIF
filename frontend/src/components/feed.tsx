import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { URL_API_TESTE } from "../utility/url_apis";
import { SearchBar } from "./SearchBar";
import { UserCard } from "./UserCard";
import '../styles/Shared.css';
import { ProjectCard } from './project_Card';
import type { Project, User, SearchResults } from '../types';
import { STATUS_PROJETO } from "../utility/papeis";
import { WaveArt } from "./WaveArt";
import { previewPlayer } from "../utility/previewPlayer";

interface UserWithFollowing extends User {
    isFollowing?: boolean
}

const GENEROS_FEED = [
    { value: '', label: 'Todos os gêneros' },
    { value: 'ROCK', label: 'Rock' },
    { value: 'POP', label: 'Pop' },
    { value: 'JAZZ', label: 'Jazz' },
    { value: 'BLUES', label: 'Blues' },
    { value: 'FORRO', label: 'Forró' },
    { value: 'METAL', label: 'Metal' },
    { value: 'HIP_HOP', label: 'Hip Hop' },
    { value: 'ELECTRONIC', label: 'Eletrônica' },
    { value: 'CLASSICAL', label: 'Clássica' },
    { value: 'LO_FI', label: 'Lo-Fi' },
    { value: 'INDIE', label: 'Indie' },
    { value: 'SERTANEJO', label: 'Sertanejo' },
    { value: 'SAMBA', label: 'Samba' },
    { value: 'MPB', label: 'MPB' },
    { value: 'COUNTRY', label: 'Country' },
    { value: 'FUNK', label: 'Funk' },
    { value: 'SOUNDTRACK', label: 'Trilha Sonora' },
    { value: 'REGGAE', label: 'Reggae' },
];

// O filtro casa com a tag da camada sem diferenciar maiúsculas (backend: mode insensitive).
const INSTRUMENTOS_FEED = ['Baixo', 'Guitarra', 'Violão', 'Bateria', 'Teclado', 'Vocal', 'Percussão', 'Sopros'];

function FeedSkeleton() {
    return (
        <div className="feed-grid" role="status" aria-label="Carregando projetos">
            {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="feed-card feed-card-skeleton" aria-hidden="true">
                    <span className="skeleton-line skeleton-title" />
                    <span className="skeleton-line" />
                    <span className="skeleton-line skeleton-short" />
                    <WaveArt variant="skeleton" bars={32} />
                </div>
            ))}
        </div>
    );
}

function Feed() {
    const [projetos, setProjetos] = useState<Project[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [filtroInstrumento, setFiltroInstrumento] = useState("");
    const [filtroGenero, setFiltroGenero] = useState("");
    const [filtroStatus, setFiltroStatus] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResults | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const navigate = useNavigate();

    const filtrosAtivos = Boolean(filtroInstrumento || filtroGenero || filtroStatus);

    /** Sem cursor recarrega do início; com cursor acrescenta a próxima página. */
    const carregarFeed = useCallback(async (cursor?: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        if (cursor) setLoadingMore(true);
        else setLoading(true);
        setErro(null);

        try {
            const url = new URL(`${URL_API_TESTE}/projetos/feed`);

            if (filtroInstrumento) {
                url.searchParams.append("instrumentoFaltante", filtroInstrumento);
            }
            if (filtroGenero) {
                url.searchParams.append("genero", filtroGenero);
            }
            if (filtroStatus) {
                url.searchParams.append("status", filtroStatus);
            }
            if (cursor) {
                url.searchParams.append("cursor", cursor);
            }

            const response = await fetch(url, {
                signal,
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                const novos: Project[] = data.projetos || [];
                setProjetos(prev => cursor ? [...prev, ...novos] : novos);
                setNextCursor(data.nextCursor ?? null);
            } else {
                setErro(data.mensagem);
            }
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setErro("Erro de conexão ao carregar o feed.");
            }
        } finally {
            if (!signal.aborted) {
                setLoading(false);
                setLoadingMore(false);
            }
        }
    }, [filtroInstrumento, filtroGenero, filtroStatus]);

    useEffect(() => {
        carregarFeed();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [carregarFeed]);

    // A prévia não continua tocando depois de sair do feed (ex.: ao entrar no Studio).
    useEffect(() => () => previewPlayer.stop(), []);

    const handleSearchResults = (results: SearchResults | null) => {
        setSearchResults(results);
    };

    const handleUserClick = (userId: string) => {
        navigate(`/usuario/${userId}`);
    };

    const limparFiltros = () => {
        setFiltroInstrumento("");
        setFiltroGenero("");
        setFiltroStatus("");
    };

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
                            <p className="empty-state">Nenhum músico encontrado.</p>
                        )
                    )}
                </div>
            ) : (
                <>
                    <header className="feed-header">
                        <h2 className="feed-title">Explorar Projetos</h2>

                        <div className="feed-filters">
                            <select
                                className="filter-select"
                                aria-label="Instrumento que falta"
                                value={filtroInstrumento}
                                onChange={(e) => setFiltroInstrumento(e.target.value)}
                            >
                                <option value="">Todos os instrumentos</option>
                                {INSTRUMENTOS_FEED.map(i => (
                                    <option key={i} value={i}>Precisando de {i}</option>
                                ))}
                            </select>

                            <select
                                className="filter-select"
                                aria-label="Gênero"
                                value={filtroGenero}
                                onChange={(e) => setFiltroGenero(e.target.value)}
                            >
                                {GENEROS_FEED.map(g => (
                                    <option key={g.value} value={g.value}>{g.label}</option>
                                ))}
                            </select>

                            <select
                                className="filter-select"
                                aria-label="Etapa do projeto"
                                value={filtroStatus}
                                onChange={(e) => setFiltroStatus(e.target.value)}
                            >
                                <option value="">Todas as etapas</option>
                                {STATUS_PROJETO.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>

                            {filtrosAtivos && (
                                <button type="button" className="feed-clear-filters" onClick={limparFiltros}>
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    </header>

                    {erro && (
                        <div className="error-msg feed-error" role="alert">
                            <span>{erro}</span>
                            <button type="button" className="btn-small" onClick={() => carregarFeed()}>
                                Tentar de novo
                            </button>
                        </div>
                    )}

                    {loading && projetos.length === 0 ? (
                        <FeedSkeleton />
                    ) : projetos.length > 0 ? (
                        <div className={`feed-grid${loading ? ' is-loading' : ''}`} aria-busy={loading}>
                            {projetos.map(proj => (
                                <ProjectCard key={proj.id} proj={proj} />
                            ))}
                        </div>
                    ) : !erro && (
                        <div className="feed-empty">
                            <WaveArt bars={36} />
                            <h3>{filtrosAtivos ? 'Nada com esses filtros' : 'Nenhum projeto ainda'}</h3>
                            <p>
                                {filtrosAtivos
                                    ? `Nenhum projeto encontrado${filtroGenero ? ' no gênero selecionado' : ''}${filtroStatus ? ' nesta etapa' : ''}${filtroInstrumento ? ` precisando de ${filtroInstrumento}` : ''}. Que tal começar um?`
                                    : 'Comece um projeto com a sua guia e deixe outros músicos tocarem por cima.'}
                            </p>
                            <div className="feed-empty-actions">
                                {filtrosAtivos && (
                                    <button type="button" className="btn-secondary-feed" onClick={limparFiltros}>
                                        Limpar filtros
                                    </button>
                                )}
                                <button type="button" className="feed-cta-button" onClick={() => navigate('/novo-studio')}>
                                    Começar um projeto
                                </button>
                            </div>
                        </div>
                    )}

                    {nextCursor && projetos.length > 0 && (
                        <div className="feed-more">
                            <button
                                type="button"
                                className="btn-secondary-feed"
                                onClick={() => carregarFeed(nextCursor)}
                                disabled={loadingMore}
                            >
                                {loadingMore ? 'Carregando…' : 'Carregar mais'}
                            </button>
                        </div>
                    )}

                    {projetos.length > 0 && (
                        <aside className="feed-cta">
                            <div>
                                <h3>Tem uma ideia no ar?</h3>
                                <p>Comece um projeto com a sua guia e deixe outros músicos tocarem por cima.</p>
                            </div>
                            <button className="feed-cta-button" onClick={() => navigate('/novo-studio')}>
                                Começar um projeto
                            </button>
                        </aside>
                    )}
                </>
            )}
        </div>
    );
}

export { Feed }
