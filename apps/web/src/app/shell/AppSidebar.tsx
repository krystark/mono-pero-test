import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { MenuItem } from "../../types/nav";
import { UserShort, Avatar, Switch, TabsSwitches, Tab, Input, Button } from "@krystark/ui-kit-components";
import {
    DoubleLeftIcon,
    HomeIcon,
    BurgerMenuIcon,
    RightArrowIcon,
    CloseIcon,
    SquareIcon,
    NotificationIcon,
    SunIcon,
    MoonIcon,
    OfficeIcon,
} from "@krystark/ui-kit-icons";
import { getStore } from "@krystark/app-kernel";

import { getStoredTheme, getSystemTheme, setTheme, type Theme } from "../functions/theme";

type Props = {
    menu: MenuItem[];
    activeId?: string;
    activeTabId?: string;
    mobileOpen?: boolean;
    onMobileOpenChange?: (open: boolean) => void;
    defaultCollapsed?: boolean;
    className?: string;
    homeUrl?: string;
};

type IconProps = { className?: string };
type IconLike = React.ComponentType<IconProps> | React.ReactElement<IconProps> | null | undefined;

function IconRenderer({
                          icon,
                          className,
                          fallback: Fallback = HomeIcon,
                      }: {
    icon: IconLike;
    className?: string;
    fallback?: React.ComponentType<IconProps>;
}) {
    if (icon && React.isValidElement(icon)) {
        return React.cloneElement(icon as React.ReactElement<IconProps>, {
            className: [icon.props.className, className].filter(Boolean).join(" "),
        });
    }
    const Cmp = (icon as React.ComponentType<IconProps>) || Fallback;
    return <Cmp className={className} />;
}

/* ===== helpers ===== */
const norm = (s: string) => s.toLowerCase();
const includes = (s: string, q: string) => norm(s).includes(norm(q));

function asStrArray(v: any): string[] {
    if (!Array.isArray(v)) return [];
    return v.map((x) => String(x ?? "").trim()).filter(Boolean);
}
function asNumArray(v: any): number[] {
    if (!Array.isArray(v)) return [];
    return v.map((x) => Number(x)).filter((n) => Number.isFinite(n));
}

