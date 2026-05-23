import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { URL_API_TESTE } from '../utility/url_apis';
import { Bell } from 'lucide-react';
import '../styles/Shared.css';

export const Notificacoes = () => {
    const [notificacoes, setNotificacoes] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const popupRef = useRef(null);
    const bellButtonRef = useRef(null);

    const naoLidas = notificacoes.filter(n => !n.lida).length;

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const togglePopup = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

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

        const interval = setInterval(fetchNotificacoes, 180000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                const bellButton = document.querySelector('.notifications-bell');
                const fabButton = document.querySelector('.floating-notifications-btn');
                const isBellClick = bellButton && bellButton.contains(event.target);
                const isFabClick = fabButton && fabButton.contains(event.target);
                if (!isBellClick && !isFabClick) {
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <div className="notifications-wrapper">
                <button 
                    className="notifications-bell" 
                    onClick={togglePopup}
                    aria-label="Notificações"
                    aria-expanded={isOpen}
                    aria-controls="notifications-popup"
                    ref={bellButtonRef}
                >
                    <Bell size={20} />
                    {naoLidas > 0 && (
                        <span className="notifications-badge">{naoLidas}</span>
                    )}
                </button>
            </div>

            {isOpen && createPortal(
                <div className="notifications-popup" ref={popupRef} id="notifications-popup" role="dialog" aria-label="Notificações">
                    <div className="notifications-popup-header">
                        <h3 id="notifications-popup-title">Notificações</h3>
                        <button className="notifications-popup-close" onClick={() => setIsOpen(false)} aria-label="Fechar notificações">&times;</button>
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
                </div>,
                document.body
            )}

            {createPortal(
                <button
                    className="floating-notifications-btn"
                    onClick={togglePopup}
                    aria-label="Notificações"
                    aria-expanded={isOpen}
                    aria-controls="notifications-popup"
                >
                    <Bell size={24} />
                    {naoLidas > 0 && (
                        <span className="notifications-badge">{naoLidas}</span>
                    )}
                </button>,
                document.body
            )}
        </>
    );
};