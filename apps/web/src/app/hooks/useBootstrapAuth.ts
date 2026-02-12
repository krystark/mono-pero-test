// hooks/useBootstrapAuth.ts
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStore } from "@krystark/app-kernel";

export type DummyUser = {
    id: number;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    image?: string;
    [k: string]: any;
};

type BootstrapResult = {
    token: string | null;
    user: DummyUser | null;
    isChecking: boolean;
    checkFinished: boolean;
    isAuthorized: boolean;
    errorCode?: number;
};

type ApiError = Error & { status?: number; data?: unknown };

const AUTH_STORAGE_KEY = "mono.auth";
const AUTH_EVENT = "mono-auth-changed";
const RUNTIME_TOKEN_KEY = "__monoAuthToken__";

const AUTH_BASE_URL =
    (import.meta.env.VITE_AUTH_API_URL as string) || "https://dummyjson.com";

function joinUrl(base: string, path: string) {
    return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

function safeGetStorage(kind: "local" | "session"): Storage | null {
    try {
        return kind === "local" ? window.localStorage : window.sessionStorage;
    } catch {
        return null;
    }
}

function readRuntimeToken(): string | null {
    try {
        const t = (window as any)[RUNTIME_TOKEN_KEY];
        return typeof t === "string" && t ? t : null;
    } catch {
        return null;
    }
}

function readAuthFromStorage(): { accessToken: string | null; refreshToken: string | null } {
    const read = (s: Storage | null) => {
        if (!s) return null;
        try {
            const raw = s.getItem(AUTH_STORAGE_KEY);
            if (!raw) return null;

            // поддержим и "просто строка токена", и JSON
            if (!raw.trim().startsWith("{")) {
                return { accessToken: raw, refreshToken: null };
            }

            const parsed = JSON.parse(raw) as any;
            return {
                accessToken: parsed?.accessToken ?? parsed?.token ?? null,
                refreshToken: parsed?.refreshToken ?? null,
            };
        } catch {
            return null;
        }
    };

    // приоритет: runtime → local → session
    const rt = readRuntimeToken();
    if (rt) return { accessToken: rt, refreshToken: null };

    return (
        read(safeGetStorage("local")) ??
        read(safeGetStorage("session")) ?? { accessToken: null, refreshToken: null }
    );
}

function writeAuthToStorage(accessToken: string, refreshToken: string | null) {
    // runtime
    try {
        (window as any)[RUNTIME_TOKEN_KEY] = accessToken;
    } catch {}

    const payload = JSON.stringify({ accessToken, refreshToken });

    // пишем туда, где уже лежало, иначе — в session
    const ls = safeGetStorage("local");
    const ss = safeGetStorage("session");

    const hasLocal = !!ls?.getItem(AUTH_STORAGE_KEY);
    const hasSession = !!ss?.getItem(AUTH_STORAGE_KEY);

    try {
        if (hasLocal) ls?.setItem(AUTH_STORAGE_KEY, payload);
        else if (hasSession) ss?.setItem(AUTH_STORAGE_KEY, payload);
        else ss?.setItem(AUTH_STORAGE_KEY, payload);
    } catch {}

    window.dispatchEvent(new Event(AUTH_EVENT));
}

function clearAuthStorage() {
    try {
        safeGetStorage("local")?.removeItem(AUTH_STORAGE_KEY);
        safeGetStorage("session")?.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    try {
        (window as any)[RUNTIME_TOKEN_KEY] = null;
    } catch {}
    window.dispatchEvent(new Event(AUTH_EVENT));
}

async function fetchMe(accessToken: string): Promise<DummyUser> {
    const res = await fetch(joinUrl(AUTH_BASE_URL, "auth/me"), {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        // credentials тут НЕ нужны для Bearer; оставим выключенным чтобы не ловить ограничения cookies
    });

    const ct = res.headers.get("content-type") || "";
    const data = /\bjson\b/i.test(ct) ? await res.json() : await res.text();

    if (!res.ok) {
        const err: ApiError = new Error("Auth error");
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data as DummyUser;
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const res = await fetch(joinUrl(AUTH_BASE_URL, "auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refreshToken, expiresInMins: 30 }),
    });

    const ct = res.headers.get("content-type") || "";
    const data = /\bjson\b/i.test(ct) ? await res.json() : await res.text();

    if (!res.ok) {
        const err: ApiError = new Error("Refresh error");
        err.status = res.status;
        err.data = data;
        throw err;
    }

    const json = data as any;
    const accessToken = json?.accessToken ?? null;
    if (!accessToken) throw new Error("No accessToken in refresh response");
    return { accessToken, refreshToken: json?.refreshToken };
}

export function useBootstrapAuth(): BootstrapResult {
    const [{ accessToken, refreshToken }, setAuth] = useState(() => readAuthFromStorage());

    useEffect(() => {
        const sync = () => setAuth(readAuthFromStorage());

        const onStorage = (e: StorageEvent) => {
            if (e.key !== AUTH_STORAGE_KEY) return;
            sync();
        };

        window.addEventListener("storage", onStorage);
        window.addEventListener(AUTH_EVENT, sync);

        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener(AUTH_EVENT, sync);
        };
    }, []);

    const shouldCheck = !!accessToken;

    const {
        data: user,
        error,
        isFetching,
        isFetched,
    } = useQuery<DummyUser, ApiError>({
        queryKey: ["auth-me", accessToken],
        enabled: shouldCheck,
        retry: false,
        queryFn: async () => {
            try {
                return await fetchMe(accessToken!);
            } catch (e: any) {
                const status = e?.status;

                if (status === 404) {
                    clearAuthStorage();
                    throw e;
                }

                if ((status === 401 || status === 403) && refreshToken) {
                    const next = await refreshAccessToken(refreshToken);
                    writeAuthToStorage(next.accessToken, next.refreshToken ?? refreshToken);
                    return await fetchMe(next.accessToken);
                }

                throw e;
            }
        },
    });

    useEffect(() => {
        if (!user?.id || !accessToken) return;

        try {
            const store = getStore() as any;
            // если у тебя есть setAuth — отлично
            if (typeof store?.user?.setAuth === "function") {
                store.user.setAuth(accessToken, {
                    id: user.id,
                    email: user.email,
                    name: user.firstName,
                    last_name: user.lastName,
                    token: accessToken,
                });
            } else if (typeof store?.user?.setData === "function") {
                store.user.setData({
                    id: user.id,
                    email: user.email,
                    name: user.firstName,
                    last_name: user.lastName,
                    token: accessToken,
                });
            }
        } catch {}
    }, [user, accessToken]);

    useEffect(() => {
        const code = error?.status;
        if (code === 401 || code === 403) {
            clearAuthStorage();
        }
    }, [error]);

    const isAuthorized = !!user?.id;
    const isChecking = shouldCheck ? isFetching : false;
    const checkFinished = !shouldCheck || isFetched;
    const errorCode = !isAuthorized ? (error?.status ?? undefined) : undefined;

    return useMemo(
        () => ({
            token: accessToken,
            user: isAuthorized ? (user ?? null) : null,
            isChecking,
            checkFinished,
            isAuthorized,
            errorCode,
        }),
        [accessToken, user, isAuthorized, isChecking, checkFinished, errorCode]
    );
}
