import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { URL_API_TESTE } from '../utility/url_apis';
import { criarSugestaoSchema } from '../schemas/sugestaoSchema';
import { formatZodErrors } from '../utility/validationHelpers';
import { Lightbulb, Trash2, ChevronDown } from 'lucide-react';
import type { Sugestao } from '../types';

interface StudioSugestoesProps {
    projetoId: string | undefined
    isOwner: boolean
}

const statusConfig: Record<string, { label: string; className: string }> = {
    ABERTA: { label: 'Aberta', className: 'status-aberta' },
    EM_ANDAMENTO: { label: 'Em Andamento', className: 'status-em-andamento' },
    RESOLVIDA: { label: 'Resolvida', className: 'status-resolvida' }
};

function StudioSugestoes({ projetoId, isOwner }: StudioSugestoesProps) {
    const { data, loading, error, refetch } = useApi<{ sugestoes: Sugestao[] }>(
        `/projetos/${projetoId}/sugestoes`,
        { immediate: !!projetoId }
    );

    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filtroStatus, setFiltroStatus] = useState<string>('');

    const currentUserId = localStorage.getItem('usuario_id');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPostError(null);

        const validation = criarSugestaoSchema.safeParse({ titulo, descricao });
        if (!validation.success) {
            setPostError(formatZodErrors(validation.error));
            return;
        }

        setPosting(true);
        try {
            const response = await fetch(`${URL_API_TESTE}/projetos/${projetoId}/sugestoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ titulo, descricao })
            });

            if (response.ok) {
                setTitulo('');
                setDescricao('');
                refetch();
            } else {
                const result = await response.json();
                setPostError(result.mensagem || "Erro ao criar sugestão.");
            }
        } catch {
            setPostError("Erro de conexão ao criar sugestão.");
        } finally {
            setPosting(false);
        }
    };

    const handleDelete = async (sugestaoId: string) => {
        setDeletingId(sugestaoId);
        try {
            const response = await fetch(`${URL_API_TESTE}/sugestoes/${sugestaoId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                refetch();
            } else {
                const result = await response.json();
                setPostError(result.mensagem || "Erro ao excluir sugestão.");
            }
        } catch {
            setPostError("Erro de conexão ao excluir.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleStatusChange = async (sugestaoId: string, newStatus: string) => {
        try {
            const response = await fetch(`${URL_API_TESTE}/sugestoes/${sugestaoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                refetch();
            } else {
                const result = await response.json();
                setPostError(result.mensagem || "Erro ao atualizar status.");
            }
        } catch {
            setPostError("Erro de conexão ao atualizar status.");
        }
    };

    if (loading) return <div className="loading-txt">Carregando sugestões...</div>;

    const sugestoes = data?.sugestoes || [];
    const sugestoesFiltradas = filtroStatus
        ? sugestoes.filter(s => s.status === filtroStatus)
        : sugestoes;

    return (
        <div className="studio-sugestoes">
            {(error || postError) && <div className="error-msg">{error || postError}</div>}

            <div className="sugestoes-filtros">
                <button
                    className={`filtro-btn ${filtroStatus === '' ? 'active' : ''}`}
                    onClick={() => setFiltroStatus('')}
                >
                    Todas
                </button>
                {Object.entries(statusConfig).map(([key, config]) => (
                    <button
                        key={key}
                        className={`filtro-btn ${filtroStatus === key ? 'active' : ''}`}
                        onClick={() => setFiltroStatus(key)}
                    >
                        {config.label}
                    </button>
                ))}
            </div>

            <div className="sugestoes-lista">
                {sugestoesFiltradas.length === 0 ? (
                    <p className="empty-state">Nenhuma sugestão encontrada.</p>
                ) : (
                    sugestoesFiltradas.map(sugestao => (
                        <div key={sugestao.id} className="sugestao-card">
                            <div className="sugestao-header">
                                <Lightbulb size={16} />
                                <strong>{sugestao.titulo}</strong>
                                <span className={`sugestao-status ${statusConfig[sugestao.status]?.className}`}>
                                    {statusConfig[sugestao.status]?.label}
                                </span>
                                <div className="sugestao-actions">
                                    {isOwner && (
                                        <div className="status-dropdown">
                                            <select
                                                value={sugestao.status}
                                                onChange={(e) => handleStatusChange(sugestao.id, e.target.value)}
                                                className="status-select"
                                            >
                                                {Object.entries(statusConfig).map(([key, config]) => (
                                                    <option key={key} value={key}>{config.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={12} className="dropdown-icon" />
                                        </div>
                                    )}
                                    {(sugestao.autor.id === currentUserId || isOwner) && (
                                        <button
                                            className="btn-delete-sugestao"
                                            onClick={() => handleDelete(sugestao.id)}
                                            disabled={deletingId === sugestao.id}
                                            title="Excluir sugestão"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="sugestao-descricao">{sugestao.descricao}</p>
                            <div className="sugestao-footer">
                                <span className="sugestao-autor">
                                    {sugestao.autor.nome_completo}
                                </span>
                                <span className="sugestao-data">
                                    {new Date(sugestao.criado_em).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleCreate} className="sugestao-form">
                <div className="form-group">
                    <label htmlFor="sugestao-titulo">Título</label>
                    <input
                        id="sugestao-titulo"
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Ex: Melhorar a mixagem do refrão"
                        required
                        maxLength={100}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="sugestao-descricao">Descrição</label>
                    <textarea
                        id="sugestao-descricao"
                        className="modal-textarea"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descreva sua sugestão em detalhes..."
                        required
                        rows={3}
                        maxLength={2000}
                    />
                </div>
                <button type="submit" className="btn-confirm" disabled={posting || !titulo.trim() || !descricao.trim()}>
                    {posting ? 'Enviando...' : 'Enviar Sugestão'}
                </button>
            </form>
        </div>
    );
}

export { StudioSugestoes };
