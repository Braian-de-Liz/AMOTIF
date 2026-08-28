import { URL_API_TESTE } from './url_apis';
import { refreshAccessToken } from './refreshToken';

export async function apiClient<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const makeRequest = async (): Promise<T> => {
        const res = await fetch(`${URL_API_TESTE}${endpoint}`, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (res.status === 401) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                return makeRequest();
            }

            localStorage.clear();
            window.location.href = '/';
            throw new Error('Sessão expirada');
        }

        if (!res.ok) {
            const error = await res.json().catch(() => ({ mensagem: 'Erro desconhecido' }));
            throw new Error(error.mensagem || `Erro ${res.status}`);
        }

        return res.json();
    };

    return makeRequest();
}

export const api = {
    get: <T>(endpoint: string) => apiClient<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body: unknown) =>
        apiClient<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body: unknown) =>
        apiClient<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    patch: <T>(endpoint: string, body: unknown) =>
        apiClient<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(endpoint: string) => apiClient<T>(endpoint, { method: 'DELETE' }),
};
