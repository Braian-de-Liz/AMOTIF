import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    titleId?: string
    children: React.ReactNode
    variant?: 'default' | 'danger'
}

function Modal({ isOpen, onClose, title, titleId, children, variant = 'default' }: ModalProps) {
    const contentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && contentRef.current) {
            contentRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose} role="presentation">
            <div
                ref={contentRef}
                className={`modal-content form_login ${variant === 'danger' ? 'danger-modal' : ''}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
            >
                {title && (
                    <h2 className={`form-title ${variant === 'danger' ? 'danger-title' : ''}`} id={titleId}>
                        {title}
                    </h2>
                )}
                {children}
            </div>
        </div>,
        document.body
    );
}

export { Modal };
