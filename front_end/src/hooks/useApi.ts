import { useState, useEffect, useRef, useCallback } from 'react';
import { URL_API_TESTE } from '../utility/url_apis';

interface UseApiOptions extends Omit<RequestInit, 'signal'> {
    immediate?: boolean
}

interface UseApiResult<T> {
    data: T | null
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

function useApi<T>(urlPath: string, options: UseApiOptions = {}): UseApiResult<T> {
    const { immediate = true, ...fetchOptions } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    const fetchData = useCallback(async () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }

        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            const headers: Record<string, string> = {
                ...(fetchOptions.headers as Record<string, string> || {}),
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${URL_API_TESTE}${urlPath}`, {
                ...fetchOptions,
                headers,
                signal: controller.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.mensagem || `Erro ${response.status}`);
            }

            const result = await response.json();
            if (mountedRef.current) {
                setData(result);
            }
        } catch (err) {
            if (mountedRef.current && !(err instanceof DOMException && err.name === 'AbortError')) {
                setError(err instanceof Error ? err.message : "Erro de conexão.");
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [urlPath, fetchOptions.method, JSON.stringify(fetchOptions.body)]);

    useEffect(() => {
        mountedRef.current = true;
        if (immediate) {
            fetchData();
        }
        return () => {
            mountedRef.current = false;
            if (abortRef.current) {
                abortRef.current.abort();
            }
        };
    }, [fetchData, immediate]);

    return { data, loading, error, refetch: fetchData };
}

function useApiMutation<TBody = unknown, TResponse = unknown>() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const mutate = useCallback(async (
        urlPath: string,
        method: string,
        body?: TBody
    ): Promise<TResponse | null> => {
        if (abortRef.current) {
            abortRef.current.abort();
        }

        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            if (body) {
                headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${URL_API_TESTE}${urlPath}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.mensagem || `Erro ${response.status}`);
            }

            return data as TResponse;
        } catch (err) {
            if (!(err instanceof DOMException && err.name === 'AbortError')) {
                setError(err instanceof Error ? err.message : "Erro de conexão.");
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (abortRef.current) {
                abortRef.current.abort();
            }
        };
    }, []);

    return { mutate, loading, error, setError };
}

export { useApi, useApiMutation };
