import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStore } from "@krystark/app-kernel";
import type { User } from "@krystark/app-contracts";
import { safeStorage, USER_STORAGE_KEY, getJSON, useBxQuery, getBxBaseUrl } from "@krystark/app-common";
import { applyUserRoutesAccess } from "../adapters/applyUserRoutesAccess";

type BootstrapResult = {
    token: string | null;
    user: User | null;
    isChecking: boolean;
    checkFinished: boolean;
    isAuthorized: boolean;
    errorCode?: number;
};

type BxUser = Record<string, any> & { routes?: string[] | null; groups?: number[] | null; is_admin?: boolean };

function readTokenFromStorage(): string | null {
    try {
        const raw = safeStorage.get(USER_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed?.token ?? null;
    } catch {
        return null;
    }
}

function stripTokenFromUrl(param = "token") {
    const url = new URL(window.location.href);

    if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
    }

    if (url.hash) {
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
        if (hashParams.has(param)) {
            hashParams.delete(param);
            url.hash = hashParams.toString() ? `#${hashParams.toString()}` : "";
        }
    }

    window.history.replaceState(null, "", url.toString());
}

function asNumArray(v: any): number[] {
    if (!Array.isArray(v)) return [];
    return v.map((x) => Number(x)).filter((n) => Number.isFinite(n));
}

