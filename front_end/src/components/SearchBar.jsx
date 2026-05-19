import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { URL_API_TESTE } from '../utility/url_apis';
import { useNavigate } from 'react-router-dom';

function SearchBar({ onSearchResults }) {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('projetos');
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);

        try {
            const token = localStorage.getItem("token");
            
            if (searchType === 'projetos') {
                const url = new URL(`${URL_API_TESTE}/search/projects`);
                url.searchParams.append('query', query);
                
                const response = await fetch(url, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                const data = await response.json();
                
                console.log("Search projects response:", data);
                
                if (response.ok) {
                    onSearchResults({ type: 'projetos', data: data.resultados || [] });
                } else {
                    console.error("Erro na busca de projetos:", data);
                    onSearchResults({ type: 'projetos', data: [] });
                }
            } else {
                const url = new URL(`${URL_API_TESTE}/search/user`);
                url.searchParams.append('instrumento', query);
                
                const response = await fetch(url, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                const data = await response.json();
                
                console.log("Search users response:", data);
                
                if (response.ok) {
                    onSearchResults({ type: 'usuarios', data: data.resultados || [] });
                } else {
                    console.error("Erro na busca de usuários:", data);
                    onSearchResults({ type: 'usuarios', data: [] });
                }
            }
        } catch (err) {
            console.error("Erro na busca:", err);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setHasSearched(false);
        onSearchResults(null);
    };

    return (
        <div className="search-bar-container">
            <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder={searchType === 'projetos' ? "Buscar projetos..." : "Buscar por instrumento..."}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="search-input"
                    />
                    {query && (
                        <button type="button" className="search-clear" onClick={clearSearch}>
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
                </select>
                <button type="submit" className="search-btn" disabled={loading}>
                    {loading ? '...' : 'Buscar'}
                </button>
            </form>
        </div>
    );
}

export { SearchBar };