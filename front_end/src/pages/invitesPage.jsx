import { useState, useEffect } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';
import { Mail, Check, X, Clock } from 'lucide-react';
import '../styles/User.css';

function InvitesPage() {
    const [convites, setConvites] = useState([]);
    const [loading, setLoading] = useState(true);

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
            }
        } catch (err) {
            console.error("Erro ao carregar convites:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (convite) => {
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
            }
        } catch (err) {
            console.error("Erro ao aceitar convite:", err);
        }
    };

    const handleReject = async (convite) => {
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

    const handleNavigateToStudio = (projetoId) => {
        window.location.href = `/studio/${projetoId}`;
    };

    if (loading) return <div className="loading-txt">Carregando convites...</div>;

    return (
        <div className="invites-page">
        
        <header className="page-header">
                <h1>Meus Convites</h1>
                <p>Convites de colaboração em projetos</p>
            </header>

            <main className="invites-content">
                {convites.length > 0 ? (
                    <div className="invites-list">
                        {convites.map(convite => (
                            <div key={convite.id} className="invite-card">
                                <div className="invite-icon">
                                    <Mail size={24} />
                                </div>
                                <div className="invite-details">
                                    <h3>Convite para participar de projeto</h3>
                                    <p className="invite-project">
                                        <strong>Projeto:</strong> {convite.projetoTitulo || convite.projetoId}
                                    </p>
                                    <p className="invite-role">
                                        <strong>Cargo:</strong> {convite.cargo}
                                    </p>
                                    {convite.mensagem && (
                                        <p className="invite-message">"{convite.mensagem}"</p>
                                    )}
                                    <div className="invite-meta">
                                        <Clock size={14} />
                                        <span>Recebido em {new Date(convite.createdAt).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                                <div className="invite-actions">
                                    <button 
                                        className="btn-accept"
                                        onClick={() => handleAccept(convite)}
                                    >
                                        <Check size={18} />
                                        Aceitar
                                    </button>
                                    <button 
                                        className="btn-reject"
                                        onClick={() => handleReject(convite)}
                                    >
                                        <X size={18} />
                                        Recusar
                                    </button>
                                    <button 
                                        className="btn-view-project"
                                        onClick={() => handleNavigateToStudio(convite.projetoId)}
                                    >
                                        Ver Projeto
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-invites">
                        <Mail size={64} />
                        <h3>Nenhum convite pendente</h3>
                        <p>Quando alguém te convidar para participar de um projeto, você verá aqui.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export { InvitesPage };