import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
    const token = localStorage.getItem("token");
    const usuarioId = localStorage.getItem("usuario_id");

    if (!token || !usuarioId) {
        localStorage.clear();
        return <Navigate to="/" replace />;
    }

    return children;
}

export { ProtectedRoute };
