import { useCallback, useEffect, useRef } from "react";

type Options = {
    draggingClassName?: string;
    enableShiftWheelX?: boolean;
    preventDefaultOnMove?: boolean;
    moveTolerance?: number;
    mouseButton?: 0 | 1 | 2;
    ignoreFrom?: string;

    overflowY?: "visible" | "hidden" | "auto";

    /**
     * Раньше у тебя было pan-x (и это ломало вертикальный скролл страницы).
     * Теперь: ставим безопасное значение, чтобы на мобилке работали и X, и Y нативно.
     */
    touchActionPanX?: boolean;

    /** Прокрутка по тачпаду через deltaX (двумя пальцами вбок) */
    enableTrackpadDeltaX?: boolean;
};

export function useHorizontalDragScroll<T extends HTMLElement = HTMLDivElement>(
    opts: Options = {},
) {
    const {
        draggingClassName = "dragging",
        enableShiftWheelX = true,
        preventDefaultOnMove = true,
        moveTolerance = 6,
        mouseButton = 0,
        ignoreFrom = "a,button,input,textarea,select,[contenteditable],[data-nodrag]",
        overflowY = "visible",
        touchActionPanX = true,
        enableTrackpadDeltaX = true,
    } = opts;

    const ref = useRef<T | null>(null);

    // state refs (no re-renders)
    const draggingRef = useRef(false);
    const movedRef = useRef(false);

    const downClientXRef = useRef(0);
    const downClientYRef = useRef(0);
    const startScrollLeftRef = useRef(0);

    // ===== RAF batching (shared for drag + wheel) =====
    const rafPendingRef = useRef<number | null>(null);
    const nextScrollLeftRef = useRef<number | null>(null);

    // ===== click suppress (1 listener per mount) =====
    const suppressClickOnceRef = useRef(false);

    // ===== can scroll X cache (avoid layout reads on every wheel) =====
    const canScrollXRef = useRef(false);

    const scheduleApply = useCallback(() => {
        if (rafPendingRef.current != null) return;

        rafPendingRef.current = window.requestAnimationFrame(() => {
            rafPendingRef.current = null;

            const el = ref.current;
            if (!el) return;

            const next = nextScrollLeftRef.current;
            if (next != null) {
                el.scrollLeft = next;
                nextScrollLeftRef.current = null;
            }
        });
    }, []);

    const queueScrollLeft = useCallback(
        (value: number) => {
            // лёгкая защита от NaN/Infinity
            if (!Number.isFinite(value)) return;
            nextScrollLeftRef.current = value;
            scheduleApply();
        },
        [scheduleApply],
    );

    const addScrollLeft = useCallback(
        (delta: number) => {
            const el = ref.current;
            if (!el) return;
            if (!Number.isFinite(delta) || delta === 0) return;

            // используем уже “запланированное” значение, если оно есть
            const base =
                nextScrollLeftRef.current != null ? nextScrollLeftRef.current : el.scrollLeft;

            nextScrollLeftRef.current = base + delta;
            scheduleApply();
        },
        [scheduleApply],
    );

    const stopDragging = useCallback(() => {
        const el = ref.current;

        if (movedRef.current) {
            suppressClickOnceRef.current = true; // один клик после drag гасим
        }

        draggingRef.current = false;
        movedRef.current = false;

        if (el && draggingClassName) el.classList.remove(draggingClassName);
    }, [draggingClassName]);

    const onPointerDown = useCallback(
        (e: PointerEvent) => {
            const el = ref.current;
            if (!el) return;

            // ✅ на touch/pen не лезем в drag
            if (e.pointerType !== "mouse") return;

            // игнорируем запрещённые зоны
            const target = e.target as Element | null;
            if (target && ignoreFrom && target.closest(ignoreFrom)) return;

            if (e.button !== mouseButton) return;

            draggingRef.current = true;
            movedRef.current = false;

            downClientXRef.current = e.clientX;
            downClientYRef.current = e.clientY;
            startScrollLeftRef.current = el.scrollLeft;

            // pointer capture = меньше “pointerleave/потерялся up”
            try {
                el.setPointerCapture?.(e.pointerId);
            } catch {}

            if (draggingClassName) el.classList.add(draggingClassName);
        },
        [draggingClassName, mouseButton, ignoreFrom],
    );

    const onPointerMove = useCallback(
        (e: PointerEvent) => {
            if (!draggingRef.current) return;
            const el = ref.current;
            if (!el) return;

            const dx = e.clientX - downClientXRef.current;
            const dy = e.clientY - downClientYRef.current;

            if (!movedRef.current) {
                const adx = dx < 0 ? -dx : dx;
                const ady = dy < 0 ? -dy : dy;

                if (adx > moveTolerance || ady > moveTolerance) movedRef.current = true;
            }

            // preventDefault только когда реально двигаем (чтобы меньше вмешиваться)
            if (preventDefaultOnMove && movedRef.current) e.preventDefault();

            // задаём целевое значение, применим через RAF
            queueScrollLeft(startScrollLeftRef.current - dx);
        },
        [moveTolerance, preventDefaultOnMove, queueScrollLeft],
    );

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // базовые стили
        if (!el.style.overflowX) el.style.overflowX = "auto";
        el.style.overflowY = overflowY;

        // ✅ не pan-x (он блокирует вертикаль)
        if (touchActionPanX) el.style.touchAction = "pan-x pan-y";

        // ===== canScrollX cache: ResizeObserver =====
        const updateCanScrollX = () => {
            // scrollWidth/clientWidth — чтение, но ResizeObserver вызывается редко
            canScrollXRef.current = el.scrollWidth > el.clientWidth;
        };

        updateCanScrollX();

        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => updateCanScrollX());
            ro.observe(el);
        }

        // ===== click capture (1 listener) =====
        const onClickCapture = (ev: MouseEvent) => {
            if (!suppressClickOnceRef.current) return;
            suppressClickOnceRef.current = false;

            // гасим только клики внутри scroller
            if (!el.contains(ev.target as Node)) return;
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation?.();
        };

        // ===== dragstart prevent only while dragging =====
        const onDragStart = (ev: DragEvent) => {
            if (draggingRef.current) ev.preventDefault();
        };

        // ===== wheel / trackpad =====
        const onWheel = (ev: WheelEvent) => {
            // не ломаем zoom жесты (ctrl+wheel / pinch)
            if (ev.ctrlKey) return;

            // если горизонтали нет — ничего не делаем
            if (!canScrollXRef.current) return;

            // Shift+wheel -> X, блокируем вертикаль страницы
            if (enableShiftWheelX && ev.shiftKey) {
                ev.preventDefault();
                addScrollLeft(ev.deltaY);
                return;
            }

            if (!enableTrackpadDeltaX) return;

            const dx = ev.deltaX;
            const dy = ev.deltaY;

            // Быстрый фильтр “почти вертикально” (не трогаем)
            const adx = dx < 0 ? -dx : dx;
            const ady = dy < 0 ? -dy : dy;

            // условие “явно горизонтальный жест”
            if (adx > 4 && adx > ady * 1.25) {
                ev.preventDefault();
                addScrollLeft(dx);
            }
        };

        // pointer events
        el.addEventListener("pointerdown", onPointerDown);
        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerup", stopDragging);
        el.addEventListener("pointercancel", stopDragging);

        // click capture
        el.addEventListener("click", onClickCapture, true);

        // misc
        el.addEventListener("dragstart", onDragStart);
        el.addEventListener("wheel", onWheel, { passive: false });

        // если контент меняется без resize контейнера — на scroll тоже обновим canScrollX
        const onScroll = () => updateCanScrollX();
        el.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            try {
                ro?.disconnect();
            } catch {}

            el.removeEventListener("pointerdown", onPointerDown);
            el.removeEventListener("pointermove", onPointerMove);
            el.removeEventListener("pointerup", stopDragging);
            el.removeEventListener("pointercancel", stopDragging);

            el.removeEventListener("click", onClickCapture, true);

            el.removeEventListener("dragstart", onDragStart);
            el.removeEventListener("wheel", onWheel);
            el.removeEventListener("scroll", onScroll);
        };
    }, [
        onPointerDown,
        onPointerMove,
        stopDragging,
        enableShiftWheelX,
        enableTrackpadDeltaX,
        overflowY,
        touchActionPanX,
        addScrollLeft,
    ]);

    useEffect(() => {
        return () => {
            if (rafPendingRef.current != null) cancelAnimationFrame(rafPendingRef.current);
        };
    }, []);

    return { ref } as const;
}
