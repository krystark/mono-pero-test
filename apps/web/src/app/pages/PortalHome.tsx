// pages/PortalHome.tsx
import * as React from 'react';
import {toast, toastError, useApiQuery} from '@krystark/app-common';
import { getEnv } from '@krystark/app-kernel';
import { bxUrl } from '@krystark/app-common';
import {Button} from "@krystark/ui-kit-components";

// ==== Типы ====
type BxFeedItem = {
    id: number;
    createdAt: string;
    eventId: string;
    title: string;
    text?: string | null;
    message?: string | null;
    url: string;
    authorId?: number | null;
    entityType?: string;
    entityId?: number;
};

type BxFeedResponse = {
    ok: boolean;
    meta?: Record<string, any>;
    data?: BxFeedItem[];
    error?: { message?: string } | null;
};

// ==== Текстовые утилиты ====
const decodeEntities = (str?: string | null): string => {
    if (!str) return '';
    // в браузере — надёжно декодируем
    if (typeof window !== 'undefined') {
        const el = document.createElement('textarea');
        el.innerHTML = str;
        return el.value;
    }
    // SSR-фолбэк на самые частые
    return str
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&#91;/g, '[')
        .replace(/&#93;/g, ']');
};

const toPlain = (raw?: string | null): string => {
    const s = decodeEntities(raw ?? '');
    return s
        // bbcode в квадратных скобках
        .replace(/\[(?:\/)?[^\]]+\]/g, ' ')
        // html-теги
        .replace(/<[^>]+>/g, ' ')
        // emoji-хексы вида :f09f8ea5:
        .replace(/:f[0-9a-f]{7}:/gi, ' ')
        // url-теги вида [URL=...]...[/URL] могли остаться — добьём
        .replace(/https?:\/\/\S+/gi, ' ')
        // кавычки-«сахар»
        .replace(/[«»“”]/g, '"')
        // множественные пробелы/переводы
        .replace(/\r?\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
};

const excerpt = (s: string, max = 140): string => {
    if (!s) return '';
    if (s.length <= max) return s;
    const cut = s.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut) + '…';
};

const formatDate = (iso?: string) => {
    try {
        if (!iso) return '';
        return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return ''; }
};

// ==== Скелетон карточки ====
const CardSkeleton: React.FC = () => (
    <div className="rounded-lg border border-secondary overflow-hidden bg-primary">
        <div className="aspect-[16/9] bg-secondary/20 animate-pulse" />
        <div className="p-4 border-t border-secondary">
            <div className="h-4 w-28 bg-secondary/40 rounded mb-2 animate-pulse" />
            <div className="h-6 w-3/4 bg-secondary/40 rounded mb-2 animate-pulse" />
            <div className="h-4 w-5/6 bg-secondary/30 rounded animate-pulse" />
        </div>
    </div>
);

// ==== Плейсхолдер (показываем ТОЛЬКО если вообще нет карточек) ====
const EmptyBlock: React.FC<{ message?: string }> = ({ message }) => (
    <div className="rounded-lg border border-secondary bg-primary p-6 text-secondary">
        {message ?? 'Пока нет важных новостей.'}
    </div>
);

