import React, { useEffect, useRef, useState } from 'react';

export type LoaderPhase = 'intro' | 'wait' | 'outro' | 'done';

type Props = {
    phase: LoaderPhase;
    onDone: () => void;       // вызвать ПОСЛЕ завершения анимации скрытия
    fadeOutMs?: number;       // длительность фейда при выходе (по умолчанию 700мс)
};

export default function AppLoader({ phase, onDone, fadeOutMs = 700 }: Props) {
    const [entered, setEntered] = useState(false); // для анимации входа
    const [fading, setFading] = useState(false);   // для анимации выхода
    const doneOnce = useRef(false);

    // Блокируем скролл, пока оверлей смонтирован
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    // Плавный вход
    useEffect(() => {
        const id = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(id);
    }, []);

    // Плавный выход → по завершении вызываем onDone
    useEffect(() => {
        if (phase !== 'outro' || doneOnce.current) return;
        doneOnce.current = true;
        // даём кадр, чтобы применились классы
        requestAnimationFrame(() => setFading(true));
        const t = setTimeout(onDone, fadeOutMs + 20);
        return () => clearTimeout(t);
    }, [phase, fadeOutMs, onDone]);

    if (phase === 'done') return null;

    return (
        <div
            className={[
                'fixed inset-0 z-[9999] flex items-center justify-center bg-primary',
                'transition-opacity',
                fading ? 'opacity-0' : 'opacity-100',
                // оставляем твои классы для совместимости со стилями
                'first-loader',
                entered ? 'first-loader-start' : '',
            ].join(' ')}
            style={{ transitionDuration: `${fadeOutMs}ms` }}
            aria-busy="true"
            aria-live="polite"
        >
            <div className="first-loader--inner">
                <div role="status" className="first-loader-status">
                    <svg
                        aria-hidden="true"
                        className="first-loader-svg"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766
                 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895
                 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50
                 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                            fill="rgb(var(--violet-300) / .3)"
                        />
                        <path
                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871
                 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025
                 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501
                 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642
                 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997
                 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                            fill="rgb(var(--violet-main))"
                        />
                    </svg>
                </div>

                <svg className="first-loader-logo m-auto" width="248px" height="107px" viewBox="0 0 248 107">
                    <g id="ЛОГО_00000177449795298483353820000001478038974088988551_">
                        <rect y="24" width="59.3" height="13.7" fill="rgb(var(--text-primary))"/>
                        <rect y="69.3" width="59.3" height="13.8" fill="rgb(var(--text-primary))"/>
                        <path d="M248,24h-18.1l-27.4,19.6V24h-13.8v29.5l-20,14.4c0,0-5.9,4.7-12.6,4.8l0,0c-10.5,0-19.1-8.6-19.1-19.1s8.6-19.1,19.1-19.1
                            c5.4,0,10.3,2.3,13.8,5.9l0,0l9.9-7.1c-5.7-6.7-14.2-10.9-23.7-10.9c-17.2,0-31.2,14-31.2,31.2c0,0.5,0,1.1,0,1.6c0,0,0,0,0,0.1
                            c0,0.2,0,0.4,0,0.7c0,0.1,0,0.2,0,0.3s0,0.2,0,0.3S109.1,68,109.1,68s-5.9,4.8-12.6,4.8c-10.5,0-19.1-8.6-19.1-19.1
                            S86,34.6,96.5,34.6c5.4,0,10.3,2.3,13.8,5.9l9.9-7.1c-5.7-6.7-14.2-10.9-23.7-10.9c-17.2,0-31.2,14-31.2,31.2s14,31.2,31.2,31.2
                            c6.9,0,13.4-2.3,18.5-6.1l13.5-10.2l0.2,0.4c3.2,5.6,8.1,10.2,14,13l0,0c0.9,0.4,1.8,0.8,2.8,1.1c0,0,0.1,0,0.1,0.1
                            c0.3,0.1,0.6,0.2,0.9,0.3c0,0,0,0,0.1,0c0.3,0.1,0.6,0.2,0.9,0.3h0.1c0.3,0.1,0.5,0.1,0.8,0.2c0.1,0,0.2,0,0.2,0.1
                            c0.3,0.1,0.5,0.1,0.8,0.2h0.1c0.3,0.1,0.6,0.1,0.9,0.2c0.1,0,0.2,0,0.2,0c0.2,0,0.5,0.1,0.7,0.1h0.3c0.3,0,0.6,0.1,0.8,0.1h0.1
                            c0.3,0,0.6,0.1,1,0.1c0.1,0,0.2,0,0.3,0c0.2,0,0.5,0,0.7,0c0.1,0,0.2,0,0.3,0c0.3,0,0.6,0,1,0l0,0l0,0c6.9,0,13.3-2.3,18.5-6.1
                            L188.7,68v15h13.8V63.5L229.7,83H248v-1.4l-39.1-28.1l39.1-28V24z" fill="rgb(var(--text-primary))" />
                    </g>
                </svg>
            </div>

            {/* Для скринридеров */}
            <span className="sr-only">Загрузка…</span>
        </div>
    );
}
