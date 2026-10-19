import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';

interface ActionMenuItem {
    label: string
    icon?: ReactNode
    onSelect: () => void
    danger?: boolean
    disabled?: boolean
}

interface ActionMenuProps {
    /** Rótulo acessível do botão "⋯". */
    label: string
    items: ActionMenuItem[]
    /** Classe do botão-gatilho; o padrão combina com os botões de ícone da faixa. */
    triggerClassName?: string
}

/** Menu "⋯" para ações secundárias: fecha com Esc ou clique fora. */
function ActionMenu({ label, items, triggerClassName = 'btn-save-version' }: ActionMenuProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        <div className="track-menu" ref={rootRef}>
            <button
                type="button"
                className={triggerClassName}
                onClick={() => setOpen(v => !v)}
                title={label}
                aria-label={label}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <MoreHorizontal size={14} />
            </button>
            {open && (
                <div className="track-menu-list" role="menu">
                    {items.map(item => (
                        <button
                            key={item.label}
                            type="button"
                            role="menuitem"
                            className={item.danger ? 'danger' : undefined}
                            disabled={item.disabled}
                            onClick={() => { setOpen(false); item.onSelect(); }}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export { ActionMenu };
export type { ActionMenuItem };
