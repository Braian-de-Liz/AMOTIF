import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { URL_API_TESTE } from '../utility/url_apis';
import { Mail } from 'lucide-react';
import type { Convite } from '../types';
import '../styles/User.css';

function InvitesPage() {
    const navigate = useNavigate();
    const { data, loading, error, refetch } = useApi<{ convites: Convite[] }>(
        `/convites`,
        { immediate: true }
    );

    const [accepting, setAccepting] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<string | null>(null);

    const handleAccept = async (convite: Convite) => {
        setAccepting(convite.id);
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
                refetch();
            }
        } catch {
            // silent
        } finally {
            setAccepting(null);
        }
    };

    const handleReject = async (convite: Convite) => {
        setRejecting(convite.id);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${URL_API_TESTE}/colaboration/${convite.projetoId}/reject`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                refetch();
            }
        } catch {
            // silent
        } finally {
            setRejecting(null);
        }
    };

    if (loading) return <div className="loading-txt">Carregando convites...</div>;

    const convites = data?.convites || [];

    return (
        <div className="invites-page">
            <div className="page-header">
                <h1><Mail size={28} /> Convites</h1>
                <p>Convites para colaboração em projetos</p>
            </div>

            <div className="invites-content">
                {error && <div className="error-msg">{error}</div>}

                {convites.length === 0 ? (
                    <div className="empty-invites">
                        <Mail size={48} />
                        <h3>Nenhum convite pendente</h3>
                        <p>Quando alguém te convidar para colaborar em um projeto, ele aparecerá aqui.</p>
                    </div>
                ) : (
                    <div className="invites-list">
                        {convites.map(convite => (
                            <div key={convite.id} className="invite-card">
                                <div className="invite-icon">
                                    <Mail size={24} />
                                </div>
                                <div className="invite-details">
                                    <h3>Convite para Collaboração</h3>
                                    <p className="invite-project">
                                        Projeto: <strong onClick={() => navigate(`/studio/${convite.projetoId}`)} style={{ cursor: 'pointer', color: 'var(--verde-musgo)' }}>
                                            Ver projeto
                                        </strong>
                                    </p>
                                    <p className="invite-role">Cargo: {convite.cargo}</p>
                                    <div className="invite-meta">
                                        <span>Enviado por: {convite.remetenteNome || 'Desconhecido'}</span>
                                        <span>•</span>
                                        <span>Expira: {new Date(convite.expira_em).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="invite-actions">
                                    <button
                                        className="btn-accept"
                                        onClick={() => handleAccept(convite)}
                                        disabled={accepting === convite.id || rejecting === convite.id}
                                    >
                                        {accepting === convite.id ? '...' : 'Aceitar'}
                                    </button>
                                    <button
                                        className="btn-reject"
                                        onClick={() => handleReject(convite)}
                                        disabled={accepting === convite.id || rejecting === convite.id}
                                    >
                                        {rejecting === convite.id ? '...' : 'Rejeitar'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export { InvitesPage };
