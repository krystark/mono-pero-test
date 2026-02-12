// app/auth/authToken.ts
import { getStore } from "@krystark/app-kernel";
import { getAuthTokenFromStorage } from "@krystark/app-kit";

export const AUTH_STORAGE_KEY = "mono.auth";
export const AUTH_EVENT = "mono-auth-changed";
const RUNTIME_TOKEN_KEY = "__monoAuthToken__";

function emitAuthChanged() {
    window.dispatchEvent(new Event(AUTH_EVENT));
}

function safeGetStorage(kind: "local" | "session"): Storage | null {
    try {
        return kind === "local" ? window.localStorage : window.sessionStorage;
    } catch {
        return null;
    }
}

function readTokenFromStorageSafe(storage: Storage | null): string | null {
    if (!storage) return null;
    try {
        const raw = storage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;

        // поддержка "token" и "accessToken"
        if (!raw.trim().startsWith("{")) return raw;

        const parsed = JSON.parse(raw) as any;
        return parsed?.token ?? parsed?.accessToken ?? null;
    } catch {
        return null;
    }
}

function getRuntimeToken(): string | null {
    try {
        return (window as any)[RUNTIME_TOKEN_KEY] ?? null;
    } catch {
        return null;
    }
}

function setRuntimeToken(token: string | null) {
    try {
        (window as any)[RUNTIME_TOKEN_KEY] = token;
    } catch {}
}

export function getAuthToken(): string | null {
    // 1) store
    try {
        const store = getStore();
        const fromStore = (store as any)?.user?.token as string | undefined;
        if (fromStore) return fromStore ?? null;
    } catch {
        // ignore
    }

    // 2) storage (safe)
    const ls = safeGetStorage("local");
    const ss = safeGetStorage("session");
    const fromStorage = readTokenFromStorageSafe(ls) ?? readTokenFromStorageSafe(ss);
    if (fromStorage) return fromStorage;

    // 3) runtime
    const fromRuntime = getRuntimeToken();
    if (fromRuntime) return fromRuntime;

    // 4) fallback из app-kit (если он у тебя уже используется где-то ещё)
    try {
        return getAuthTokenFromStorage();
    } catch {
        return null;
    }
}

export function setAuthToken(token: string, remember: boolean) {
    setRuntimeToken(token);

    const payload = JSON.stringify({ token });

    const ls = safeGetStorage("local");
    const ss = safeGetStorage("session");

    try {
        if (remember) {
            ls?.setItem(AUTH_STORAGE_KEY, payload);
            ss?.removeItem(AUTH_STORAGE_KEY);
        } else {
            ss?.setItem(AUTH_STORAGE_KEY, payload);
            ls?.removeItem(AUTH_STORAGE_KEY);
        }
    } catch {}

    emitAuthChanged();
}

export function clearAuthToken() {
    setRuntimeToken(null);

    const ls = safeGetStorage("local");
    const ss = safeGetStorage("session");

    try {
        ls?.removeItem(AUTH_STORAGE_KEY);
        ss?.removeItem(AUTH_STORAGE_KEY);
    } catch {}

    emitAuthChanged();
}

export function subscribeAuthToken(cb: () => void) {
    const onStorage = (e: StorageEvent) => {
        if (e.key !== AUTH_STORAGE_KEY) return;
        cb();
    };

    const onCustom = () => cb();

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_EVENT, onCustom);

    return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(AUTH_EVENT, onCustom);
    };
}

export function buildHeaders(opts?: {
    accept?: string;
    contentType?: string;
    token?: string | null;
}) {
    const h = new Headers();
    if (opts?.accept) h.set("Accept", opts.accept);
    if (opts?.contentType) h.set("Content-Type", opts.contentType);

    const token = opts?.token ?? getAuthToken();
    if (token) h.set("Authorization", `Bearer ${token}`);

    return h;
}
