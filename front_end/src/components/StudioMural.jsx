import { useState, useEffect } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';
import { Send, MessageCircle } from 'lucide-react';

function StudioMural({ projetoId, isOwner }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState('');
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        fetchMural();
    }, [projetoId]);

    const fetchMural = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${URL_API_TESTE}/mural/${projetoId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data = await response.json();
            
            if (response.ok) {
                setPosts(data.mural || []);
            }
        } catch (err) {
            console.error("Erro ao carregar mural:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) return;

        setPosting(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${URL_API_TESTE}/projetos/${projetoId}/mural`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ conteudo: newPost })
            });

            if (response.ok) {
                setNewPost('');
                fetchMural();
            }
        } catch (err) {
            console.error("Erro ao postar:", err);
        } finally {
            setPosting(false);
        }
    };

    if (loading) return <div className="loading-txt">Carregando mural...</div>;

    return (
        <div className="studio-mural">
            {(isOwner || posts.length > 0) && (
                <form onSubmit={handlePost} className="mural-form">
                    <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="Compartilhe uma atualização do projeto..."
                        className="mural-input"
                        rows={3}
                    />
                    <button 
                        type="submit" 
                        className="btn-post"
                        disabled={posting || !newPost.trim()}
                    >
                        <Send size={16} />
                        {posting ? 'Postando...' : 'Postar'}
                    </button>
                </form>
            )}

            <div className="mural-posts">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post.id} className="mural-post">
                            <div className="post-header">
                                <div className="post-author-avatar">
                                    {post.autor.avatar_url ? (
                                        <img src={post.autor.avatar_url} alt={post.autor.nome_completo} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {post.autor.nome_completo?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="post-author-info">
                                    <strong>{post.autor.nome_completo}</strong>
                                    <span>{new Date(post.createdAt).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>
                            <p className="post-content">{post.conteudo}</p>
                        </div>
                    ))
                ) : (
                    <div className="empty-mural">
                        <MessageCircle size={48} />
                        <p>Nenhuma atualização ainda. Seja o primeiro a postar!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export { StudioMural };