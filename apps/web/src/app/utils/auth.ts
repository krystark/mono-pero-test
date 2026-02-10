import { getStore } from '@krystark/app-kernel';
import { getAuthTokenFromStorage } from '@krystark/app-common';

/** Сначала пробуем store.user.token, иначе берём из storage */
export function getAuthToken(): string | null {
    try {
        const store = getStore();             // может бросить, если setStore() ещё не был вызван
        const fromStore = (store as any)?.user?.token as string | undefined;
        if (fromStore) return fromStore ?? null;
    } catch {
        // ignore — упадём в storage
    }
    return getAuthTokenFromStorage();
}

export function buildHeaders(opts?: {
    accept?: string;
    contentType?: string;
    token?: string | null;
}) {
    const h = new Headers();
    if (opts?.accept) h.set('Accept', opts.accept);
    if (opts?.contentType) h.set('Content-Type', opts.contentType);

    const token = opts?.token ?? getAuthToken();
    if (token) h.set('Authorization', `Bearer ${token}`);

    return h;
}
