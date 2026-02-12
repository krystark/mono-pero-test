// hooks/useScrollToTopOnRouteChange.ts
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type Options = {
    /** 'smooth' или 'auto' */
    behavior?: ScrollBehavior;
    /** Если скролл не у window, а у контейнера (например, #app-root) */
    containerSelector?: string;
    /** временно отключать */
    disabled?: boolean;
    /** Не скроллить при смене hash (#anchor) внутри страницы */
    skipHashChange?: boolean;
};

export function useScrollToTopOnRouteChange({
                                                behavior = "smooth",
                                                containerSelector,
                                                disabled = false,
                                                skipHashChange = true,
                                            }: Options = {}) {
    const { pathname, search, hash } = useLocation();

    useEffect(() => {
        if (disabled) return;

        // если перешли только на якорь — можно не дергать скролл
        if (skipHashChange && hash) return;

        // отключаем нативный scrollRestoration, чтобы не боролся с нами
        if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }

        const target: Window | HTMLElement | null =
            (containerSelector &&
                (document.querySelector(containerSelector) as HTMLElement | null)) ||
            window;

        if (!target) return;

        if ("scrollTo" in target) {
            (target as Window).scrollTo({ top: 0, left: 0, behavior });
        } else {
            (target as HTMLElement).scrollTop = 0;
        }
    }, [pathname, search, hash, behavior, containerSelector, disabled, skipHashChange]);
}
