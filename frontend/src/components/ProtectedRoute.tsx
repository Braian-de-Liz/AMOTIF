import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { api } from '../utility/apiClient';

function ProtectedRoute({ children }: { children: ReactNode }) {
    const location = useLocation();
    const [isValidating, setIsValidating] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const usuarioId = localStorage.getItem('usuario_id');

        if (!usuarioId) {
            localStorage.clear();
            setIsValidating(false);
            return;
        }

        const validateSession = async () => {
            try {
                await api.get(`/usuario/${usuarioId}/completo`);
                setIsAuthorized(true);
            } catch {
                localStorage.clear();
            } finally {
                setIsValidating(false);
            }
        };

        validateSession();
    }, [location.pathname]);

    if (isValidating) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
                color: 'var(--verde-musgo)',
                fontSize: '1.2rem',
                textAlign: 'center'
            }}>
                Validando sessão...
            </div>
        );
    }

    if (!isAuthorized) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    return children;
}

export { ProtectedRoute };
