import { safeStorage } from '../utils/safeStorage';
import { USER_STORAGE_KEY } from '../utils/constants';

export type FetcherOptions = {
    baseUrl?: string;
    token?: string | null;
    /** по умолчанию true: токен берём из opts.token или из storage */
    auth?: boolean;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
};

function resolveUrl(path: string, base?: string) {
    if (/^https?:\/\//i.test(path)) return path;
    if (base) {
        const b = base.endsWith('/') ? base : base + '/';
        const p = path.startsWith('/') ? path.slice(1) : path;
        return b + p;
    }
    return path;
}

function isFetcherOptions(x: any): x is FetcherOptions {
    return (
        !!x &&
        (
            Object.prototype.hasOwnProperty.call(x, 'baseUrl') ||
            Object.prototype.hasOwnProperty.call(x, 'token') ||
            Object.prototype.hasOwnProperty.call(x, 'auth')
        )
    );
}

export async function apiFetch<T>(
    path: string,
    init: RequestInit = {},
    opts?: FetcherOptions
): Promise<T> {
    const base = opts?.baseUrl ?? (import.meta as any).env?.VITE_API_URL ?? '/';
    const url = resolveUrl(path, base);

    // Не ставим Content-Type для FormData/Blob, но ставим для строкового JSON
    const body = init.body as any;
    const isStringBody = typeof body === 'string';

    const authEnabled = opts?.auth !== false; // ← NEW

    let token = opts?.token ?? null;

    if (authEnabled && !token) {
        try {
            const raw = safeStorage.get(USER_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            token = parsed?.token ?? null;
        } catch {
            /* noop */
        }
    }

    // нормализуем headers
    const headers = new Headers(init.headers);
    if (isStringBody && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    // если auth выключен — гарантированно убираем Authorization
    if (!authEnabled) {
        headers.delete('Authorization');
    } else if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const method = opts?.method ?? init.method ?? 'GET';

    const res = await fetch(url, {
        ...init,
        method,
        headers,
        signal: init.signal, // ← ВАЖНО: пропускаем AbortSignal от React Query
    });

    const ct = res.headers.get('content-type') || '';
    const isJson = /\bjson\b/i.test(ct);
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
        const err: any = new Error('API Error');
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data as T;
}

/** ---------- GET с поддержкой RequestInit (signal) и обратной совместимостью ---------- */
export function getJSON<T>(path: string, a?: RequestInit | FetcherOptions, b?: FetcherOptions) {
    let init: RequestInit | undefined;
    let opts: FetcherOptions | undefined;

    if (isFetcherOptions(a)) {
        init = { method: 'GET' };
        opts = a;
    } else {
        init = { ...(a || {}), method: 'GET' };
        opts = b;
    }
    return apiFetch<T>(path, init!, opts);
}

/** ---------- Универсальная отправка (с авто-JSON и FormData) ---------- */
export const sendJSON = <T>(
    method: string,
    path: string,
    body?: unknown,
    opts?: FetcherOptions
) => {
    const init: RequestInit = {
        method,
        body:
            typeof body === 'string' || body instanceof Blob || body instanceof FormData
                ? (body as any)
                : body != null
                    ? JSON.stringify(body)
                    : undefined,
    };
    return apiFetch<T>(path, init, opts);
};

export const postJSON = <T>(path: string, body: unknown, opts?: FetcherOptions) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }, opts);

export const putJSON = <T>(path: string, body: unknown, opts?: FetcherOptions) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }, opts);

export const patchJSON = <T>(path: string, body: unknown, opts?: FetcherOptions) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, opts);

export const deleteJSON = <T>(path: string, opts?: FetcherOptions) =>
    apiFetch<T>(path, { method: 'DELETE' }, opts);
