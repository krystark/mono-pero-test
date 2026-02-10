import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    RightArrowIcon,
    LeftArrowIcon,
    LoadingIcon,
    CloseIcon,
} from '@krystark/app-icons';

/** ==== Types ==== */
export type MediaType = 'image' | 'rutube';

export interface MediaItem {
    src: string;
    caption?: string;
    type?: MediaType;
}

/** ==== Simple global store (singleton) ==== */
type LightboxState = {
    isOpen: boolean;
    items: MediaItem[];
    index: number;
};

const state: LightboxState = {
    isOpen: false,
    items: [],
    index: 0,
};

const subscribers = new Set<() => void>();
function notify() {
    subscribers.forEach((fn) => fn());
}

/** ==== RuTube helpers & type detection ==== */
const RUTUBE_HOST_RE = /(^|\.)rutube\.ru$/i;
const UUID_RE = /^[a-z0-9-]{24,}$/i;

function ensureAbsoluteRutube(raw: string) {
    let s = String(raw).trim();
    if (s.startsWith('//')) s = 'https:' + s;
    if (/^rutube\.ru/i.test(s)) s = 'https://' + s;
    if (/^www\.rutube\.ru/i.test(s)) s = 'https://' + s.replace(/^www\./i, '');
    return s;
}

function detectType(src: string): MediaType {
    const raw = String(src).trim();
    // быстрый путь — ловит и ссылки без протокола
    if (/rutube\.ru/i.test(raw)) return 'rutube';
    try {
        const u = new URL(raw, window.location.href);
        return RUTUBE_HOST_RE.test(u.hostname) ? 'rutube' : 'image';
    } catch {
        return /rutube\.ru/i.test(raw) ? 'rutube' : 'image';
    }
}

function toRutubeEmbed(url: string): string {
    const s = ensureAbsoluteRutube(url);
    try {
        const u = new URL(s);
        if (!RUTUBE_HOST_RE.test(u.hostname)) return s;

        // patterns:
        // - https://rutube.ru/video/<uuid>/
        // - https://rutube.ru/play/embed/<uuid>/
        const parts = u.pathname.split('/').filter(Boolean);
        let id: string | null = null;

        if (parts[0] === 'video' && parts[1]) id = parts[1];
        else if (parts[0] === 'play' && parts[1] === 'embed' && parts[2]) id = parts[2];
        else if (parts.length) {
            const last = parts[parts.length - 1];
            if (UUID_RE.test(last)) id = last;
        }
        return id ? `https://rutube.ru/play/embed/${id}` : s;
    } catch {
        return s;
    }
}

/** ==== Public API ==== */
export function openLightbox(items: MediaItem[], startIndex = 0) {
    if (!items || items.length === 0) return;

    // НОРМАЛИЗАЦИЯ: автодетект типа + приведение RuTube к embed/абсолютным ссылкам
    const normalized = items.map((it) => {
        const t = (it.type as MediaType) || detectType(it.src);
        const src = t === 'rutube' ? toRutubeEmbed(it.src) : it.src;
        return { ...it, type: t, src };
    });

    state.isOpen = true;
    state.items = normalized;
    state.index = Math.max(0, Math.min(startIndex, normalized.length - 1));
    document.body.classList.add('overflow-hidden');
    notify();
}

export function closeLightbox() {
    state.isOpen = false;
    state.items = [];
    state.index = 0;
    document.body.classList.remove('overflow-hidden');
    notify();
}

export function nextLightbox() {
    if (state.items.length <= 1) return;
    state.index = (state.index + 1) % state.items.length;
    notify();
}

export function prevLightbox() {
    if (state.items.length <= 1) return;
    state.index = (state.index - 1 + state.items.length) % state.items.length;
    notify();
}

/** ==== Build item from DOM element ==== */
export function buildItemFromElement(el: Element): MediaItem | null {
    const e = el as HTMLElement & { href?: string; src?: string };
    const ds = e.dataset || {};

    const rawSrc =
        ds.lightboxSrc ||
        ds.src ||
        e.getAttribute?.('href') ||
        (e as any).href ||
        (e as any).src;

    if (!rawSrc) return null;

    const caption = ds.lightboxCaption || ds.caption || e.getAttribute?.('alt') || undefined;
    const rawType = (ds.lightboxType || ds.type) as string | undefined;
    const t: MediaType =
        rawType === 'video' ? 'rutube' : ((rawType as MediaType) || detectType(rawSrc));

    const src = t === 'rutube' ? toRutubeEmbed(rawSrc) : rawSrc;

    return { src, caption, type: t };
}

/** ==== Delegation ==== */
export type DelegationOptions = {
    selector?: string; // default: [data-lightbox]
    groupAttr?: string; // default: data-lightbox-group
};

