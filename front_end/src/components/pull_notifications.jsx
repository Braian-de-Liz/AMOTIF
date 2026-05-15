import { useEffect, useState, useRef } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';

export const Notificacoes = () => {
    const [notificacoes, setNotificacoes] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const popupRef = useRef(null);

    const naoLidas = notificacoes.filter(n => !n.lida).length;

    useEffect(() => {
        const fetchNotificacoes = async () => {
            const token = localStorage.getItem('token');

            if (!token || token === "null") return;

            try {
                const response = await fetch(`${URL_API_TESTE}/notifications`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 401) {
                    console.warn("Sessão expirada ou token inválido.");
                    return;
                }

                const data = await response.json();

                if (data.notificacoes && Array.isArray(data.notificacoes)) {
                    setNotificacoes(data.notificacoes);
                }
                else if (Array.isArray(data)) {
                    setNotificacoes(data);
                }
                else {
                    console.error("Formato de resposta inesperado:", data);
                    setNotificacoes([]);
                }
            }

            catch (error) {
                console.error("Erro ao buscar notificações:", error);
            }
        };

        fetchNotificacoes();

        const interval = setInterval(fetchNotificacoes, 20000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                const bellButton = document.querySelector('.notifications-bell');
                if (bellButton && !bellButton.contains(event.target)) {
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const togglePopup = () => setIsOpen(!isOpen);

    return (
        <div className="notifications-wrapper">
            <button 
                className="notifications-bell" 
                onClick={togglePopup}
                aria-label="Notificações"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {naoLidas > 0 && (
                    <span className="notifications-badge">{naoLidas}</span>
                )}
            </button>

            {isOpen && (
                <div className="notifications-popup" ref={popupRef}>
                    <div className="notifications-popup-header">
                        <h3>Notificações</h3>
                        <button className="notifications-popup-close" onClick={() => setIsOpen(false)}>&times;</button>
                    </div>
                    <div className="notifications-popup-content">
                        <div className="notifications-container">
                            {notificacoes.length > 0 ? (
                                notificacoes.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`notification-item ${n.lida ? '' : 'unread'}`}
                                    >
                                        {n.origem?.avatar_url && (
                                            <img
                                                src={n.origem.avatar_url}
                                                alt="Avatar"
                                            />
                                        )}

                                        <div>
                                            <p>
                                                <strong>{n.origem?.nome_completo || 'Sistema'}:</strong> {n.mensagem}
                                            </p>
                                            <span>
                                                {new Date(n.createdAt).toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="notifications-empty">Nenhuma notificação por enquanto.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};