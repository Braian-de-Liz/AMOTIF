import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';
import type { User } from '../types';

interface UserDataContextValue {
    usuario: User | null
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

const UserDataContext = createContext<UserDataContextValue>({
    usuario: null,
    loading: true,
    error: null,
    refetch: async () => {}
});

function UserDataProvider({ children }: { children: ReactNode }) {
    const usuarioId = localStorage.getItem("usuario_id");
    const [usuario, setUsuario] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        if (!usuarioId) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${URL_API_TESTE}/usuario/${usuarioId}/completo`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
                setUsuario(data.usuario);
                setError(null);
            } else {
                setError(data.mensagem || "Erro ao carregar dados do usuário.");
            }
        } catch {
            setError("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [usuarioId]);

    return (
        <UserDataContext.Provider value={{ usuario, loading, error, refetch: fetchUser }}>
            {children}
        </UserDataContext.Provider>
    );
}

function useUserData() {
    return useContext(UserDataContext);
}

export { UserDataProvider, useUserData };
