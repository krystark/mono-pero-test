export type StorageScope = "local" | "session";

export const safeStorage = {
    get(key: string, scope: StorageScope = "local") {
        try {
            if (typeof window === "undefined") return null;
            const s = scope === "session" ? window.sessionStorage : window.localStorage;
            return s.getItem(key);
        } catch {
            return null;
        }
    },

    getAny(key: string) {
        try {
            if (typeof window === "undefined") return null;
            return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
        } catch {
            return null;
        }
    },

    set(key: string, value: string, scope: StorageScope = "local") {
        try {
            if (typeof window === "undefined") return;
            const s = scope === "session" ? window.sessionStorage : window.localStorage;
            s.setItem(key, value);
        } catch {}
    },

    remove(key: string, scope?: StorageScope | "any") {
        try {
            if (typeof window === "undefined") return;

            if (!scope || scope === "any") {
                window.localStorage.removeItem(key);
                window.sessionStorage.removeItem(key);
                return;
            }

            const s = scope === "session" ? window.sessionStorage : window.localStorage;
            s.removeItem(key);
        } catch {}
    },
};
