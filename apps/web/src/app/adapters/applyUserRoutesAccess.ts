import { nav, router } from "@krystark/app-kernel";

type AnyObj = Record<string, any>;

function getAll(store: any): AnyObj[] {
    const a = store?.find?.({}) ?? store?.items ?? store?.data ?? store?.list ?? store?.all ?? [];
    return Array.isArray(a) ? a : [];
}

function getBaseHidden(o: AnyObj): boolean {
    if (o.__accessBaseHidden === undefined) {
        o.__accessBaseHidden = Boolean(o.hidden);
    }
    return Boolean(o.__accessBaseHidden);
}

function normalizeIds(input: any): string[] {
    if (!Array.isArray(input)) return [];
    return input.map((x) => String(x ?? "").trim()).filter(Boolean);
}

const HOME_IDS = new Set(["home", "main", "root", "index", "portal-home", "portal_home"]);
const ADMIN_ROOT_IDS = new Set(["admin", "tools"]);

function normStr(v: any): string {
    return String(v ?? "").trim();
}

function isHomeObj(o: AnyObj): boolean {
    const id = normStr(o?.id);
    const url = normStr(o?.url || o?.path);
    if (HOME_IDS.has(id)) return true;
    if (url === "/" || url === "") return true;
    return false;
}

function isAdminAreaObj(o: AnyObj): boolean {
    const id = normStr(o?.id);
    if (ADMIN_ROOT_IDS.has(id)) return true;
    if (id.startsWith("admin")) return true;

    const url = normStr(o?.url || o?.path);
    if (url.startsWith("/admin")) return true;
    if (url.startsWith("/tools")) return true;

    const parent = normStr(o?.parent);
    if (ADMIN_ROOT_IDS.has(parent)) return true;

    return false;
}

/**
 * PROD:
 * - Главная доступна всем всегда
 * - Админка доступна только админам (groups.includes(1) / is_admin)
 * - Остальные разделы: строго по allowlist routes (плюс родитель, если разрешён tab)
 * - devOnly всегда скрываем в PROD
 *
 * DEV:
 * - полностью игнорируем routes (ничего не патчим)
 */
export function applyUserRoutesAccess(
    allowedIds?: string[] | null,
    opts?: { isAdmin?: boolean }
) {
    const isDev = import.meta.env.DEV;
    if (isDev) return;

    const list = normalizeIds(allowedIds);
    const allowSet = new Set(list);

    const isAdmin = Boolean(opts?.isAdmin);

    const navItems = getAll(nav);

    // если разрешён хотя бы один tab — автоматически разрешаем его родителя (nav.id)
    const parentAllowedByTabs = new Set<string>();
    for (const item of navItems) {
        const parentId = normStr(item?.id);
        if (!parentId) continue;

        // админский модуль никогда не открываем не-админам
        if (!isAdmin && isAdminAreaObj(item)) continue;

        const tabs: AnyObj[] = Array.isArray(item?.tabs) ? item.tabs : [];
        for (const t of tabs) {
            const tabId = normStr(t?.id);
            if (tabId && allowSet.has(tabId)) {
                parentAllowedByTabs.add(parentId);
                break;
            }
        }
    }

    const routeAllowSet = new Set<string>([...allowSet, ...parentAllowedByTabs]);

    // NAV + TABS
    for (const item of navItems) {
        const id = normStr(item?.id);
        if (!id) continue;

        const baseHidden = getBaseHidden(item);
        const devOnlyHidden = Boolean(item?.devOnly); // в PROD всегда скрываем devOnly

        const home = isHomeObj(item);
        const adminArea = isAdminAreaObj(item);

        const allowed =
            home ||
            (adminArea ? isAdmin : isAdmin || allowSet.has(id) || parentAllowedByTabs.has(id));

        item.hidden = baseHidden || devOnlyHidden || !allowed;

        const tabs: AnyObj[] = Array.isArray(item?.tabs) ? item.tabs : [];
        if (tabs.length) {
            const parentAllowsAllTabs = isAdmin || allowSet.has(id);

            for (const t of tabs) {
                const tabId = normStr(t?.id);
                const tabBaseHidden = getBaseHidden(t);
                const tabDevOnlyHidden = Boolean(t?.devOnly);

                // если родитель — админка, табы тоже только админам
                const tabAdminArea = adminArea || isAdminAreaObj(t);

                const tabAllowed =
                    (home ? true : false) ||
                    (tabAdminArea ? isAdmin : parentAllowsAllTabs || allowSet.has(tabId));

                t.hidden = tabBaseHidden || tabDevOnlyHidden || !tabAllowed;
            }
        }
    }

    // ROUTES
    const routeItems = getAll(router);
    for (const r of routeItems) {
        const id = normStr(r?.id);
        if (!id) continue;

        const baseHidden = getBaseHidden(r);
        const devOnlyHidden = Boolean(r?.devOnly);

        const home = isHomeObj(r);
        const adminArea = isAdminAreaObj(r);

        const allowed =
            home || (adminArea ? isAdmin : isAdmin || routeAllowSet.has(id));

        r.hidden = baseHidden || devOnlyHidden || !allowed;
    }
}
