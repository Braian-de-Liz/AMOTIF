import { ReactNode } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUserData } from '../contexts/UserDataContext';

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { usuario, loading } = useUserData();
    const navigate = useNavigate();
    const location = useLocation();

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
        return <Navigate to="/" replace state={{ from: location.pathname }} />;
    }

    return children;
}

export { ProtectedRoute };