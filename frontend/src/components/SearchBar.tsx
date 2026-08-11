import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { URL_API_TESTE } from '../utility/url_apis';
import type { SearchResults } from '../types';

const GENEROS = [
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

interface SearchBarProps {
    onSearchResults: (results: SearchResults | null) => void
}

function SearchBar({ onSearchResults }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('projetos');
    const [genero, setGenero] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setErro(null);

        try {
            let url: URL;

            if (searchType === 'projetos') {
                url = new URL(`${URL_API_TESTE}/search/projects`);
                url.searchParams.append('query', query);
                if (genero) {
                    url.searchParams.append('genero', genero);
                }
            } else {
                url = new URL(`${URL_API_TESTE}/search/user`);
                if (searchType === 'instrumentos') {
                    url.searchParams.append('instrumento', query);
                } else {
                    url.searchParams.append('query', query);
                }
            }

            const response = await fetch(url, {
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                const type = searchType === 'projetos' ? 'projetos' : 'usuarios';
                onSearchResults({ type, data: data.resultados || [] });
                setErro(null);
            } else {
                onSearchResults(searchType === 'projetos' ? { type: 'projetos', data: [] } : { type: 'usuarios', data: [] });
                setErro(data.mensagem || "Nenhum resultado encontrado.");
            }
        } catch {
            setErro("Erro de conexão ao buscar.");
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setGenero('');
        setErro(null);
        onSearchResults(null);
    };

    return (
        <div className="search-bar-container">
            <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder={
                            searchType === 'projetos' ? "Buscar projetos..." :
                            searchType === 'instrumentos' ? "Buscar por instrumento..." :
                            "Buscar por nome..."
                        }
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="search-input"
                    />
                    {query && (
                        <button type="button" className="search-clear" onClick={clearSearch} aria-label="Limpar busca">
                            <X size={16} />
                        </button>
                    )}
                </div>
                <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="search-type-select"
                >
                    <option value="projetos">Projetos</option>
                    <option value="instrumentos">Músicos por instrumento</option>
                    <option value="nome">Músicos por nome</option>
                </select>
                {searchType === 'projetos' && (
                    <select
                        value={genero}
                        onChange={(e) => setGenero(e.target.value)}
                        className="search-type-select"
                    >
                        {GENEROS.map(g => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                    </select>
                )}
                <button type="submit" className="search-btn" disabled={loading}>
                    {loading ? '...' : 'Buscar'}
                </button>
            </form>
            {erro && <div className="error-msg" style={{ marginTop: '0.5rem' }}>{erro}</div>}
        </div>
    );
}

export { SearchBar };