// ==== Карточка новости ====
const NewsCard: React.FC<{ item: BxFeedItem; idx?: number }> = ({ item, idx = 0 }) => {
    const env = getEnv() as any;
    const abs = env?.VITE_BX_WEB_URL ? `${env.VITE_BX_WEB_URL}${item.url}` : bxUrl(item.url);

    const title = excerpt(toPlain(item.title), 90);
    const desc  = excerpt(toPlain(item.text || item.message || ''), 150);

    // цикл по 3 изображениям (/img/news/1.jpg, /img/news/2.jpg, /img/news/3.jpg)
    const base = (env?.VITE_PATH_URL ?? '/').replace(/\/+$/, ''); // без завершающего слеша
    const coverNum = (idx % 3) + 1;
    const coverUrl = `${base}/img/news/${coverNum}.png`;

    return (
        <a
            href={abs}
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative h-[425px] rounded overflow-hidden bg-primary border border-secondary"
        >
            {/* MEDIA: фон-картинка, сжимается по нижней границе при hover */}
            <div
                className="
          absolute inset-x-0 top-0 bottom-[100px]
          group-hover:bottom-[132px]
          transition-[bottom] duration-300 ease-out
        "
            >
                <div
                    className="absolute inset-0 bg-center bg-cover"
                    style={{ backgroundImage: `url(${coverUrl})` }}
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            </div>

            {/* БЕЛАЯ ПОДЛОЖКА (контент) — фикс внизу, 100 → 132 на hover */}
            <div
                className="
          absolute inset-x-0 bottom-0
          h-[100px] group-hover:h-[132px]
          transition-[height] duration-300 ease-out
          bg-primary border-t border-secondary
        "
            >
                <div className="px-[24px] py-[16px] h-full flex flex-col">
                    <div className="text-t3 leading-tight line-clamp-1">{title}</div>
                    {desc && <p className="text-secondary line-clamp-1 mt-[6px]">{desc}</p>}

                    {/* META: показывает на hover, место даёт рост высоты подложки */}
                    <div
                        className="
              mt-auto flex items-center justify-between text-body-s text-secondary
              opacity-0 translate-y-1
              transition-[opacity,transform] duration-300 ease-out
              group-hover:opacity-100 group-hover:translate-y-0
              pointer-events-none
            "
                    >
                        <span>Битрикс24</span>
                        <span>{formatDate(item.createdAt)}</span>
                    </div>
                </div>
            </div>
        </a>
    );
};


// ==== Колонка по количеству ====
const colCls = (count: number) => {
    if (count <= 1) return 'desktop:col-span-12';
    if (count === 2) return 'desktop:col-span-6';
    return 'desktop:col-span-4';
};

export default function PortalHome() {
    const env = getEnv() as any;
    const FEED_URL: string = env?.VITE_BX_FEED_URL || `${env?.VITE_BX_API_URL || ''}/portal/news/`;

    const { data, isLoading, isError, error } = useApiQuery<BxFeedResponse>(
        ['bx-feed', 'important', FEED_URL],
        FEED_URL,
    );

    const important = data?.data ?? [];

    const cards = important.slice(0, 3); // максимум 3

    return (
        <div className="space-y-4">
            <h2 className="text-t1">Новости</h2>

            {/* ГРИД: в десктопе в один ряд */}
            <div className="grid grid-cols-12 gap-4">
                {isLoading ? (
                    <>
                        <div className="col-span-12 desktop:col-span-4"><CardSkeleton /></div>
                        <div className="col-span-12 desktop:col-span-4"><CardSkeleton /></div>
                        <div className="col-span-12 desktop:col-span-4"><CardSkeleton /></div>
                    </>
                ) : cards.length === 0 ? (
                    <div className="col-span-12">
                        <EmptyBlock message={isError ? String((error as any)?.message ?? 'Ошибка загрузки новостей.') : undefined} />
                    </div>
                ) : (
                    cards.map((it, i, arr) => (
                        <div
                            key={it.id}
                            className={[
                                'col-span-12 tablet:col-span-6',
                                colCls(arr.length),
                                arr.length % 2 === 1 && i === 0 ? 'tablet:col-span-12' : '',
                            ].join(' ')}
                        >
                            <NewsCard item={it} idx={i} />
                        </div>
                    ))
                )}
            </div>

            {/* TODO включить как будет доработан БЭК - Избранные сервисы — как было
            <section className="rounded border border-secondary bg-primary p-4">
                <div className="flex flex-col tablet:flex-row items-start tablet:items-center justify-between gap-4">
                    <div>
                        <div className="text-t2 mb-1">Избранные сервисы</div>
                        <p className="caption-1 text-secondary">
                            Добавьте нужные разделы для быстрого доступа
                        </p>
                    </div>

                    <Button className="self-start tablet:self-auto" size="md" variant="primary" onClick={() => toastError('Функция в разработке')}>
                        Выбрать сервисы
                    </Button>
                </div>
            </section> */}
        </div>
    );
}
