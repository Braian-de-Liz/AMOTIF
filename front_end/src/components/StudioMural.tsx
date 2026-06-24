import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { URL_API_TESTE } from '../utility/url_apis';
import { Send, MessageCircle } from 'lucide-react';
import type { MuralPost } from '../types';

interface StudioMuralProps {
    projetoId: string | undefined
    isOwner: boolean
}

function StudioMural({ projetoId }: StudioMuralProps) {
    const { data, loading, error, refetch } = useApi<{ mural: MuralPost[] }>(
        `/mural/${projetoId}`,
        { immediate: !!projetoId }
    );

    const [newPost, setNewPost] = useState('');
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim()) return;

        setPosting(true);
        setPostError(null);
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
                refetch();
            } else {
                const result = await response.json();
                setPostError(result.mensagem || "Erro ao postar.");
            }
        } catch {
            setPostError("Erro de conexão ao postar.");
        } finally {
            setPosting(false);
        }
    };

    if (loading) return <div className="loading-txt">Carregando mural...</div>;

    const posts = data?.mural || [];

    return (
        <div className="studio-mural">
            {(error || postError) && <div className="error-msg">{error || postError}</div>}

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
                <label htmlFor="mural-input" className="sr-only">Escreva algo no mural</label>
                <input
                    id="mural-input"
                    type="text"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Escreva algo no mural..."
                    className="mural-input"
                />
                <button type="submit" className="btn-send" disabled={posting || !newPost.trim()} aria-label="Enviar mensagem">
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}

export { StudioMural };
