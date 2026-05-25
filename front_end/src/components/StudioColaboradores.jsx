import { useState, useEffect, useRef } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';
import { UserPlus, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { inviteSchema } from '../schemas/colaborationSchema'
import { formatZodErrors } from '../utility/validationHelpers'

function StudioColaboradores({ projetoId, isOwner }) {
    const [colaboradores, setColaboradores] = useState([]);
    const [convites, setConvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [inviteErro, setInviteErro] = useState(null);
    const [inviteSucesso, setInviteSucesso] = useState(null);
    const navigate = useNavigate();
    const inviteModalRef = useRef(null);

    useEffect(() => {
        if (!showInviteModal) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setShowInviteModal(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showInviteModal]);

    useEffect(() => {
        fetchData();
    }, [projetoId]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            
            const [colabRes, invitesRes] = await Promise.all([
                fetch(`${URL_API_TESTE}/colaboration/${projetoId}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                }),
                fetch(`${URL_API_TESTE}/convites`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                })
            ]);

            const colabData = await colabRes.json();
            const invitesData = await invitesRes.json();

            if (colabRes.ok) {
                setColaboradores(colabData.colaboradores || []);
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

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteErro(null);
        setInviteSucesso(null);

        const validate = inviteSchema.safeParse({ email_destinatario: inviteEmail })
        if (!validate.success) {
            setInviteErro(formatZodErrors(validate.error))
            return
        }

        setInviting(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${URL_API_TESTE}/colaboration/${projetoId}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email_destinatario: inviteEmail })
            });

            if (response.ok) {
                setInviteSucesso('Convite enviado!');
                setInviteEmail('');
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

    const handleAcceptInvite = async (convite) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${URL_API_TESTE}/colaboration/${convite.projetoId}/accept`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
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

    const handleRejectInvite = async (convite) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${URL_API_TESTE}/colaboration/${convite.projetoId}/reject`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
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

            {showInviteModal && (
                <div className="invite-modal-overlay" onClick={() => setShowInviteModal(false)} role="presentation">
                    <div className="invite-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="invite-modal-title" ref={inviteModalRef}>
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
                                    <span>{convite.cargo}</span>
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
                                key={colab.id} 
                                className="colab-card"
                                onClick={() => navigate(`/usuario/${colab.userId}`)}
                            >
                                <div className="colab-avatar">
                                    {colab.usuario.avatar_url ? (
                                        <img src={colab.usuario.avatar_url} alt={colab.usuario.nome_completo} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {colab.usuario.nome_completo?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="colab-info">
                                    <strong>{colab.usuario.nome_completo}</strong>
                                    <span className="colab-role">{colab.cargo}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-colabs">
                        <p>Nenhum colaborador ainda. Convide musicians para ajudar!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export { StudioColaboradores };