/* ===== mobile hooks (как было) ===== */
function useBodyScrollLock(isOpen: boolean) {
    useEffect(() => {
        if (!isOpen) return;
        const { scrollY } = window;
        const body = document.body;
        const prev = {
            position: body.style.position,
            top: body.style.top,
            left: body.style.left,
            right: body.style.right,
            width: body.style.width,
            overflowY: body.style.overflowY,
        };
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.left = "0";
        body.style.right = "0";
        body.style.width = "100%";
        body.style.overflowY = "hidden";
        return () => {
            Object.assign(body.style, prev);
            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);
}
function useCloseOnRouteChange(isOpen: boolean, close: () => void) {
    const loc = useLocation();
    const prevPath = useRef(loc.pathname + loc.search + loc.hash);
    useEffect(() => {
        const current = loc.pathname + loc.search + loc.hash;
        if (isOpen && current !== prevPath.current) close();
        prevPath.current = current;
    }, [loc, isOpen, close]);
}
function useEscClose(isOpen: boolean, close: () => void) {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, close]);
}
function useSwipeToClose(isOpen: boolean, close: () => void) {
    const sheetRef = useRef<HTMLDivElement | null>(null);

    const startX = useRef<number | null>(null);
    const startY = useRef<number | null>(null);

    const dy = useRef(0);
    const dx = useRef(0);

    const dragging = useRef(false);
    const activeScroller = useRef<HTMLElement | null>(null);

    const suppressClick = useRef(false);

    const threshold = 80;
    const maxDrag = 260;
    const dragStartSlop = 6;

    useEffect(() => {
        const root = sheetRef.current;
        if (!root) return;

        const clearInline = () => {
            root.style.transform = "";
            root.style.transition = "";
        };

        const findScrollable = (target: EventTarget | null): HTMLElement | null => {
            let el = target as HTMLElement | null;
            while (el && el !== root) {
                if (el instanceof HTMLElement) {
                    const st = window.getComputedStyle(el);
                    const oy = st.overflowY;
                    const canScroll = (oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1;
                    if (canScroll) return el;
                }
                el = el?.parentElement ?? null;
            }
            return null;
        };

        const resetGesture = () => {
            startX.current = null;
            startY.current = null;
            dx.current = 0;
            dy.current = 0;
            dragging.current = false;
            activeScroller.current = null;
        };

        const onStart = (e: TouchEvent) => {
            if (!isOpen) return;
            if (e.touches.length !== 1) return;

            const t = e.touches[0];
            startX.current = t.clientX;
            startY.current = t.clientY;
            dx.current = 0;
            dy.current = 0;
            dragging.current = false;

            activeScroller.current = findScrollable(e.target);

            // клик подавляем только если реально был drag
            suppressClick.current = false;
        };

        const onMove = (e: TouchEvent) => {
            if (!isOpen) return;
            if (startY.current == null || startX.current == null) return;
            if (e.touches.length !== 1) return;

            const t = e.touches[0];
            const rawDx = t.clientX - startX.current;
            const rawDy = t.clientY - startY.current;

            dx.current = rawDx;
            dy.current = rawDy;

            // вверх — не наш жест
            if (rawDy <= 0) return;

            // пока не решили, что это drag — даём странице/скроллу жить
            if (!dragging.current) {
                // мелкая дрожь игнор
                if (Math.abs(rawDy) < dragStartSlop) return;

                // если жест больше горизонтальный — не закрываем
                if (Math.abs(rawDy) < Math.abs(rawDx)) return;

                // если под пальцем есть скролл и он НЕ вверху — это скролл, а не закрытие
                const sc = activeScroller.current;
                if (sc && sc.scrollTop > 0) return;

                // ок, включаем drag шторки
                dragging.current = true;
                root.style.transition = "none";
                suppressClick.current = true;
            }

            if (!dragging.current) return;

            // важно: блокируем дефолт (pull-to-refresh / overscroll)
            e.preventDefault();

            const d = Math.max(0, Math.min(maxDrag, rawDy));
            root.style.transform = `translateY(${d}px)`;
        };

        const onEnd = () => {
            if (!isOpen) return;

            if (!dragging.current) {
                resetGesture();
                return;
            }

            dragging.current = false;

            const currentDy = Math.max(0, dy.current);
            const shouldClose = currentDy > threshold;

            root.style.transition = "";
            root.style.transform = shouldClose ? "translateY(100%)" : "translateY(0)";

            root.addEventListener(
                "transitionend",
                () => {
                    clearInline();
                    if (shouldClose) close();
                },
                { once: true }
            );

            resetGesture();
        };

        const onClickCapture = (e: MouseEvent) => {
            if (!suppressClick.current) return;
            // один клик глушим — чтобы свайп не “нажал” пункт меню
            suppressClick.current = false;
            e.preventDefault();
            e.stopPropagation();
        };

        root.addEventListener("touchstart", onStart, { passive: true });
        // НЕ passive — иначе preventDefault не сработает
        root.addEventListener("touchmove", onMove, { passive: false });
        root.addEventListener("touchend", onEnd);
        root.addEventListener("touchcancel", onEnd);

        // глушим клики после drag
        root.addEventListener("click", onClickCapture, true);

        return () => {
            root.removeEventListener("touchstart", onStart);
            root.removeEventListener("touchmove", onMove as any);
            root.removeEventListener("touchend", onEnd);
            root.removeEventListener("touchcancel", onEnd);
            root.removeEventListener("click", onClickCapture, true);
        };
    }, [isOpen, close]);

    useEffect(() => {
        if (isOpen && sheetRef.current) {
            sheetRef.current.style.transform = "";
            sheetRef.current.style.transition = "";
        }
    }, [isOpen]);

    return sheetRef;
}

/* ===== мини-компоненты для низа ===== */

const NotificationsBtn: React.FC<{ count?: number; onClick?: () => void; title?: string }> = ({
                                                                                                  count = 0,
                                                                                                  onClick,
                                                                                                  title = "Уведомления",
                                                                                              }) => {
    const c = Math.max(0, count);
    return (
        <Button type="button" variant="secondary" onClick={onClick} aria-label={title} title={title} mode="icon">
            <NotificationIcon className={c > 0 ? "text-pink" : ""} />
        </Button>
    );
};

const ThemeTabs: React.FC = () => {
    const initial: Theme = React.useMemo(() => {
        const stored = getStoredTheme();
        if (stored) return stored;

        if (typeof document !== "undefined") {
            if (document.documentElement.classList.contains("dark")) return "dark";
            if (document.documentElement.classList.contains("light")) return "light";
        }
        return typeof window !== "undefined" ? getSystemTheme() : ("light" as Theme);
    }, []);

    const [value, setValue] = React.useState<Theme>(initial);

    React.useEffect(() => {
        setTheme(value);
    }, [value]);

    const pick = (t: Theme) => () => setValue(t);
    const pickKey = (t: Theme) => (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setValue(t);
        }
    };

    return (
        <TabsSwitches>
      <span
          role="button"
          tabIndex={0}
          onClick={pick("light")}
          onKeyDown={pickKey("light")}
          className="inline-flex"
          aria-label="Светлая тема"
          title="Светлая тема"
      >
        <Tab size="s" variant="filled" value="light" currentValue={value}>
          <SunIcon size="sm" className={value === "light" ? "text-yellow" : ""} />
        </Tab>
      </span>

            <span
                role="button"
                tabIndex={0}
                onClick={pick("dark")}
                onKeyDown={pickKey("dark")}
                className="inline-flex"
                aria-label="Тёмная тема"
                title="Тёмная тема"
            >
        <Tab size="s" variant="filled" value="dark" currentValue={value}>
          <MoonIcon size="sm" className={value === "dark" ? "text-darkBlue" : ""} />
        </Tab>
      </span>
        </TabsSwitches>
    );
};

