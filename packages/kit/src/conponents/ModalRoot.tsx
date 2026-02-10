// components/ModalRoot.tsx
import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from "react";
import { observer } from "mobx-react-lite";
import { createPortal } from "react-dom";
import { getModalsStore } from "../api/modal";
import type { ModalEntry } from "../store/Modal";
import { twMerge } from "tailwind-merge";

import { CloseIcon } from "@krystark/app-icons";

/* ================== helpers ================== */

const MOBILE_BP = 768;
function useIsMobile() {
    const [is, setIs] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth < MOBILE_BP : false
    );
    useEffect(() => {
        const m = window.matchMedia(`(max-width: ${MOBILE_BP - 1}px)`);
        const on = (e: MediaQueryListEvent | MediaQueryList) =>
            setIs("matches" in e ? e.matches : (e as any).matches);
        on(m);
        m.addEventListener?.("change", on as any);
        return () => m.removeEventListener?.("change", on as any);
    }, []);
    return is;
}

function isCard(m: ModalEntry): m is ModalEntry & { kind: "card" } {
    return m.kind === "card";
}

/* ================== desktop card ================== */

function DefaultModalCard(props: {
    title?: string;
    showClose?: boolean;
    imageOnly?: boolean;
    className?: string;
    maxWidth?: number | string;
    contentClassName?: string;
    onClose?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    const {
        title,
        className,
        maxWidth = 720,
        contentClassName,
        imageOnly = false,
        onClose,
        showClose = true,
        children,
        disabled = false,
    } = props;

    return (
        <div
            className={`relative w-full ${
                imageOnly ? "" : "rounded shadow-xl bg-primary"
            }
        animate-[popIn_160ms_ease-out] ${className ?? ""} ${
                disabled
                    ? "pointer-events-none opacity-60 scale-[.98]"
                    : "pointer-events-auto"
            }`}
            role="dialog"
            aria-modal="true"
            aria-hidden={disabled ? true : undefined}
            {...(disabled ? ({ inert: "" } as any) : null)}
            style={{ maxWidth: imageOnly ? 1200 : maxWidth }}
        >
            {showClose && !disabled && (
                <button
                    aria-label="Закрыть модальное окно"
                    onClick={onClose}
                    className="absolute top-[20px] right-[32px]"
                >
                    <CloseIcon size="sm" />
                </button>
            )}

            {title && (
                <div className="px-[32px] pt-[24px] pr-[48px]">
                    <h2 className="text-t1">{title}</h2>
                </div>
            )}
            <div
                className={twMerge(
                    "px-[32px] pb-[24px] pt-[24px]",
                    contentClassName
                )}
            >
                {children}
            </div>
        </div>
    );
}

/* ================== mobile bottom sheet ================== */

type SheetProps = {
    title?: string;
    showClose?: boolean;
    className?: string;
    contentClassName?: string;
    onClose?: () => void; // вызовется ПОСЛЕ exit-анимации
    children: React.ReactNode;
    disabled?: boolean;
};

type BottomSheetHandle = { closeWithAnimation: () => void };

const BottomSheetCard = forwardRef<BottomSheetHandle, SheetProps>(
    function BottomSheetCard(
        {
            title,
            showClose = true,
            className,
            contentClassName,
            onClose,
            children,
            disabled = false,
        },
        ref
    ) {
        const wrapRef = useRef<HTMLDivElement | null>(null);
        const [y, setY] = useState(0);
        const [dragging, setDragging] = useState(false);
        const [phase, setPhase] = useState<"enter" | "idle" | "exit">("enter");

        const startYRef = useRef(0);
        const lastYRef = useRef(0);
        const lastTRef = useRef(0);
        const velocityRef = useRef(0);

        // ENTER
        useEffect(() => {
            setY(0);
            const t = setTimeout(() => setPhase("idle"), 10);
            return () => clearTimeout(t);
        }, []);

        const animateClose = useCallback(() => {
            setPhase("exit");
            const t = setTimeout(() => onClose?.(), 180);
            return () => clearTimeout(t);
        }, [onClose]);

        useImperativeHandle(ref, () => ({
            closeWithAnimation: () => animateClose(),
        }));

        const onCloseClick = useCallback(() => {
            if (dragging) return;
            animateClose();
        }, [dragging, animateClose]);

        // Gesture
        const onTouchStart = useCallback(
            (e: React.TouchEvent) => {
                if (disabled) return;
                const t = e.touches[0];
                startYRef.current = t.clientY;
                lastYRef.current = t.clientY;
                lastTRef.current = performance.now();
                velocityRef.current = 0;
                setDragging(true);
            },
            [disabled]
        );

        const onTouchMove = useCallback(
            (e: React.TouchEvent) => {
                if (!dragging || disabled) return;
                const t = e.touches[0];
                const dy = Math.max(0, t.clientY - startYRef.current);

                // не перехватываем, если контент скроллится
                const sc = wrapRef.current?.querySelector<HTMLElement>(
                    "[data-sheet-scroll]"
                );
                if (sc && dy < 8 && sc.scrollTop > 0) return;

                const now = performance.now();
                const dt = now - lastTRef.current || 16;
                velocityRef.current = (t.clientY - lastYRef.current) / dt;

                lastYRef.current = t.clientY;
                lastTRef.current = now;
                setY(dy);
            },
            [dragging, disabled]
        );

        const onTouchEnd = useCallback(() => {
            if (!dragging || disabled) return;
            setDragging(false);

            const THRESHOLD = 80;
            const VEL = 0.6 / 1000;

            const shouldClose = y > THRESHOLD || velocityRef.current > VEL;
            if (shouldClose) {
                setY(0);
                animateClose();
            } else {
                setY(0);
            }
        }, [dragging, disabled, y, animateClose]);

        const baseTranslate =
            phase === "enter"
                ? "translateY(100%)"
                : phase === "exit"
                ? "translateY(100%)"
                : "translateY(0px)";

        const extraY = phase === "idle" ? y : 0;

        const style: React.CSSProperties = {
            transform: `${baseTranslate} translateY(${
                disabled ? 0 : extraY
            }px)`,
            transition: disabled
                ? undefined
                : dragging
                ? "none"
                : "transform 180ms ease-out",
            willChange: disabled ? undefined : "transform",
        };

        return (
            <div
                ref={wrapRef}
                className={`
        absolute inset-x-0 bottom-0
        bg-primary rounded-t-[16px] shadow-xl
        w-full
        ${className ?? ""} ${
                    disabled
                        ? "pointer-events-none opacity-60 scale-[.98]"
                        : "pointer-events-auto"
                }
      `}
                role="dialog"
                aria-modal="true"
                aria-hidden={disabled ? true : undefined}
                {...(disabled ? ({ inert: "" } as any) : null)}
                style={style}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* drag handle */}
                <div className="flex items-center justify-center pt-[8px] pb-[4px] select-none">
                    <div className="w-[40px] h-[4px] rounded-full bg-border" />
                </div>

                <div className="relative px-[16px] pb-[12px]">
                    {(title || (showClose && !disabled)) && (
                        <div className="flex items-start gap-2 pr-[40px]">
                            {title && <h2 className="text-t2">{title}</h2>}
                            {showClose && !disabled && (
                                <button
                                    aria-label="Закрыть модальное окно"
                                    onClick={onCloseClick}
                                    className="absolute right-[8px] top-[-5px]"
                                >
                                    <CloseIcon size="sm" />
                                </button>
                            )}
                        </div>
                    )}

                    <div
                        data-sheet-scroll
                        className={`mt-[8px] max-h-[80dvh] overflow-y-auto overscroll-contain ${
                            contentClassName ?? ""
                        }`}
                    >
                        {children}
                    </div>
                </div>
            </div>
        );
    }
);

