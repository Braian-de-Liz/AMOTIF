// front_end/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");
    const usuarioId = localStorage.getItem("usuario_id");

    if (!token || !usuarioId) {
        localStorage.clear(); 
        return <Navigate to="/" replace />;
    }

    return children;
}

export { ProtectedRoute };