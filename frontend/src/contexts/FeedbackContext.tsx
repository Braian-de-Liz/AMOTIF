import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { Modal } from '../components/Modal';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
    id: number
    kind: ToastKind
    message: string
}

interface ConfirmOptions {
    title: string
    message: ReactNode
    confirmLabel?: string
    danger?: boolean
}

interface Feedback {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
    confirm: (options: ConfirmOptions) => Promise<boolean>
}

const TOAST_MS = 5000;

// Fora do provider (ex.: testes isolados) cai nos diálogos nativos para não perder a mensagem.
const fallback: Feedback = {
    success: message => console.info(message),
    error: message => console.error(message),
    info: message => console.info(message),
    confirm: ({ message }) => Promise.resolve(typeof message === 'string' ? window.confirm(message) : false),
};

const FeedbackContext = createContext<Feedback>(fallback);

function FeedbackProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [pending, setPending] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
    const nextId = useRef(0);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const push = useCallback((kind: ToastKind, message: string) => {
        const id = nextId.current++;
        setToasts(prev => [...prev.slice(-3), { id, kind, message }]);
        window.setTimeout(() => dismiss(id), TOAST_MS);
    }, [dismiss]);

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>(resolve => setPending({ ...options, resolve }));
    }, []);

    const answer = (ok: boolean) => {
        pending?.resolve(ok);
        setPending(null);
    };

    const value = useMemo<Feedback>(() => ({
        success: m => push('success', m),
        error: m => push('error', m),
        info: m => push('info', m),
        confirm,
    }), [push, confirm]);

    const icon = (kind: ToastKind) =>
        kind === 'success' ? <CheckCircle2 size={18} /> : kind === 'error' ? <AlertCircle size={18} /> : <Info size={18} />;

    return (
        <FeedbackContext.Provider value={value}>
            {children}

            {createPortal(
                <div className="toast-stack" aria-live="polite">
                    {toasts.map(t => (
                        <div key={t.id} className={`toast toast-${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
                            {icon(t.kind)}
                            <span>{t.message}</span>
                            <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Fechar aviso">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>,
                document.body
            )}

            <Modal
                isOpen={!!pending}
                onClose={() => answer(false)}
                title={pending?.title}
                titleId="feedback-confirm-title"
                variant={pending?.danger ? 'danger' : 'default'}
            >
                <p className="confirm-message">{pending?.message}</p>
                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => answer(false)}>Cancelar</button>
                    <button
                        type="button"
                        className={pending?.danger ? 'btn-danger' : 'btn-confirm'}
                        onClick={() => answer(true)}
                    >
                        {pending?.confirmLabel ?? 'Confirmar'}
                    </button>
                </div>
            </Modal>
        </FeedbackContext.Provider>
    );
}

function useFeedback(): Feedback {
    return useContext(FeedbackContext);
}

export { FeedbackProvider, useFeedback };
