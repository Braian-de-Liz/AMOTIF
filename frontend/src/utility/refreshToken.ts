import { URL_API_TESTE } from './url_apis';

let refreshPromise: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const res = await fetch(`${URL_API_TESTE}/usuario/refresh`, {
                method: 'POST',
                credentials: 'include',
            });
            return res.ok;
        } catch {
            return false;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}