export function attachLightboxDelegation(opts: DelegationOptions = {}) {
    const selector = opts.selector || '[data-lightbox]';
    const groupAttr = opts.groupAttr || 'data-lightbox-group';

    function onClick(ev: MouseEvent) {
        const target = ev.target as Element | null;
        if (!target) return;
        const node = target.closest(selector);
        if (!node) return;

        ev.preventDefault();

        const group = node.getAttribute(groupAttr) || '';
        let nodes: Element[] = [node];
        if (group) {
            nodes = Array.from(
                document.querySelectorAll(`${selector}[${groupAttr}="${CSS.escape(group)}"]`),
            );
        }

        const items: MediaItem[] = [];
        let startIndex = 0;

        nodes.forEach((n, i) => {
            const item = buildItemFromElement(n);
            if (item) {
                items.push(item);
                if (n === node) startIndex = i;
            }
        });

        if (items.length) openLightbox(items, startIndex);
    }

    // capture — чтобы перехватить клик по ссылкам раньше перехода
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
}

/** ==== Root (portal) ==== */
export const LightboxRoot: React.FC = () => {
    const [, force] = useState(0);
    const unsubRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        const sub = () => force((x) => x + 1);
        subscribers.add(sub);
        unsubRef.current = () => subscribers.delete(sub);
        return () => unsubRef.current?.();
    }, []);

    if (!state.isOpen) return null;

    return createPortal(<LightboxInner />, getHost());
};

/** Host element for portal */
let hostEl: HTMLElement | null = null;
function getHost() {
    if (!hostEl) {
        hostEl = document.createElement('div');
        hostEl.id = 'media-lightbox-root';
        document.body.appendChild(hostEl);
    }
    return hostEl;
}

function runIdle(cb: () => void, timeout = 800) {
    const g = globalThis as any;
    if (typeof g.requestIdleCallback === 'function') {
        return g.requestIdleCallback(cb, { timeout });
    }
    return setTimeout(cb, 0);
}

