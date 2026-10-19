import { useState, useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { URL_API_TESTE } from '../utility/url_apis';
import { UserPlus, X, Check, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { inviteSchema } from '../schemas/colaborationSchema'
import { formatZodErrors } from '../utility/validationHelpers'
import { DeleteColabModal } from './DeleteColabModal';
import { InviteLinksPanel } from './InviteLinksPanel';
import type { Convite, Colaborador } from '../types';
import { PAPEIS, rotuloPapel, type PapelColaborador } from '../utility/papeis';

interface StudioColaboradoresProps {
    projetoId: string | undefined
    isOwner: boolean
}

function StudioColaboradores({ projetoId, isOwner }: StudioColaboradoresProps) {
    const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
    const [convites, setConvites] = useState<Convite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteCargo, setInviteCargo] = useState('');
    const [invitePapel, setInvitePapel] = useState<PapelColaborador>('MUSICO');
    const [inviting, setInviting] = useState(false);
    const [inviteErro, setInviteErro] = useState<string | null>(null);
    const [inviteSucesso, setInviteSucesso] = useState<string | null>(null);
    const [deleteColabTarget, setDeleteColabTarget] = useState<{ userId: string; nome: string } | null>(null);
    const inviteModalRef = useRef<HTMLDivElement | null>(null);

    useFocusTrap(inviteModalRef, showInviteModal, () => setShowInviteModal(false));

    useEffect(() => {
        if (projetoId) fetchData();
    }, [projetoId]);

    const fetchData = async () => {
        try {
            const [colabRes, invitesRes] = await Promise.all([
                fetch(`${URL_API_TESTE}/colaboration/${projetoId}`, {
                    credentials: 'include'
                }),
                fetch(`${URL_API_TESTE}/convites`, {
                    credentials: 'include'
                })
            ]);

            const colabData = await colabRes.json();
            const invitesData = await invitesRes.json();

            if (colabRes.ok) {
                setColaboradores(colabData.colaborators?.colaboradores || []);
            }
            if (invitesRes.ok) {
                setConvites(invitesData.convites || []);
            }
        } catch (err) {
            console.error("Erro ao carregar colaboradores:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteErro(null);
        setInviteSucesso(null);

        const validate = inviteSchema.safeParse({ email_destinatario: inviteEmail, cargo: inviteCargo, papel: invitePapel })
        if (!validate.success) {
            setInviteErro(formatZodErrors(validate.error))
            return
        }

        setInviting(true);
        try {
            const response = await fetch(`${URL_API_TESTE}/colaboration/${projetoId}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(validate.data)
            });

            if (response.ok) {
                setInviteSucesso('Convite enviado!');
                setInviteEmail('');
                setInviteCargo('');
                setInvitePapel('MUSICO');
                setTimeout(() => {
                    setShowInviteModal(false);
                    setInviteSucesso(null);
                }, 1500);
            } else {
                const data = await response.json();
                setInviteErro(data.mensagem || 'Erro ao enviar convite');
            }
        } catch (err) {
            console.error("Erro ao convidar:", err);
            setInviteErro('Erro ao enviar convite');
        } finally {
            setInviting(false);
        }
    };

    const handleAcceptInvite = async (convite: Convite) => {
        try {
            const response = await fetch(`${URL_API_TESTE}/colaboration/${convite.projetoId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ token_convite: convite.token_convite })
            });

            if (response.ok) {
                setConvites(prev => prev.filter(c => c.id !== convite.id));
                fetchData();
            }
        } catch (err) {
            console.error("Erro ao aceitar convite:", err);
        }
    };

    const handleRejectInvite = async (convite: Convite) => {
        try {
            const response = await fetch(`${URL_API_TESTE}/colaboration/${convite.projetoId}/reject`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setConvites(prev => prev.filter(c => c.id !== convite.id));
            }
        } catch (err) {
            console.error("Erro ao rejeitar convite:", err);
        }
    };

    if (loading) return <div className="loading-txt">Carregando colaboradores...</div>;

    const meusConvites = convites.filter(c => c.projetoId === projetoId);

    return (
        <div className="studio-colaboradores">
            {isOwner && (
                <button
                    className="btn-invite"
                    onClick={() => setShowInviteModal(true)}
                >
                    <UserPlus size={18} />
                    Convidar Colaborador
                </button>
            )}

            {isOwner && projetoId && <InviteLinksPanel projetoId={projetoId} />}

            {showInviteModal && (
                <div className="invite-modal-overlay" onClick={() => setShowInviteModal(false)} role="presentation">
                    <div className="invite-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="invite-modal-title" tabIndex={-1} ref={inviteModalRef}>
                        <h3 id="invite-modal-title">Convidar Colaborador</h3>
                        {inviteErro && <div className="form-error">{inviteErro}</div>}
                        {inviteSucesso && <div className="form-error" style={{ backgroundColor: 'var(--sucesso-bg)', color: 'var(--sucesso-texto)', borderColor: 'var(--sucesso)' }}>{inviteSucesso}</div>}
                        <form onSubmit={handleInvite}>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="Email do musician"
                                className="invite-input"
                                required
                            />
                            <input
                                type="text"
                                value={inviteCargo}
                                onChange={(e) => setInviteCargo(e.target.value)}
                                placeholder="Função no projeto (ex.: baixista)"
                                className="invite-input"
                                maxLength={30}
                            />
                            <label className="invite-label" htmlFor="invite-papel">Papel</label>
                            <select
                                id="invite-papel"
                                className="invite-input"
                                value={invitePapel}
                                onChange={(e) => setInvitePapel(e.target.value as PapelColaborador)}
                            >
                                {PAPEIS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label} — {p.descricao}</option>
                                ))}
                            </select>
                            <div className="invite-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowInviteModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-confirm"
                                    disabled={inviting}
                                >
                                    {inviting ? 'Enviando...' : 'Enviar Convite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {meusConvites.length > 0 && (
                <div className="pending-invites">
                    <h4>Convites Pendentes</h4>
                    <div className="invites-list">
                        {meusConvites.map(convite => (
                            <div key={convite.id} className="invite-item">
                                <div className="invite-info">
                                    <strong>{convite.remetenteNome || convite.email_destinatario}</strong>
                                    <span>{convite.cargo}{convite.papel ? ` · ${rotuloPapel(convite.papel)}` : ''}</span>
                                </div>
                                <div className="invite-actions">
                                    <button
                                        className="btn-accept"
                                        onClick={() => handleAcceptInvite(convite)}
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        className="btn-reject"
                                        onClick={() => handleRejectInvite(convite)}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="colaboradores-list">
                <h4>Colaboradores ({colaboradores.length})</h4>
                {colaboradores.length > 0 ? (
                    <div className="colab-grid">
                        {colaboradores.map(colab => (
                            <div
                                key={colab.usuario.id}
                                className="colab-card"
                            >
                                <Link
                                    to={`/usuario/${colab.usuario.id}`}
                                    className="colab-avatar"
                                    tabIndex={-1}
                                    aria-hidden="true"
                                >
                                    {colab.usuario.avatar_url ? (
                                        <img src={colab.usuario.avatar_url} alt="" />
                                    ) : (
                                        <div className="avatar-placeholder" aria-hidden="true">
                                            {colab.usuario.nome_completo?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </Link>
                                <Link to={`/usuario/${colab.usuario.id}`} className="colab-info">
                                    <strong>{colab.usuario.nome_completo}</strong>
                                    <span className="colab-role">
                                        <span className={`papel-badge papel-${colab.papel.toLowerCase()}`}>{rotuloPapel(colab.papel)}</span>
                                        {colab.cargo && colab.cargo !== 'membro' ? ` ${colab.cargo}` : ''}
                                    </span>
                                </Link>
                                {isOwner && (
                                    <button
                                        className="btn-auth reject"
                                        onClick={() => {
                                            setDeleteColabTarget({ userId: colab.usuario.id, nome: colab.usuario.nome_completo });
                                        }}
                                        title="Remover colaborador"
                                        aria-label={`Remover ${colab.usuario.nome_completo}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-colabs">
                        <p>Nenhum colaborador ainda. Convide musicians para ajudar!</p>
                    </div>
                )}
            </div>
            {deleteColabTarget && (
                <DeleteColabModal
                    projetoId={projetoId || ''}
                    userId={deleteColabTarget.userId}
                    userName={deleteColabTarget.nome}
                    isOpen={!!deleteColabTarget}
                    onClose={() => setDeleteColabTarget(null)}
                    onRemoved={fetchData}
                />
            )}
        </div>
    );
}

export { StudioColaboradores };
