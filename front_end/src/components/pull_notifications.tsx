import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { URL_API_TESTE } from '../utility/url_apis';
import { Bell } from 'lucide-react';
import type { Notification } from '../types';
import '../styles/Shared.css';

export const Notificacoes = () => {
    const [notificacoes, setNotificacoes] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement | null>(null);
    const bellButtonRef = useRef<HTMLButtonElement | null>(null);

    const naoLidas = notificacoes.filter(n => !n.lida).length;

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
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

                if (Array.isArray(data.notificacoes)) {
                    setNotificacoes(data.notificacoes);
                }
            } catch (error) {
                console.error("Erro ao buscar notificações:", error);
            }
        };

        fetchNotificacoes();

        const interval = setInterval(fetchNotificacoes, 180000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'INVITE_RECEIVED': return '📩';
            case 'NEW_LAYER': return '🎵';
            case 'LAYER_APPROVED': return '✅';
            case 'NEW_FOLLOWER': return '👤';
            case 'NEW_LIKE': return '❤️';
            case 'PROJECT_RELEASED': return '🚀';
            default: return '🔔';
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'agora';
        if (diffMins < 60) return `${diffMins}min`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}d`;
    };

    return (
        <>
            <button
                ref={bellButtonRef}
                className="notification-bell-btn"
                onClick={togglePopup}
                aria-label="Notificações"
            >
                <Bell size={24} className="nav-icon" />
                {naoLidas > 0 && (
                    <span className="notification-badge">
                        {naoLidas > 99 ? '99+' : naoLidas}
                    </span>
                )}
            </button>

            {isOpen && createPortal(
                <>
                    <div className="notification-overlay" onClick={() => setIsOpen(false)} />
                    <div
                        ref={popupRef}
                        className="notification-popup"
                        role="dialog"
                        aria-label="Notificações"
                    >
                        <div className="notification-header">
                            <h3>Notificações</h3>
                            <button
                                className="notification-close"
                                onClick={() => setIsOpen(false)}
                                aria-label="Fechar"
                            >
                                ×
                            </button>
                        </div>

                        <div className="notification-list">
                            {notificacoes.length === 0 ? (
                                <p className="empty-notifications">Nenhuma notificação.</p>
                            ) : (
                                notificacoes.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`notification-item ${!notif.lida ? 'unread' : ''}`}
                                    >
                                        <span className="notification-icon">
                                            {getIcon(notif.tipo)}
                                        </span>
                                        <div className="notification-content">
                                            <p>{notif.mensagem}</p>
                                            <span className="notification-time">
                                                {getTimeAgo(notif.criado_em)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
};
