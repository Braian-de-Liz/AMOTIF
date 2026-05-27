import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { URL_API_TESTE } from '../utility/url_apis';
import { Bell } from 'lucide-react';
import type { Notification } from '../types';
import '../styles/Shared.css';

export const Notificacoes = () => {
    const [notificacoes, setNotificacoes] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [popupStyle, setPopupStyle] = useState<React.CSSProperties>();
    const popupRef = useRef<HTMLDivElement | null>(null);
    const bellButtonRef = useRef<HTMLButtonElement | null>(null);
    const floatingButtonRef = useRef<HTMLButtonElement | null>(null);

    const naoLidas = notificacoes.filter(n => !n.lida).length;

    const closePopup = useCallback(() => {
        setIsOpen(false);
        setPopupStyle(undefined);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!popupRef.current || !target?.parentNode) return;

            const isOutsidePopup = !popupRef.current.contains(target);
            if (!isOutsidePopup) return;

            const isBellClick = bellButtonRef.current?.contains(target);
            const isFabClick = floatingButtonRef.current?.contains(target);

            if (!isBellClick && !isFabClick) {
                closePopup();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closePopup();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closePopup]);

    const togglePopup = useCallback(() => {
        const nextOpen = !isOpen;
        if (!nextOpen) {
            setPopupStyle(undefined);
        } else {
            const fabRect = floatingButtonRef.current?.getBoundingClientRect();
            const bellRect = bellButtonRef.current?.getBoundingClientRect();
            const activeRect = (fabRect && fabRect.width > 0) ? fabRect : bellRect;
            if (activeRect) {
                setPopupStyle({
                    position: 'fixed',
                    top: `${activeRect.bottom + 4}px`,
                    right: `${Math.max(8, window.innerWidth - activeRect.right)}px`,
                });
            }
        }
        setIsOpen(nextOpen);
    }, [isOpen]);

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
            <div className="notifications-wrapper">
                <button
                    ref={bellButtonRef}
                    className="notifications-bell"
                    onClick={togglePopup}
                    aria-label="Notificações"
                    aria-expanded={isOpen}
                    aria-controls="notifications-popup"
                >
                    <Bell size={20} />
                    {naoLidas > 0 && (
                        <span className="notifications-badge">
                            {naoLidas > 99 ? '99+' : naoLidas}
                        </span>
                    )}
                </button>
            </div>

            {isOpen && createPortal(
                <div
                    ref={popupRef}
                    className="notifications-popup"
                    style={popupStyle}
                    id="notifications-popup"
                    role="dialog"
                    aria-label="Notificações"
                >
                    <div className="notifications-popup-header">
                        <h3>Notificações</h3>
                        <button
                            className="notifications-popup-close"
                            onClick={closePopup}
                            aria-label="Fechar notificações"
                        >
                            ×
                        </button>
                    </div>
                    <div className="notifications-popup-content">
                        {notificacoes.length === 0 ? (
                            <p className="notifications-empty">Nenhuma notificação por enquanto.</p>
                        ) : (
                            notificacoes.map(n => (
                                <div
                                    key={n.id}
                                    className={`notification-item ${!n.lida ? 'unread' : ''}`}
                                >
                                    <div>
                                        <p><strong>{n.mensagem}</strong></p>
                                        <span className="notification-time">
                                            {getTimeAgo(n.criado_em)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}

            {createPortal(
                <button
                    ref={floatingButtonRef}
                    className="floating-notifications-btn"
                    onClick={togglePopup}
                    aria-label="Notificações"
                    aria-expanded={isOpen}
                    aria-controls="notifications-popup"
                >
                    <Bell size={24} />
                    {naoLidas > 0 && (
                        <span className="notifications-badge">
                            {naoLidas > 99 ? '99+' : naoLidas}
                        </span>
                    )}
                </button>,
                document.body
            )}
        </>
    );
};