/** ==== Inner UI ==== */
const LightboxInner: React.FC = () => {
    const { items, index } = state;
    const item = items[index];
    const hasMany = items.length > 1;
    const wrapRef = useRef<HTMLDivElement | null>(null);

    // loader state
    const [mediaLoading, setMediaLoading] = useState(true);
    const [mediaError, setMediaError] = useState(false);

    // show loader only if loading takes noticeable time (prevents flicker + reduces repaints)
    const [loaderVisible, setLoaderVisible] = useState(false);

    // cache for preload so we don't repeatedly spawn Image() for same urls
    const preloadedRef = useRef<Set<string>>(new Set());

    const mediaKey = `${item?.type ?? 'image'}|${item?.src ?? ''}`;
    const isRutube = item?.type === 'rutube';

    // reset loader on slide change
    useEffect(() => {
        setMediaLoading(true);
        setMediaError(false);
        setLoaderVisible(false);

        const t = setTimeout(() => setLoaderVisible(true), 140);
        return () => clearTimeout(t);
    }, [mediaKey]);

    // if media finished quickly — hide loader for sure
    useEffect(() => {
        if (!mediaLoading) setLoaderVisible(false);
    }, [mediaLoading]);

    // rutube: fallback timeout -> show "error" if iframe hangs forever
    useEffect(() => {
        if (!isRutube) return;
        if (!mediaLoading) return;

        const t = setTimeout(() => {
            if (state.isOpen && state.items[state.index]?.src === item?.src) {
                setMediaLoading(false);
                setMediaError(true);
            }
        }, 15000);

        return () => clearTimeout(t);
    }, [isRutube, mediaLoading, item?.src]);

    // preload NEXT image only, and only after current is fully shown; schedule in idle
    useEffect(() => {
        if (!items?.length) return;
        if (mediaLoading || mediaError) return;
        if (items.length <= 1) return;

        const nextIndex = (index + 1) % items.length;
        const it = items[nextIndex];
        if (!it || it.type !== 'image') return;
        if (!it.src) return;
        if (preloadedRef.current.has(it.src)) return;

        const run = () => {
            if (preloadedRef.current.has(it.src)) return;
            preloadedRef.current.add(it.src);

            const img = new Image();
            img.decoding = 'async';
            (img as any).loading = 'eager';
            img.src = it.src;
        };

        runIdle(run, 800);
    }, [items, index, mediaLoading, mediaError]);

    // keyboard controls
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (!state.isOpen) return;
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowRight') nextLightbox();
            else if (e.key === 'ArrowLeft') prevLightbox();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // close on backdrop click
    function onBackdropClick(e: React.MouseEvent) {
        if (e.target === e.currentTarget) closeLightbox();
    }

    // basic swipe
    useSwipe(wrapRef, {
        onSwipeLeft: () => hasMany && nextLightbox(),
        onSwipeRight: () => hasMany && prevLightbox(),
    });

    const showLoader = loaderVisible && mediaLoading && !mediaError;

    return (
        <div
            className={[
                'fixed inset-0 z-[9999] bg-[#212427a6] flex items-start justify-center p-4 py-8 overflow-y-auto',
                mediaLoading ? '' : 'backdrop-blur-[2px]',
            ].join(' ')}
            onMouseDown={onBackdropClick}
            role="dialog"
            aria-modal="true"
        >
            <div
                ref={wrapRef}
                className="relative max-w-5xl w-full select-none m-auto"
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* === CLOSE === */}
                <button
                    type="button"
                    aria-label="Close"
                    onClick={closeLightbox}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="pointer-events-auto absolute -top-5 -right-5 bg-primary/85 hover:bg-primary rounded-circle p-2 shadow z-[1]"
                >
                    <CloseIcon color="icon-accent" />
                </button>

                {/* === Media box (controls внутри, подпись вынесена ниже) === */}
                <div className="relative w-full">
                    {isRutube ? (
                        <div className="relative w-full pt-[56.25%] overflow-hidden bg-primary">
                            <iframe
                                key={mediaKey}
                                className="absolute inset-0 w-full h-full"
                                src={item.src}
                                title={item.caption || 'RuTube video'}
                                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                                allowFullScreen
                                onLoad={() => setMediaLoading(false)}
                            />

                            {(showLoader || mediaError) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/60 pointer-events-none">
                                    {mediaError ? (
                                        <div className="text-sm text-text-secondary">Не удалось загрузить видео</div>
                                    ) : (
                                        <LoadingIcon
                                            size="lg"
                                            color="icon-accent"
                                            className="animate-spin transform-gpu will-change-transform"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        // фиксируем зону просмотра — иначе лэйаут "плавает" и всё начинает лагать
                        <div className="relative w-full flex items-center justify-center bg-primary overflow-hidden max-h-[80vh]">
                            <img
                                key={mediaKey}
                                src={item.src}
                                alt={item.caption || ''}
                                decoding="async"
                                className={[
                                    'max-h-[80vh] w-auto max-w-full block mx-auto bg-white-main object-contain',
                                    'transition-opacity duration-200',
                                    mediaLoading || mediaError ? 'opacity-0' : 'opacity-100',
                                ].join(' ')}
                                draggable={false}
                                onLoad={() => setMediaLoading(false)}
                                onError={() => {
                                    setMediaLoading(false);
                                    setMediaError(true);
                                }}
                            />

                            {(showLoader || mediaError) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/60 pointer-events-none">
                                    {mediaError ? (
                                        <div className="text-sm text-text-secondary">Не удалось загрузить изображение</div>
                                    ) : (
                                        <LoadingIcon
                                            size="lg"
                                            color="icon-accent"
                                            className="animate-spin transform-gpu will-change-transform"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {hasMany && (
                        <>
                            <button
                                type="button"
                                aria-label="Previous"
                                onClick={prevLightbox}
                                className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2 bg-primary/85 hover:bg-primary rounded-circle p-2 shadow"
                            >
                                <LeftArrowIcon color="icon-accent" />
                            </button>
                            <button
                                type="button"
                                aria-label="Next"
                                onClick={nextLightbox}
                                className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 bg-primary/85 hover:bg-primary rounded-circle p-2 shadow"
                            >
                                <RightArrowIcon color="icon-accent" />
                            </button>

                            {/* Дефолт: bottom-center. Альтернатива: top-3 right-3 */}
                            <div
                                className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-text-secondary bg-primary/85 rounded px-2 py-0.5"
                                aria-live="polite"
                            >
                                {index + 1} / {items.length}
                            </div>
                        </>
                    )}
                </div>

                {!!item.caption && (
                    <div className="mt-4 text-center text-text-secondary text-sm leading-[1.35] px-3">
                        {item.caption}
                    </div>
                )}
            </div>
        </div>
    );
};

/** ==== Swipe helper ==== */
function useSwipe(
    ref: React.RefObject<HTMLElement>,
    opts: { onSwipeLeft?: () => void; onSwipeRight?: () => void; threshold?: number } = {},
) {
    const { onSwipeLeft, onSwipeRight, threshold = 60 } = opts;
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let x0 = 0;
        let y0 = 0;
        let down = false;

        function onPointerDown(e: PointerEvent) {
            down = true;
            x0 = e.clientX;
            y0 = e.clientY;
        }
        function onPointerUp(e: PointerEvent) {
            if (!down) return;
            down = false;
            const dx = e.clientX - x0;
            const dy = e.clientY - y0;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
                if (dx < 0) onSwipeLeft?.();
                else onSwipeRight?.();
            }
        }

        el.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointerup', onPointerUp);
        return () => {
            el.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [ref, onSwipeLeft, onSwipeRight, threshold]);
}
