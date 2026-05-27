import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { URL_API_TESTE } from '../utility/url_apis';
import { Mail, Check, X, Clock } from 'lucide-react';
import type { Convite } from '../types';
import '../styles/User.css';

function InvitesPage() {
    const navigate = useNavigate();
    const [convites, setConvites] = useState<Convite[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        fetchConvites();
    }, []);

    const fetchConvites = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${URL_API_TESTE}/convites`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setConvites(data.convites || []);
            } else {
                setErro(data.mensagem || "Erro ao carregar convites.");
            }
        } catch (err) {
            setErro("Erro de conexão ao carregar convites.");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (convite: Convite) => {
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
                setErro(null);
            } else {
                const data = await response.json();
                setErro(data.mensagem || "Erro ao aceitar convite.");
            }
        } catch (err) {
            setErro("Erro de conexão ao aceitar convite.");
        }
    };

    const handleReject = async (convite: Convite) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${URL_API_TESTE}/colaboration/${convite.projetoId}/reject`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setConvites(prev => prev.filter(c => c.id !== convite.id));
                setErro(null);
            } else {
                const data = await response.json();
                setErro(data.mensagem || "Erro ao recusar convite.");
            }
        } catch (err) {
            setErro("Erro de conexão ao recusar convite.");
        }
    };

    const isExpired = (convite: Convite) => {
        return new Date(convite.expira_em) < new Date();
    };

    if (loading) return <div className="loading-txt">Carregando convites...</div>;

    return (
        <div className="invites-page">
            <header className="page-header">
                <h1>
                    <Mail size={28} />
                    Meus Convites
                </h1>
                <p>Convites para colaborar em projetos</p>
            </header>

            <main className="invites-content">
                {erro && <div className="error-msg">{erro}</div>}

                {convites.length === 0 && !erro ? (
                    <div className="empty-state">
                        <p>Você não tem convites pendentes no momento.</p>
                    </div>
                ) : (
                    <div className="invites-list-full">
                        {convites.map(convite => (
                            <div key={convite.id} className="invite-card">
                                <div className="invite-icon">
                                    <Mail size={24} />
                                </div>
                                <div className="invite-details">
                                    <strong>{convite.remetenteNome || convite.email_destinatario}</strong>
                                    <p>Convidou você para colaborar em um projeto</p>
                                    <small>Cargo: {convite.cargo}</small>
                                    <div className="invite-expiry">
                                        <Clock size={14} />
                                        <span>Expira em: {new Date(convite.expira_em).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="invite-card-actions">
                                    <button
                                        className="btn-accept"
                                        onClick={() => handleAccept(convite)}
                                        disabled={isExpired(convite)}
                                        title={isExpired(convite) ? 'Convite expirado' : 'Aceitar'}
                                    >
                                        <Check size={18} />
                                        Aceitar
                                    </button>
                                    <button
                                        className="btn-reject"
                                        onClick={() => handleReject(convite)}
                                        disabled={isExpired(convite)}
                                        title={isExpired(convite) ? 'Convite expirado' : 'Recusar'}
                                    >
                                        <X size={18} />
                                        Recusar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export { InvitesPage };