export default function AppSidebar({
                                       menu,
                                       activeId,
                                       activeTabId,
                                       mobileOpen,
                                       onMobileOpenChange,
                                       defaultCollapsed = false,
                                       className = "",
                                       homeUrl = "/",
                                   }: Props) {
    const store = getStore();
    const location = useLocation();

    const [mobileInnerOpen, setMobileInnerOpen] = useState(false);
    const isMobileOpen = mobileOpen ?? mobileInnerOpen;
    const setMobileOpen = onMobileOpenChange ?? setMobileInnerOpen;

    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const [query, setQuery] = useState("");

    const handleQueryChange = useCallback((eOrValue: any) => {
        const v =
            typeof eOrValue === "string" ? eOrValue : eOrValue?.target?.value ?? eOrValue?.currentTarget?.value ?? "";
        setQuery(v);
    }, []);

    const isModifiedClick = (e: React.MouseEvent) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;

    const user = (store as any)?.user?.data ?? (store as any)?.user?.current ?? (store as any)?.viewer ?? null;

    const userRoutes = useMemo(() => asStrArray(user?.routes), [user?.routes]);
    const userGroups = useMemo(() => asNumArray(user?.groups), [user?.groups]);

    const isAdmin = Boolean(user?.is_admin || user?.isAdmin) || userGroups.includes(1);
    const isDev = import.meta.env.DEV === true;

    const allowedSet = useMemo(() => {
        const s = new Set<string>();
        for (const r of userRoutes) s.add(String(r).trim());
        return s;
    }, [userRoutes]);

    const isHomeItem = useCallback(
        (item: any) => {
            const url = String(item?.url ?? "").trim();
            const id = String(item?.id ?? "").trim();

            if (item?.isHome === true || item?.home === true) return true;

            if (url) {
                if (url === "/") return true;
                if (homeUrl && url === homeUrl) return true;
            }

            const homeIds = new Set(["home", "main", "root", "index", "portal-home", "portal_home"]);
            if (homeIds.has(id)) return true;

            return false;
        },
        [homeUrl]
    );

    const isAdminAreaItem = useCallback((item: any) => {
        const id = String(item?.id ?? "").trim();
        const url = String(item?.url ?? "").trim();
        if (id === "admin" || id.startsWith("admin")) return true;
        if (url.startsWith("/admin")) return true;
        return false;
    }, []);

    const isAllowedId = useCallback(
        (id: string) => {
            const rid = String(id ?? "").trim();
            if (!rid) return false;

            // Главная всегда
            if (
                rid === "home" ||
                rid === "main" ||
                rid === "root" ||
                rid === "index" ||
                rid === "portal-home" ||
                rid === "portal_home"
            )
                return true;

            // Админка только админу (не раздаём через allowlist вообще)
            if (rid === "admin" || rid.startsWith("admin")) return isAdmin;

            // Админ видит всё
            if (isAdmin) return true;

            // DEV: allowlist Bitrix игнорируем полностью
            // (в локалке bxCheckEnabled выключен → routes пустые → иначе всё скрывается)
            if (isDev) return true;

            // Остальные строго по allowlist
            return allowedSet.has(rid);
        },
        [allowedSet, isAdmin, isDev]
    );

    const menuByAccess = useMemo(() => {
        const srcRaw = Array.isArray(menu) ? menu : [];

        const foundHome = srcRaw.find((m: any) => isHomeItem(m));
        const homeFallback: MenuItem =
            (foundHome as any) ??
            ({
                id: "home",
                title: "Главная",
                url: homeUrl,
                icon: HomeIcon,
                tabs: [],
                sort: -999999,
            } as any);

        const src = [homeFallback, ...srcRaw.filter((m: any) => m !== foundHome)];

        if (isAdmin) {
            return src.map((m: any) => ({
                ...m,
                tabs: Array.isArray(m?.tabs) ? m.tabs : [],
            }));
        }

        return src
            .map((m: any) => {
                // админ-раздел никогда не показываем не-админам
                if (isAdminAreaItem(m)) return null;

                const tabs = Array.isArray(m?.tabs) ? m.tabs : [];
                const tabsAllowed = tabs
                    .filter((t: any) => !isAdminAreaItem(t))
                    .filter((t: any) => isAllowedId(String(t?.id ?? "").trim()));

                const idAllowed = isAllowedId(String(m?.id ?? "").trim());
                const show = isHomeItem(m) || idAllowed || tabsAllowed.length > 0;

                if (!show) return null;

                return { ...m, tabs: tabsAllowed };
            })
            .filter(Boolean) as (MenuItem & { tabs: any[] })[];
    }, [menu, isAdmin, isAllowedId, isHomeItem, isAdminAreaItem, homeUrl]);

    // auto detect active module/tab
    const activeIdResolved = useMemo(() => {
        if (activeId) return activeId;
        const path = location.pathname;
        const withUrl = menuByAccess.filter((m: any) => m.url);
        const best = withUrl
            .filter((m: any) => path.startsWith(m.url!))
            .sort((a: any, b: any) => b.url!.length - a.url!.length)[0];
        return best?.id;
    }, [activeId, menuByAccess, location.pathname]);

    const activeModule = useMemo(() => menuByAccess.find((m: any) => m.id === activeIdResolved), [menuByAccess, activeIdResolved]);

    const activeTabIdResolved = useMemo(() => {
        if (activeTabId) return activeTabId;
        const tabs = (activeModule as any)?.tabs as Array<{ id: string; url: string }> | undefined;
        if (!tabs?.length) return undefined;
        const path = location.pathname;
        const best = tabs.filter((t) => path.startsWith(t.url)).sort((a, b) => b.url.length - a.url.length)[0];
        return best?.id;
    }, [activeTabId, activeModule, location.pathname]);

    // фильтрация по поиску (сохраняем tabs в поле _tabs)
    const filteredMenu = useMemo(() => {
        const q = query.trim();
        const base = menuByAccess.map((m: any) => ({ ...m, _tabs: (m as any).tabs ?? [] }));

        if (!q) return base;

        return base
            .map((m: any) => {
                const tabs = ((m as any)._tabs ?? []) as Array<{ id: string; title: string; url: string }>;

                if (isHomeItem(m)) return { ...m, _tabs: tabs };

                const tabsFiltered = tabs.filter((t) => includes(String(t.title ?? ""), q));
                const matchModule = includes(String(m.title ?? ""), q);

                if (!matchModule && tabsFiltered.length === 0) return null;

                return { ...m, _tabs: matchModule ? tabs : tabsFiltered };
            })
            .filter(Boolean) as (MenuItem & { _tabs: any[] })[];
    }, [menuByAccess, query]);

    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const searching = query.trim().length > 0;

    // ✅ эксклюзивное раскрытие (аккордеон)
    const toggleExpandedExclusive = useCallback((id: string) => {
        setExpanded((prev) => {
            const willOpen = !prev[id];
            return willOpen ? { [id]: true } : {};
        });
    }, []);

    useEffect(() => {
        if (collapsed) {
            setExpanded({});
        } else if (activeIdResolved) {
            if (query === "" && activeIdResolved) {
                // ✅ при авто-раскрытии тоже только один
                setExpanded({ [activeIdResolved]: true });
            }
        }
    }, [collapsed, activeIdResolved]); // eslint-disable-line

    const quickItems = useMemo(
        () =>
            menuByAccess
                .filter((m: any) => m.mobile && m.url)
                .sort((a: any, b: any) => (a.sort ?? 9999) - (b.sort ?? 9999))
                .slice(0, 2),
        [menuByAccess]
    );

    const closeMobile = useCallback(() => setMobileOpen(false), [setMobileOpen]);
    useBodyScrollLock(isMobileOpen);
    useCloseOnRouteChange(isMobileOpen, closeMobile);
    useEscClose(isMobileOpen, closeMobile);
    const sheetRef = useSwipeToClose(isMobileOpen, closeMobile);

    const ItemRow = ({ item, showText }: { item: MenuItem & { _tabs?: any[] }; showText: boolean }) => {
        const isActive = item.id === activeIdResolved;
        const hasTabs = !!((item as any)._tabs?.length || (item as any).tabs?.length);
        const isOpen = searching ? true : !!expanded[item.id];

        const wrapCls = [
            "group flex items-center w-full rounded px-[12px] h-[44px] mb-[2px] transition-colors",
            isActive ? "bg-[#7034FF0D] text-accent" : "text-secondary hover:text-accent hover:bg-[#7034FF0D]",
        ].join(" ");

        const iconCls = [
            "shrink-0 w-[20px] h-[20px] inline-block transition-colors pointer-events-none",
            isActive ? "icon-accent" : "icon-secondary",
            "group-hover:icon-accent",
        ].join(" ");

        const handleItemClick = (e: React.MouseEvent) => {
            if (!hasTabs) return;
            if (isModifiedClick(e)) return;
            e.preventDefault();
            if (collapsed) setCollapsed(false);
            // ✅ открываем только один
            toggleExpandedExclusive(item.id);
        };

        const handleKey = (e: React.KeyboardEvent) => {
            if (!hasTabs) return;
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (collapsed) setCollapsed(false);
                // ✅ открываем только один
                toggleExpandedExclusive(item.id);
            }
        };

        const LinkInner = item.url ? (
            <Link
                to={item.url}
                className="flex-1 min-w-0 flex items-center gap-3"
                title={showText ? "" : item.title}
                onClick={handleItemClick}
                onKeyDown={handleKey}
            >
                <IconRenderer icon={(item as any).icon as IconLike} className={iconCls} />
                {showText && <span className="truncate">{item.title}</span>}
            </Link>
        ) : (
            <button
                type="button"
                className="flex-1 min-w-0 flex items-center gap-3 text-left"
                title={showText ? "" : item.title}
                onClick={handleItemClick}
                onKeyDown={handleKey}
            >
                <IconRenderer icon={(item as any).icon as IconLike} className={iconCls} />
                {showText && <span className="truncate">{item.title}</span>}
            </button>
        );

        return (
            <div className={wrapCls}>
                {LinkInner}

                {hasTabs && showText && (
                    <button
                        type="button"
                        onClick={() => toggleExpandedExclusive(item.id)}
                        className="shrink-0 ml-1 w-8 h-8 inline-flex items-center justify-center text-inherit/70 hover:text-inherit"
                        aria-label={isOpen ? "Свернуть" : "Развернуть"}
                        aria-expanded={isOpen}
                    >
            <span className={["inline-block transition-transform", isOpen ? "rotate-90" : ""].join(" ")}>
              <RightArrowIcon size="sm" />
            </span>
                    </button>
                )}
            </div>
        );
    };

    const DockBtn: React.FC<{
        to?: string;
        title: string;
        icon?: IconLike;
        onClick?: () => void;
        active?: boolean;
        isButton?: boolean;
    }> = ({ to, title, icon, onClick, active, isButton }) => {
        const base = [
            "group flex flex-col items-center justify-center gap-1 w-full h-full",
            "text-[12px] leading-[16px]",
            active ? "text-accent" : "text-secondary hover:text-accent",
        ].join(" ");
        const iconCls = ["w-6 h-6 transition-colors", active ? "icon-accent" : "icon-secondary group-hover:icon-accent"].join(" ");
        const content = (
            <>
                <IconRenderer icon={icon as IconLike} className={iconCls} />
                <span className="truncate">{title}</span>
            </>
        );
        return isButton ? (
            <button type="button" onClick={onClick} className={base} aria-label={title}>
                {content}
            </button>
        ) : (
            <Link to={to ?? "#"} className={base} aria-label={title} onClick={onClick}>
                {content}
            </Link>
        );
    };

    const notifCount = (store as any)?.notifications?.unreadCount ?? (store as any)?.notificationsCount ?? 0;

    const openNotifications = useCallback(() => {
        // TODO
    }, []);

    const [tgEnabled, setTgEnabled] = useState(false);
    const handleTgChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>((e) => setTgEnabled(e.target.checked), []);

    return (
        <>
            {/* DESKTOP aside */}
            <aside
                className={[
                    "hidden relative overflow-hidden desktop:flex desktop:flex-col desktop:shrink-0 px-[16px] desktop:sticky desktop:top-0",
                    "desktop:h-screen",
                    collapsed ? "desktop:w-[76px]" : "desktop:w-[280px]",
                    "transition-[width] duration-300",
                    "border-r border-secondary bg-primary",
                    "text-body-m",
                    className,
                ].join(" ")}
            >
                {/* header */}
                <div className="pt-[16px] pb-[20px] border-b border-secondary">
                    <div className="flex items-center justify-between">
                        {!collapsed && (
                            <div className="flex items-center gap-3">
                                <svg width="116" height="44" viewBox="0 0 116 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M35.9248 11.5391H16V16.1423H35.9248V11.5391Z" fill="rgb(var(--text-primary))" />
                                    <path d="M35.9248 26.7578H16V31.3946H35.9248V26.7578Z" fill="rgb(var(--text-primary))" />
                                    <path
                                        d="M99.3296 11.5376H93.248L84.0416 18.1232V11.5376H79.4048V21.4496L72.6848 26.2881C72.6848 26.2881 70.7024 27.8673 68.4512 27.9009C64.9232 27.9009 62.0336 25.0113 62.0336 21.4832C62.0336 17.9552 64.9232 15.0656 68.4512 15.0656C70.2656 15.0656 71.912 15.8384 73.088 17.048L76.4144 14.6624C74.4992 12.4112 71.6432 11 68.4512 11C62.672 11 57.968 15.704 57.968 21.4832C57.968 21.6512 57.968 21.8528 57.968 22.0208C57.968 22.0208 57.968 22.0208 57.968 22.0544C57.968 22.1216 57.968 22.1888 57.968 22.2896C57.968 22.3232 57.968 22.3568 57.968 22.3904C57.968 22.424 57.968 22.4576 57.968 22.4912C57.968 22.5248 52.6592 26.3217 52.6592 26.3217C52.6592 26.3217 50.6768 27.9345 48.4256 27.9345C44.8976 27.9345 42.008 25.0449 42.008 21.5168C42.008 17.9888 44.8976 15.0992 48.4256 15.0992C50.24 15.0992 51.8864 15.872 53.0624 17.0816L56.3888 14.696C54.4736 12.4448 51.6176 11.0336 48.4256 11.0336C42.6464 11.0336 37.9424 15.7376 37.9424 21.5168C37.9424 27.2961 42.6464 32.0001 48.4256 32.0001C50.744 32.0001 52.928 31.2273 54.6416 29.9505L59.1776 26.5233L59.2448 26.6577C60.32 28.5393 61.9664 30.0849 63.9488 31.0257C64.2512 31.1601 64.5536 31.2945 64.8896 31.3953C64.8896 31.3953 64.9232 31.3953 64.9232 31.4289C65.024 31.4625 65.1248 31.4961 65.2256 31.5297C65.2256 31.5297 65.2256 31.5297 65.2592 31.5297C65.36 31.5633 65.4608 31.5969 65.5616 31.6305H65.5952C65.696 31.6641 65.7632 31.6641 65.864 31.6977C65.8976 31.6977 65.9312 31.6977 65.9312 31.7313C66.032 31.7649 66.0992 31.7649 66.2 31.7985H66.2336C66.3344 31.8321 66.4352 31.8321 66.536 31.8657C66.5696 31.8657 66.6032 31.8657 66.6032 31.8657C66.6704 31.8657 66.7712 31.8993 66.8384 31.8993H66.9392C67.04 31.8993 67.1408 31.9329 67.208 31.9329H67.2416C67.3424 31.9329 67.4432 31.9665 67.5776 31.9665C67.6112 31.9665 67.6448 31.9665 67.6784 31.9665C67.7456 31.9665 67.8464 31.9665 67.9136 31.9665C67.9472 31.9665 67.9808 31.9665 68.0144 31.9665C68.1152 31.9665 68.216 31.9665 68.3504 31.9665C70.6688 31.9665 72.8192 31.1937 74.5664 29.9169L79.4048 26.3217V31.3617H84.0416V24.8097L93.1808 31.3617H99.3296V30.8913L86.192 21.4496L99.3296 12.0416V11.5376Z"
                                        fill="rgb(var(--text-primary))"
                                    />
                                </svg>
                            </div>
                        )}
                        <button
                            onClick={() => setCollapsed((v) => !v)}
                            className="inline-flex items-center justify-center w-[44px] h-[44px]"
                            title={collapsed ? "Развернуть" : "Свернуть"}
                        >
                            <DoubleLeftIcon className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* scrollable area */}
                <div className="pt-[20px] flex-1 min-h-0 desktop:mb-[200px] overflow-x-hidden overflow-y-auto">
                    {!collapsed && (
                        <div className="mb-2">
                            <Input placeholder="Поиск по меню" value={query} onChange={handleQueryChange} onInput={handleQueryChange} />
                        </div>
                    )}

                    <ul className="space-y-1">
                        {filteredMenu.map((item: any) => {
                            const tabs = (item._tabs ?? item.tabs ?? []) as Array<{ id: string; title: string; url: string }>;
                            const isOpen = (query ? true : expanded[item.id]) && !collapsed;

                            return (
                                <li key={item.id}>
                                    <ItemRow item={item} showText={!collapsed} />

                                    {tabs.length ? (
                                        <div
                                            className={[
                                                "ml-[21px] pl-3 border-l border-secondary",
                                                "grid overflow-hidden transition-all duration-200",
                                                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none",
                                            ].join(" ")}
                                            aria-hidden={!isOpen}
                                        >
                                            <div className="min-h-0">
                                                <ul className="space-y-1.5">
                                                    {tabs.map((t) => {
                                                        const isTActive = t.id === activeTabIdResolved;
                                                        return (
                                                            <li key={t.id}>
                                                                <Link
                                                                    to={t.url}
                                                                    className={[
                                                                        "flex items-center rounded-half transition-colors",
                                                                        "p-[12px]",
                                                                        isTActive
                                                                            ? "text-accent bg-accent/10"
                                                                            : "text-secondary hover:text-accent hover:bg-accent/5",
                                                                    ].join(" ")}
                                                                    title={t.title}
                                                                >
                                                                    {!collapsed && <span className="truncate">{t.title}</span>}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* userbar */}
                {store?.user?.data && (
                    <div className="left-[16px] right-[16px] bottom-[16px] absolute">
                        {!collapsed ? (
                            <div className="bg-primary space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-secondary">Внешний вид</div>
                                    <div className="flex items-center gap-2">
                                        <ThemeTabs />
                                    </div>
                                </div>

                                <UserShort user={store.user.data} />
                            </div>
                        ) : (
                            <div className="flex items-center justify-between flex-col gap-2">
                                <Avatar size="lg" user={store.user.data} />
                            </div>
                        )}
                    </div>
                )}
            </aside>

            {/* MOBILE DOCK */}
            <nav className="desktop:hidden fixed inset-x-0 bottom-0 z-30 h-[72px] border-t border-secondary bg-primary" aria-label="Быстрая навигация">
                <div className="absolute left-1/2 -translate-x-1/2 bottom-[6px] w-12 h-[3px] rounded-full bg-border" aria-hidden />
                <div className="grid grid-cols-3 h-full px-2">
                    <DockBtn to={homeUrl} title="Главная" icon={HomeIcon} active={location.pathname === homeUrl} />
                    <DockBtn to="/estates/flats" title="Недвижимость" icon={OfficeIcon} active={location.pathname === "/estates/flats"} />
                    <DockBtn isButton onClick={() => setMobileOpen(true)} title="Меню" icon={BurgerMenuIcon} active={isMobileOpen} />
                </div>
                <div className="h-[calc(env(safe-area-inset-bottom))]" />
            </nav>

            {/* ===== MOBILE sheet + overlay ===== */}
            <div className={["desktop:hidden fixed inset-0 z-50", isMobileOpen ? "pointer-events-auto" : "pointer-events-none"].join(" ")} aria-hidden={!isMobileOpen}>
                <div
                    onClick={closeMobile}
                    className={["absolute inset-0 z-0 bg-black/40 transition-opacity", isMobileOpen ? "opacity-100" : "opacity-0"].join(" ")}
                />

                <div
                    ref={sheetRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Навигация"
                    className={[
                        "absolute inset-x-0 bottom-0 z-10",
                        "h-[85vh] rounded-t-2xl bg-primary",
                        "transition-transform duration-200 will-change-transform",
                        isMobileOpen ? "translate-y-0" : "translate-y-full",
                        "flex flex-col",
                        "pb-[calc(env(safe-area-inset-bottom)+4px)]",
                    ].join(" ")}
                >
                    <div className="p-3 border-b border-secondary">
                        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border" />
                        <div className="flex items-center justify-between">
                            <div className="font-semibold">Меню</div>
                            <button
                                onClick={closeMobile}
                                className="w-[20px] h-[20px] inline-flex items-center justify-center rounded-lg border border-secondary text-secondary hover:bg-primaryHover"
                            >
                                <CloseIcon size="sm" />
                            </button>
                        </div>

                        <div className="mt-3">
                            <Input
                                placeholder="Введите запрос"
                                value={query}
                                onChange={handleQueryChange}
                                onInput={handleQueryChange}
                                onClear={() => setQuery("")}
                                label=""
                            />
                        </div>
                    </div>

                    <div className="flex-1 px-3 py-2 overflow-y-auto">
                        <ul className="space-y-1.5">
                            {filteredMenu.map((item: any) => {
                                const tabs = (item._tabs ?? item.tabs ?? []) as Array<{ id: string; title: string; url: string }>;
                                const isOpen = query ? true : expanded[item.id];

                                const onMobileModuleClick = (e: React.MouseEvent) => {
                                    if (!tabs.length) {
                                        closeMobile();
                                        return;
                                    }
                                    if (isModifiedClick(e)) return;
                                    e.preventDefault();
                                    // ✅ открываем только один
                                    toggleExpandedExclusive(item.id);
                                };

                                return (
                                    <li key={item.id}>
                                        <div className="flex items-center">
                                            <Link
                                                to={item.url ?? "#"}
                                                className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-primaryHover flex-1"
                                                onClick={onMobileModuleClick}
                                            >
                                                <IconRenderer
                                                    icon={(item as any).icon as IconLike}
                                                    className="w-5 h-5 shrink-0 icon-secondary group-hover:icon-accent"
                                                />
                                                <span className="truncate">{item.title}</span>
                                            </Link>

                                            {tabs.length ? (
                                                <button
                                                    type="button"
                                                    className="ml-1 w-8 h-8 inline-flex items-center justify-center text-secondary hover:text-accent"
                                                    aria-label={isOpen ? "Свернуть" : "Развернуть"}
                                                    onClick={() => toggleExpandedExclusive(item.id)}
                                                >
                                                  <span className={["inline-block transition-transform", isOpen ? "rotate-90" : ""].join(" ")}>
                                                    <RightArrowIcon size="sm" />
                                                  </span>
                                                </button>
                                            ) : null}
                                        </div>

                                        {tabs.length ? (
                                            <div
                                                className={[
                                                    "mt-1 ml-[20px] pl-3 border-l border-secondary",
                                                    "grid overflow-hidden transition-all duration-200",
                                                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none",
                                                ].join(" ")}
                                                aria-hidden={!isOpen}
                                            >
                                                <div className="min-h-0">
                                                    <ul className="space-y-1">
                                                        {tabs.map((t) => {
                                                            const isTActive = t.id === activeTabIdResolved;
                                                            return (
                                                                <li key={t.id}>
                                                                    <Link
                                                                        to={t.url}
                                                                        onClick={closeMobile}
                                                                        className={[
                                                                            "group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                                                                            isTActive
                                                                                ? "text-accent font-semibold bg-accent/10"
                                                                                : "text-secondary hover:text-accent hover:bg-accent/5",
                                                                        ].join(" ")}
                                                                    >
                                                                        <span className="truncate">{t.title}</span>
                                                                    </Link>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            </div>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="border-t border-secondary p-3">
                        <div className="text-[14px] font-semibold mb-2">Настройки</div>

                        <div className="flex items-center justify-between py-2">
                            <div className="text-secondary">Внешний вид</div>
                            <div className="flex items-center gap-2">
                                <ThemeTabs />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
