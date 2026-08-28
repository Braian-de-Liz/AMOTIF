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
    refetch: async () => { }
});

function UserDataProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${URL_API_TESTE}/auth/me`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setUsuario(data.usuario);
            } else {
                const data = await res.json().catch(() => ({}));
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
    }, []);

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