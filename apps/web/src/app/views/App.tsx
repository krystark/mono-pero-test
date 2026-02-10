// app/App.tsx
import React, { Suspense, useMemo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { observer } from 'mobx-react-lite';
import {
    router,
    nav,
    isRouteAccessible,
    isNavTabAccessible,
} from '@krystark/app-kernel';

import type { RouteItem, NavItem, NavTab } from '@krystark/app-contracts';

import AppShell from '../shell/AppShell';
import AppHeader from '../shell/AppHeader';
import AppSidebar from '../shell/AppSidebar';
import ModuleViewport from '../shell/ModuleViewport';
import AppLoader from '../shell/AppLoader';
import AuthGate from '../shell/AuthGate';

import { useBootstrapAuth } from '../hooks/useBootstrapAuth';
import { useGateLoader } from '../hooks/useGateLoader';
import { normalizeMenuForSidebar } from '../shell/menuAdapter';

dayjs.locale('ru');

/* ===== Fallback-страницы ===== */

const ForbiddenPage: React.FC = () => (
    <div className="p-8 text-center">
        <h1 className="mb-4 text-2xl font-semibold">Доступ запрещён</h1>
        <p className="text-text-secondary">
            У вас нет прав для просмотра этого раздела (403).
        </p>
    </div>
);

const NotFoundPage: React.FC = () => (
    <div className="p-8 text-center">
        <h1 className="mb-4 text-2xl font-semibold">Страница не найдена</h1>
        <p className="text-text-secondary">
            Проверьте адрес или вернитесь на главную страницу.
        </p>
    </div>
);

/**
 * Центральный гард для каждого верхнеуровневого RouteItem:
 * - проверяет права на сам роут (isRouteAccessible)
 * - если у нав-элемента есть tabs, пытается найти активный таб по pathname
 *   и проверяет права через isNavTabAccessible
 */
const RouteGuard: React.FC<{ route: RouteItem; children: React.ReactNode }> = ({ route, children }) => {
    const { pathname } = useLocation();

    // 1) Проверка прав на сам роут (routes-патчи)
    if (!isRouteAccessible(route)) {
        return <ForbiddenPage />;
    }

    // 2) Доп. проверка прав на вкладку модуля по nav.tabs (AppConfigNav.nav)
    const item: NavItem | undefined = nav.findOne({ id: route.id });

    if (item && Array.isArray(item.tabs) && item.tabs.length > 0) {
        const tabs = item.tabs as NavTab[];

        const activeTab = tabs.find((t) => {
            if (!t.url) return false;
            return pathname.endsWith(t.url);
        });

        if (activeTab && !isNavTabAccessible(activeTab as any)) {
            return <ForbiddenPage />;
        }
    }

    return <>{children}</>;
};

/**
 * Fallback-роут:
 *  - если resolvePath нашёл роут, но isRouteAccessible === false → 403
 *  - если роут не найден вообще → 404
 *  (для случаев, когда ни один верхнеуровневый path не сматчился)
 */
const AppFallbackRoute: React.FC = () => {
    const { pathname } = useLocation();

    const baseRouter: any = router as any;
    const route: RouteItem | undefined =
        typeof baseRouter.resolvePath === 'function'
            ? baseRouter.resolvePath(pathname)
            : undefined;

    if (route && !isRouteAccessible(route)) {
        return <ForbiddenPage />;
    }

    return <NotFoundPage />;
};

export default observer(function App() {
    const routes = router.find({});
    const navItems = nav.find({}, { orderBy: 'order' });

    const sidebarMenu = useMemo(() => normalizeMenuForSidebar(navItems), [navItems]);

    const { isAuthorized, checkFinished } = useBootstrapAuth();
    const { phase, visible, markDone } = useGateLoader(checkFinished);

    return (
        <>
            {isAuthorized ? (
                <AppShell
                    header={<AppHeader menu={navItems as any} />}
                    sidebar={<AppSidebar menu={sidebarMenu} />}
                >
                    <ModuleViewport>
                        <Routes>
                            {routes.map((r) => (
                                <Route
                                    key={r.id}
                                    path={r.path}
                                    element={
                                        <RouteGuard route={r}>
                                            <r.Element />
                                        </RouteGuard>
                                    }
                                />
                            ))}

                            <Route path="*" element={<AppFallbackRoute />} />
                        </Routes>
                    </ModuleViewport>
                </AppShell>
            ) : (
                <AuthGate />
            )}

            {visible && <AppLoader phase={phase} onDone={markDone} />}
        </>
    );
});
