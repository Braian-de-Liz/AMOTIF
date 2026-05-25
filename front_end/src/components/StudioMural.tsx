import { useState, useEffect } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';
import { Send, MessageCircle } from 'lucide-react';
import type { MuralPost } from '../types';

interface StudioMuralProps {
    projetoId: string | undefined
    isOwner: boolean
}

function StudioMural({ projetoId, isOwner }: StudioMuralProps) {
    const [posts, setPosts] = useState<MuralPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState('');
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        if (projetoId) fetchMural();
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

    const handlePost = async (e: React.FormEvent) => {
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
            <div className="mural-posts">
                {posts.length === 0 ? (
                    <p className="empty-state">Nenhum post no mural ainda.</p>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="mural-post">
                            <div className="mural-post-header">
                                <MessageCircle size={16} />
                                <strong>{post.autor?.nome_completo || 'Anônimo'}</strong>
                                <small>{new Date(post.criado_em).toLocaleDateString()}</small>
                            </div>
                            <p>{post.conteudo}</p>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handlePost} className="mural-form">
                <input
                    type="text"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Escreva algo no mural..."
                    className="mural-input"
                />
                <button type="submit" className="btn-send" disabled={posting || !newPost.trim()}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}

export { StudioMural };
