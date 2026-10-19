import { useEffect, useRef } from 'react';

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'audio[controls]',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Prende o Tab dentro de `ref`, fecha com Esc e devolve o foco ao elemento
 * que o tinha antes de `active` virar true.
 */
function useFocusTrap(
    ref: React.RefObject<HTMLElement | null>,
    active: boolean,
    onClose?: () => void
) {
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        if (!active) return;
        const container = ref.current;
        if (!container) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;
        if (!container.contains(document.activeElement)) {
            const first = container.querySelector<HTMLElement>(FOCUSABLE);
            (first ?? container).focus();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            // Com diálogos empilhados, só o que contém o foco reage
            if (!container.contains(document.activeElement)) return;
            if (e.key === 'Escape') {
                onCloseRef.current?.();
                return;
            }
            if (e.key !== 'Tab') return;

            const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
            if (items.length === 0) {
                e.preventDefault();
                container.focus();
                return;
            }
            const first = items[0];
            const last = items[items.length - 1];
            const current = document.activeElement;

            if (e.shiftKey && (current === first || current === container)) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && current === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [active, ref]);
}

export { useFocusTrap };
