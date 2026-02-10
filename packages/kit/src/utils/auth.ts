import { safeStorage, type StorageScope } from "./safeStorage";
import { AUTH_STORAGE_KEY } from "./constants";

export type StoredAuth = { token?: string | null };

export function getAuthTokenFromStorage(): string | null {
    const raw = safeStorage.getAny(AUTH_STORAGE_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as StoredAuth | null;
        return parsed?.token ?? null;
    } catch {
        return null;
    }
}

export function setAuthToStorage(auth: StoredAuth, scope: StorageScope) {
    safeStorage.remove(AUTH_STORAGE_KEY, "any");
    safeStorage.set(AUTH_STORAGE_KEY, JSON.stringify(auth ?? {}), scope);
}

export function clearAuthFromStorage() {
    safeStorage.remove(AUTH_STORAGE_KEY, "any");
}

export function buildHeadersFromStorage(opts?: {
    accept?: string;
    contentType?: string;
    token?: string | null;
}) {
    const h = new Headers();
    if (opts?.accept) h.set("Accept", opts.accept);
    if (opts?.contentType) h.set("Content-Type", opts.contentType);

    const token = opts?.token ?? getAuthTokenFromStorage();
    if (token) h.set("Authorization", `Bearer ${token}`);

    return h;
}