/* ================== root ================== */

export const ModalRoot = observer(function ModalRoot() {
    const modals = getModalsStore();
    const { stack, top } = modals;
    const isMobile = useIsMobile();

    // refs шторок по id
    const sheetRefs = useRef(new Map<string, BottomSheetHandle>());

    // ESC с мягким закрытием на мобилке
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            const curr = modals.top;
            if (!curr || curr.closeOnEsc === false) return;

            if (isMobile && curr.kind === "card") {
                const ref = sheetRefs.current.get(curr.id);
                if (ref) {
                    ref.closeWithAnimation();
                    return;
                }
            }
            modals.closeTop();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [modals, isMobile]);

    // Scroll lock
    useEffect(() => {
        if (!modals.hasLockScroll) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [modals.hasLockScroll]);

    // Backdrop fade-in
    const [backdropOn, setBackdropOn] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setBackdropOn(true), 10);
        return () => clearTimeout(t);
    }, [stack.length]);

    if (stack.length === 0) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999]">
            {/* Backdrop */}
            <div
                className={`
          absolute inset-0 bg-[#000000ba]
          transition-opacity duration-200
          ${backdropOn ? "opacity-100" : "opacity-0"}
        `}
                onMouseDown={(e) => {
                    if (!top || top.closeOnBackdrop === false) return;
                    if (e.target !== e.currentTarget) return;

                    if (isMobile && top.kind === "card") {
                        const ref = sheetRefs.current.get(top.id);
                        if (ref) {
                            ref.closeWithAnimation();
                            return;
                        }
                    }
                    modals.close(top.id);
                }}
                onTouchStart={(e) => {
                    if (!top || top.closeOnBackdrop === false) return;
                    if (e.target !== e.currentTarget) return;

                    if (isMobile && top.kind === "card") {
                        const ref = sheetRefs.current.get(top.id);
                        if (ref) {
                            ref.closeWithAnimation();
                            return;
                        }
                    }
                    modals.close(top.id);
                }}
            />

            {/* Stack */}
            {stack.map((m, i) => {
                const isTop = i === stack.length - 1;
                const sheet = isMobile && isCard(m);

                const setRef = (r: BottomSheetHandle | null) => {
                    if (r) sheetRefs.current.set(m.id, r);
                    else sheetRefs.current.delete(m.id);
                };

                const closeForContent = sheet
                    ? () => sheetRefs.current.get(m.id)?.closeWithAnimation()
                    : () => modals.close(m.id);

                const node =
                    typeof m.content === "function"
                        ? m.content(closeForContent)
                        : m.content;

                const containerCls =
                    `absolute inset-0 pointer-events-none ${
                        m.wrapperClassName ?? ""
                    } ` +
                    (sheet
                        ? "flex items-end justify-stretch"
                        : "flex min-h-full items-center justify-center p-4");

                return (
                    <div
                        key={m.id}
                        className={containerCls}
                        style={{ zIndex: (m.zIndex ?? 1000) + i + 1 }}
                    >
                        {sheet ? (
                            <BottomSheetCard
                                ref={setRef}
                                title={(m as any).title}
                                showClose={(m as any).showClose}
                                className={(m as any).cardClassName}
                                contentClassName={(m as any).contentClassName}
                                onClose={() => modals.close(m.id)}
                                disabled={!isTop}
                            >
                                {node}
                            </BottomSheetCard>
                        ) : isCard(m) ? (
                            <DefaultModalCard
                                title={m.title}
                                showClose={m.showClose as boolean | undefined}
                                className={m.cardClassName}
                                contentClassName={m.contentClassName}
                                maxWidth={(m as any).maxWidth}
                                onClose={() => modals.close(m.id)}
                                disabled={!isTop}
                            >
                                {node}
                            </DefaultModalCard>
                        ) : (
                            <div
                                className={`pointer-events-auto ${
                                    !isTop ? "opacity-60 scale-[.98]" : ""
                                }`}
                                aria-hidden={!isTop}
                                {...(!isTop ? ({ inert: "" } as any) : null)}
                            >
                                {node}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>,
        document.body
    );
});
