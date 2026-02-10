// app/shell/RouteLoopGuard.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {Button} from "@krystark/ui-kit-components";
import {getEnv} from "@krystark/app-kernel";

type Props = {
    children: React.ReactNode;
};

/**
 * Возвращает путь до "корня" SPA относительно origin.
 *
 * Примеры:
 * - VITE_PATH_URL не задан → "/"
 * - VITE_PATH_URL="/portal" → "/portal/"
 * - VITE_PATH_URL="/portal/" → "/portal/"
 */
export function getAppRootHref(): string {
    const env = (getEnv?.() ?? (import.meta as any)?.env ?? {}) as Record<string, any>;
    const raw = env.VITE_PATH_URL || '/';

    let base = String(raw).trim();

    // если вдруг пусто — корень
    if (!base) return '/';

    // гарантируем ведущий слэш
    if (!base.startsWith('/')) {
        base = '/' + base;
    }

    // убираем хвостовые слэши и снова добавляем один
    base = base.replace(/\/+$/, '');
    if (!base || base === '/') return '/';

    return base + '/';
}

/**
 * Проверяем, есть ли подряд идущий повтор одного и того же сегмента:
 * /tools/promos/promos/promos
 */
function hasRepeatedSegment(pathname: string, minRepeats = 3): boolean {
    const segments = pathname.split('/').filter(Boolean);
    let last = '';
    let sameCount = 0;

    for (const seg of segments) {
        if (seg === last) {
            sameCount++;
            if (sameCount + 1 >= minRepeats) return true;
        } else {
            last = seg;
            sameCount = 0;
        }
    }

    return false;
}

// глобальный флаг, чтобы не пытаться несколько раз входить в "паник-мод"
let globalPanic = false;

// ограничитель по количеству переходов
const MAX_EVENTS = 15;
const WINDOW_MS = 1000; // за 1 секунду

export const RouteLoopGuard: React.FC<Props> = ({ children }) => {
    const location = useLocation();
    const [panic, setPanic] = useState(false);
    const eventsRef = useRef<{ t: number; path: string }[]>([]);

    useEffect(() => {
        if (globalPanic || panic) return;

        const now = performance.now();
        const path = location.pathname;

        // 1) Странный path — повторяющийся сегмент
        if (hasRepeatedSegment(path)) {
            console.error(
                '[RouteLoopGuard] Detected repeated path segment, switch to safe mode:',
                path,
            );
            globalPanic = true;
            setPanic(true);
            return;
        }

        // 2) Слишком много переходов за короткое время
        eventsRef.current.push({ t: now, path });
        eventsRef.current = eventsRef.current.filter((e) => now - e.t <= WINDOW_MS);

        if (eventsRef.current.length >= MAX_EVENTS) {
            console.error(
                '[RouteLoopGuard] Too many route changes in short time, switch to safe mode:',
                eventsRef.current,
            );
            globalPanic = true;
            setPanic(true);
        }
    }, [location, panic]);

    if (panic) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
                <h1 className="mb-4 text-2xl font-semibold">
                    Что-то пошло не так с маршрутизацией
                </h1>
                <p className="mb-4 max-w-xl text-text-secondary">
                    Обнаружен подозрительный цикл переходов по страницам.
                    Мы временно отключили рендер разделов, чтобы приложение не зависло.
                </p>

                <Button
                    type="button"
                    onClick={() => {
                        globalPanic = false;
                        eventsRef.current = [];
                        setPanic(false);

                        const appRootPath = getAppRootHref();       // "/portal/" или "/"
                        const targetUrl =
                            window.location.origin.replace(/\/+$/, '') + appRootPath;

                        if (window.top && window.top !== window) {
                            window.top.location.href = targetUrl;
                        } else {
                            window.location.href = targetUrl;
                        }
                    }}
                >
                    Вернуться на главную
                </Button>
            </div>
        );
    }

    return <>{children}</>;
};
