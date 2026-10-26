import { URL_API_TESTE } from './url_apis';

// Tempo para o cookie novo, definido pela outra aba que venceu a corrida, chegar ao navegador.
const CONCURRENT_REFRESH_WAIT_MS = 300;

let refreshPromise: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const res = await fetch(`${URL_API_TESTE}/usuario/refresh`, {
                method: 'POST',
                credentials: 'include',
            });
            if (res.status === 409) {
                // Outra aba já renovou: os cookies são compartilhados, basta aguardar e repetir a requisição.
                await new Promise(resolve => setTimeout(resolve, CONCURRENT_REFRESH_WAIT_MS));
                return true;
            }
            return res.ok;
        } catch {
            return false;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}
