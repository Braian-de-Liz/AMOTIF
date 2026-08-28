import { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUserData } from '../contexts/UserDataContext';

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { usuario, loading } = useUserData();
    const navigate = useNavigate();

    if (loading) {
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
                Carregando...
            </div>
        );
    }

    if (!usuario) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export { ProtectedRoute };