import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
    const usuarioId = localStorage.getItem('usuario_id');

    if (!usuarioId) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export { ProtectedRoute };