export function useBootstrapAuth(): BootstrapResult {
    const store = getStore();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [token, setToken] = useState<string | null>(null);

    // === 0) извлекаем/фиксируем токен
    useEffect(() => {
        let fromUrl = searchParams.get("token");

        if (!fromUrl && location.hash) {
            const hp = new URLSearchParams(location.hash.replace(/^#/, ""));
            fromUrl = hp.get("token") ?? null;
        }

        if (fromUrl) {
            safeStorage.set(USER_STORAGE_KEY, JSON.stringify({ token: fromUrl }));
            setToken(fromUrl);
            stripTokenFromUrl("token");
            return;
        }

        const fromStorage = readTokenFromStorage();
        if (fromStorage) {
            setToken(fromStorage);
            return;
        }

        if (import.meta.env.DEV && import.meta.env.VITE_TEST_USER_AUTH_TOKEN) {
            const fromDev = String(import.meta.env.VITE_TEST_USER_AUTH_TOKEN);
            safeStorage.set(USER_STORAGE_KEY, JSON.stringify({ token: fromDev }));
            setToken(fromDev);
            return;
        }

        setToken(null);
    }, [searchParams, location.hash]);

    const shouldCheckPortal = !!token;
    const baseUrl = import.meta.env.VITE_API_URL as string;

    // === 1) портал: проверка по токену
    const {
        data: portalUser,
        error: portalError,
        isFetching: isPortalFetching,
        isFetched: isPortalFetched,
    } = useQuery<User>({
        queryKey: ["user", token],
        enabled: shouldCheckPortal,
        retry: false,
        queryFn: () => getJSON<User>("user", { token, baseUrl }),
    });

    // === 2) bitrix LEGACY: отключаем в локальной dev, либо по явному флагу
    const isDev = import.meta.env.DEV === true;
    const skipBxByEnv =
        String(import.meta.env.VITE_SKIP_BX_AUTH ?? "").toLowerCase() === "true" ||
        String(import.meta.env.VITE_SKIP_BX_AUTH ?? "").toLowerCase() === "1";

    const bxBaseExists = Boolean(getBxBaseUrl());
    const bxCheckEnabled = bxBaseExists && !isDev && !skipBxByEnv;

    const {
        data: bxResp,
        error: bxError,
        isFetching: isBxFetching,
        isFetched: isBxFetched,
    } = useBxQuery<BxUser>(["auth"], "/portal/auth/", { enabled: bxCheckEnabled, retry: false } as any);

    // === 2.1) сопоставление Bitrix ID
    const portalBitrixId = (portalUser as any)?.bitrix_id as string | number | undefined;
    const bxUserId = (bxResp?.data as any)?.ID ?? (bxResp?.data as any)?.id ?? undefined;

    const bxIdMatchesPortal =
        !bxCheckEnabled || !portalBitrixId || bxUserId == null ? true : String(portalBitrixId) === String(bxUserId);

    const portalOk = Boolean((portalUser as any)?.id);

    const bxOk = !bxCheckEnabled ? true : bxResp?.status?.code === 200 && !!bxResp?.data && bxIdMatchesPortal;

    const bxRoutes =
        bxOk && bxCheckEnabled
            ? Array.isArray((bxResp?.data as any)?.routes)
                ? (((bxResp!.data as any).routes ?? []) as string[])
                : []
            : [];

    const bxGroups = bxOk && bxCheckEnabled ? asNumArray((bxResp?.data as any)?.groups) : [];
    const bxIsAdmin =
        bxOk && bxCheckEnabled
            ? Boolean((bxResp?.data as any)?.is_admin || (bxResp?.data as any)?.isAdmin) || bxGroups.includes(1)
            : false;

    // === 3) сайд-эффект: кладём в стор
    useEffect(() => {
        if (!shouldCheckPortal) {
            store?.user?.setData?.(null as any);
            return;
        }

        if (portalOk) {
            const patch: any = { ...(portalUser as any), token: token ?? undefined };

            patch.bitrix = bxCheckEnabled ? (bxOk ? bxResp!.data! : null) : null;

            // routes: теперь НИЧЕГО не значит "пустой => админ"
            patch.routes = bxCheckEnabled && bxOk ? bxRoutes : [];

            // прокидываем признаки админа/группы в общий user, чтобы UI умел определять админа
            if (bxCheckEnabled && bxOk) {
                if (Array.isArray((bxResp?.data as any)?.groups)) patch.groups = (bxResp?.data as any)?.groups;
                if ((bxResp?.data as any)?.is_admin !== undefined) patch.is_admin = (bxResp?.data as any)?.is_admin;
                if ((bxResp?.data as any)?.isAdmin !== undefined) patch.isAdmin = (bxResp?.data as any)?.isAdmin;
            }

            store?.user?.setData?.(patch);
        } else if (isPortalFetched) {
            store?.user?.setData?.(null as any);
        }
    }, [
        shouldCheckPortal,
        portalOk,
        portalUser,
        token,
        bxCheckEnabled,
        bxOk,
        bxResp,
        bxRoutes,
        isPortalFetched,
        store,
    ]);

    // === 4) агрегированное состояние гейта
    const isChecking = (shouldCheckPortal && isPortalFetching) || (bxCheckEnabled && isBxFetching);
    const checkFinished = (!shouldCheckPortal || isPortalFetched) && (!bxCheckEnabled || isBxFetched);
    const isAuthorized = portalOk && bxOk;

    const portalErrCode = portalOk ? undefined : ((portalError as any)?.status ?? (portalError as any)?.code);

    const bxErrCode =
        !bxCheckEnabled || bxOk
            ? undefined
            : (bxResp?.status?.code ?? (bxError as any)?.status ?? (bxError as any)?.code);

    const errorCode = isAuthorized ? undefined : (portalErrCode ?? bxErrCode);

    // === 5) применяем allowlist (только PROD + только когда Bitrix включён и гейт прошёл)
    useEffect(() => {
        if (!bxCheckEnabled) return;
        if (!isAuthorized) return;
        if (import.meta.env.DEV) return;

        applyUserRoutesAccess(bxRoutes, { isAdmin: bxIsAdmin });
    }, [bxCheckEnabled, isAuthorized, bxRoutes, bxIsAdmin]);

    return useMemo(
        () => ({
            token: token ?? null,
            user: isAuthorized
                ? ({ ...(portalUser as any), token: token ?? undefined, routes: bxRoutes } as User)
                : null,
            isChecking,
            checkFinished,
            isAuthorized,
            errorCode: errorCode as number | undefined,
        }),
        [token, portalUser, isAuthorized, isChecking, checkFinished, errorCode, bxRoutes]
    );
}
