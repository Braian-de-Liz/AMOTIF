import { useState, useEffect, useCallback, useRef } from 'react';

interface UseModalReturn {
    isOpen: boolean
    open: () => void
    close: () => void
    overlayProps: {
        onClick: () => void
        role: 'presentation'
    }
    contentProps: {
        onClick: (e: React.MouseEvent) => void
        role: 'dialog'
        'aria-modal': true
    }
}

function useModal(): UseModalReturn {
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                close();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, close]);

    const overlayProps = {
        onClick: close,
        role: 'presentation' as const,
    };

    const contentProps = {
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        role: 'dialog' as const,
        'aria-modal': true as const,
    };

    return { isOpen, open, close, overlayProps, contentProps };
}

export { useModal };
