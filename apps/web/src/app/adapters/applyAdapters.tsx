// app/adapters/applyAdapters.tsx
import { nav, router } from '@krystark/app-kernel';
import type {
    AppAdaptersConfig,
    NavTab,
    NavPatch,
    NavTabPatch,
    RoutePatch,
} from '@krystark/app-contracts';

/* ========== NAV PATCH ========== */
function applyNavPatch(p: NavPatch) {
    const item = nav.findOne({ id: p.id });

    if (!item) {
        console.warn('[Adapters] nav patch skipped, id not found:', p.id);
        return;
    }

    // мягкое удаление → скрываем
    if ((p as any).remove) {
        (item as any).hidden = true;
    }

    // простые поля
    if (p.title !== undefined) item.title = p.title;
    if (p.url !== undefined) item.url = p.url;
    if (p.order !== undefined) item.order = p.order;
    if ((p as any).parent !== undefined) (item as any).parent = (p as any).parent;

    // флаги окружения
    if ((p as any).devOnly !== undefined) (item as any).devOnly = (p as any).devOnly;
    if ((p as any).hidden !== undefined) (item as any).hidden = (p as any).hidden;
    if ((p as any).visibleIn !== undefined) (item as any).visibleIn = (p as any).visibleIn;

    // НОВАЯ модель прав
    if (p.permissions !== undefined) {
        (item as any).permissions = p.permissions;
    }

    // ЛЕГАСИ-модель прав (Bitrix)
    const navLegacy =
        (p as any).permissions_legacy ??
        (p as any).permission_legacy; // на всякий случай поддерживаем старое имя

    if (navLegacy !== undefined) {
        (item as any).permissions_legacy = navLegacy;
    }

    // вкладки
    if (Array.isArray(p.tabs) && p.tabs.length) {
        const baseTabs: NavTab[] = Array.isArray(item.tabs) ? item.tabs : [];

        for (const t of p.tabs as NavTabPatch[]) {
            const idx = baseTabs.findIndex((bt) => bt.id === t.id);
            if (idx < 0) {
                // eslint-disable-next-line no-console
                console.warn('[Adapters] nav tab patch skipped, tab id not found:', p.id, t.id);
                continue;
            }

            const base = baseTabs[idx]!;
            const tPatch = (t as any).remove ? { ...t, hidden: true } : t;

            if (tPatch.title !== undefined) base.title = tPatch.title!;
            if (tPatch.url !== undefined) base.url = tPatch.url!;
            if (tPatch.order !== undefined) (base as any).order = tPatch.order;

            // флаги окружения для вкладки
            if ((tPatch as any).devOnly !== undefined) (base as any).devOnly = (tPatch as any).devOnly;
            if ((tPatch as any).hidden !== undefined) (base as any).hidden = (tPatch as any).hidden;
            if ((tPatch as any).visibleIn !== undefined) (base as any).visibleIn = (tPatch as any).visibleIn;

            // права на уровне вкладок (если надо)
            if ((tPatch as any).permissions !== undefined) {
                (base as any).permissions = (tPatch as any).permissions;
            }
            const tabLegacy =
                (tPatch as any).permissions_legacy ??
                (tPatch as any).permission_legacy;
            if (tabLegacy !== undefined) {
                (base as any).permissions_legacy = tabLegacy;
            }

            baseTabs[idx] = base;
        }

        // можно отсортировать вкладки по order, если нужно
        (item as any).tabs = baseTabs.sort((a, b) => ((a as any).order ?? 0) - ((b as any).order ?? 0));
    }
}

/* ========== ROUTES PATCH ========== */

function applyRoutePatch(p: RoutePatch) {
    const r = router.findOne({ id: p.id });

    if (!r) {
        // eslint-disable-next-line no-console
        console.warn('[Adapters] route patch skipped, id not found:', p.id);
        return;
    }

    // path/order
    if (p.path !== undefined) r.path = p.path;
    if (p.order !== undefined) r.order = p.order;

    // флаги окружения для роутов (если вдруг пригодятся)
    if ((p as any).devOnly !== undefined) (r as any).devOnly = (p as any).devOnly;
    if ((p as any).hidden !== undefined) (r as any).hidden = (p as any).hidden;

    // НОВАЯ модель прав
    if (p.permissions !== undefined) {
        (r as any).permissions = p.permissions;
    }

    // ЛЕГАСИ-модель
    const routeLegacy =
        (p as any).permissions_legacy ??
        (p as any).permission_legacy;

    if (routeLegacy !== undefined) {
        (r as any).permissions_legacy = routeLegacy;
    }

    // eslint-disable-next-line no-console
    console.log('[Adapters] patched route', p.id, r);
}

/* ========== PUBLIC API ========== */

export function applyNavAdapters(config?: AppAdaptersConfig) {
    const patches = config?.nav ?? [];
    patches.forEach(applyNavPatch);
}

export function applyRouteAdapters(config?: AppAdaptersConfig) {
    const patches = config?.routes ?? [];
    patches.forEach(applyRoutePatch);
}

export function applyAppAdapters(config?: AppAdaptersConfig) {
    applyNavAdapters(config);
    applyRouteAdapters(config);
}
