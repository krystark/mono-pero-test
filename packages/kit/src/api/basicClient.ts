import { getEnv } from '@krystark/app-kernel';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface BasicRequestInit extends RequestInit {
    /** по умолчанию: true — не добавляем Content-Type для FormData */
    autoContentType?: boolean;
}

/**
 * Клиент для CHESS/CRM эндпоинтов, которые требуют
 * Authorization: Basic ${API_TOKEN_BASIC}
 */
export async function basicFetch<T>(
    url: string,
    init: BasicRequestInit = {},
): Promise<{ status: number; data: T }> {
    const env = getEnv?.() ?? (import.meta as any).env ?? {};
    const token = String(env.VITE_API_TOKEN_BASIC || env.API_TOKEN_BASIC || '');
    const { headers, autoContentType = true, ...rest } = init;

    const h = new Headers(headers ?? {});
    h.set('Authorization', `Basic ${token}`);
    // Не переопределяем тип, если шлём FormData
    const bodyIsFormData = rest.body && typeof FormData !== 'undefined' && rest.body instanceof FormData;
    if (!bodyIsFormData && autoContentType && !h.has('Content-Type')) {
        h.set('Content-Type', 'application/json');
        h.set('Accept', 'application/json');
    }

    const res = await fetch(url, { ...rest, headers: h });
    let payload: any = null;
    try {
        payload = await res.json();
    } catch {
        // допустим 1/0 из легаси, вернём как есть
        payload = null;
    }
    return { status: res.status, data: payload as T };
}
