import React, { useCallback } from 'react';
import { useHorizontalDragScroll } from '../hooks/useHorizontalDragScroll';

export type HorizontalScrollerProps = React.HTMLAttributes<HTMLDivElement> & {
    /** Класс, который вешается во время drag (по умолчанию 'dragging') */
    draggingClassName?: string;
    /** Включить Shift+Wheel для горизонтальной прокрутки */
    enableShiftWheelX?: boolean;
    /** Порог, после которого считаем, что был drag (px) */
    moveTolerance?: number;
    /** Какая кнопка стартует drag (0=левая) */
    mouseButton?: 0 | 1 | 2;
    /** Селектор элементов, откуда drag запрещён */
    ignoreFrom?: string;
    /** Включить клавиатурное управление */
    keyboard?: boolean;
    /** Шаг стрелок в px */
    keyboardStep?: number;
    /** Доля ширины для PageUp/PageDown (0..1) */
    pageStep?: number;

    /** Управление overflow по оси Y контейнера; по умолчанию 'visible' ради корректного sticky у детей */
    overflowY?: 'visible' | 'hidden' | 'auto';
};

export const HorizontalScroller: React.FC<HorizontalScrollerProps> = ({
                                                                          className = '',
                                                                          children,
                                                                          draggingClassName = 'dragging',
                                                                          enableShiftWheelX = true,
                                                                          moveTolerance = 6,
                                                                          mouseButton = 0,
                                                                          ignoreFrom,
                                                                          keyboard = true,
                                                                          keyboardStep = 80,
                                                                          pageStep = 0.9,
                                                                          overflowY = 'visible',
                                                                          ...rest
                                                                      }) => {
    const { ref } = useHorizontalDragScroll<HTMLDivElement>({
        draggingClassName,
        enableShiftWheelX,
        preventDefaultOnMove: true,
        moveTolerance,
        mouseButton,
        ignoreFrom,
        overflowY,
        touchActionPanX: true,
    });

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!keyboard) return;
        const el = ref.current;
        if (!el) return;

        const w = el.clientWidth;
        const page = Math.max(1, Math.floor(w * pageStep));
        const step = Math.max(1, Math.floor(keyboardStep));

        switch (e.key) {
            case 'ArrowRight': el.scrollLeft += step; e.preventDefault(); break;
            case 'ArrowLeft':  el.scrollLeft -= step; e.preventDefault(); break;
            case 'PageDown':   el.scrollLeft += page; e.preventDefault(); break;
            case 'PageUp':     el.scrollLeft -= page; e.preventDefault(); break;
            case 'Home':       el.scrollLeft = 0; e.preventDefault(); break;
            case 'End':        el.scrollLeft = el.scrollWidth; e.preventDefault(); break;
        }
    }, [keyboard, pageStep, keyboardStep, ref]);

    return (
        <div
            ref={ref}
            tabIndex={keyboard ? 0 : -1}
            onKeyDown={keyboard ? onKeyDown : undefined}
            // по X — скроллим, по Y — оставляем видимым (sticky будет ориентироваться на ближайший vertical scroll-родитель)
            className={`scroll-container-slider ${className}`}
            {...rest}
        >
            {children}
        </div>
    );
};
