import { useState, useEffect, useCallback } from 'react';
import { Link2, Copy, Check, Trash2 } from 'lucide-react';
import { api } from '../utility/apiClient';

interface InviteLink {
    id: string;
    token: string;
    cargo: string;
    max_usos: number;
    usos: number;
    expira_em: string;
}

interface InviteLinksPanelProps {
    projetoId: string;
}

function buildInviteUrl(token: string) {
    return `${window.location.origin}/convite/${token}`;
}

function InviteLinksPanel({ projetoId }: InviteLinksPanelProps) {
    const [links, setLinks] = useState<InviteLink[]>([]);
    const [creating, setCreating] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const loadLinks = useCallback(async () => {
        try {
            const data = await api.get<{ links: InviteLink[] }>(`/colaboration/${projetoId}/invite-links`);
            setLinks(data.links);
        } catch (err) {
            console.error('Erro ao carregar links de convite:', err);
        }
    }, [projetoId]);

    useEffect(() => {
        loadLinks();
    }, [loadLinks]);

    const handleCreate = async () => {
        setCreating(true);
        setErro(null);
        try {
            await api.post(`/colaboration/${projetoId}/invite-link`, {});
            await loadLinks();
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao criar link');
        } finally {
            setCreating(false);
        }
    };

    const handleCopy = async (link: InviteLink) => {
        try {
            await navigator.clipboard.writeText(buildInviteUrl(link.token));
            setCopiedId(link.id);
            setTimeout(() => setCopiedId(null), 1500);
        } catch {
            setErro('Não foi possível copiar o link.');
        }
    };

    const handleRevoke = async (link: InviteLink) => {
        setErro(null);
        try {
            await api.delete(`/colaboration/${projetoId}/invite-link/${link.id}`);
            setLinks(prev => prev.filter(l => l.id !== link.id));
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao revogar link');
        }
    };

    return (
        <section className="invite-links">
            <header className="invite-links-header">
                <div>
                    <h4>Links de convite</h4>
                    <p className="invite-links-hint">Cada link vale por 7 dias e até 10 pessoas.</p>
                </div>
                <button className="btn-invite" onClick={handleCreate} disabled={creating}>
                    <Link2 size={16} />
                    {creating ? 'Gerando...' : 'Gerar link'}
                </button>
            </header>
            {erro && <div className="form-error" role="alert">{erro}</div>}
            {links.length > 0 && (
                <ul className="invite-links-list">
                    {links.map(link => (
                        <li key={link.id} className="invite-link-item">
                            <div className="invite-link-info">
                                <span className="invite-link-role">{link.cargo}</span>
                                <span className="invite-link-meta">
                                    {link.usos}/{link.max_usos} usos · expira em {new Date(link.expira_em).toLocaleDateString()}
                                </span>
                                <span className="invite-link-meter" aria-hidden="true">
                                    <span style={{ width: `${Math.min(100, (link.usos / link.max_usos) * 100)}%` }} />
                                </span>
                            </div>
                            <div className="invite-link-actions">
                                <button className="invite-link-btn" onClick={() => handleCopy(link)} title="Copiar link">
                                    {copiedId === link.id ? <Check size={14} /> : <Copy size={14} />}
                                    {copiedId === link.id ? 'Copiado' : 'Copiar'}
                                </button>
                                <button className="invite-link-btn danger" onClick={() => handleRevoke(link)} title="Revogar link">
                                    <Trash2 size={14} />
                                    Revogar
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export { InviteLinksPanel };
