import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";

/* ====================== types ====================== */

type Product = {
    id: number | string;
    title: string;
    category?: string;
    brand?: string; // вендор
    sku?: string; // артикул
    rating?: number; // оценка
    price?: number; // цена
    thumbnail?: string;
};

type ProductsResponse = {
    products: Product[];
    total: number;
    skip: number;
    limit: number;
};

const BASE = "https://dummyjson.com";
const LIMIT = 20;

type SortKeyUI = "title" | "brand" | "sku" | "rating" | "price";
type SortDir = "asc" | "desc";

/* ====================== api ====================== */

function buildUrl(opts: { q: string; page: number; sortBy?: SortKeyUI; order?: SortDir }) {
    const skip = Math.max(0, (opts.page - 1) * LIMIT);
    const select = ["title", "category", "brand", "sku", "rating", "price", "thumbnail"].join(",");

    const p = new URLSearchParams();
    p.set("limit", String(LIMIT));
    p.set("skip", String(skip));
    p.set("select", select);

    if (opts.sortBy) p.set("sortBy", opts.sortBy);
    if (opts.order) p.set("order", opts.order);

    if (opts.q) {
        p.set("q", opts.q);
        return `${BASE}/products/search?${p.toString()}`;
    }

    return `${BASE}/products?${p.toString()}`;
}

async function fetchProducts(opts: { q: string; page: number; sortBy?: SortKeyUI; order?: SortDir }) {
    const url = buildUrl(opts);

    const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
    });

    const ct = res.headers.get("content-type") || "";
    const data = /\bjson\b/i.test(ct) ? await res.json() : await res.text();

    if (!res.ok) {
        const msg =
            typeof data === "string"
                ? data
                : (data as any)?.message || `Ошибка загрузки (${res.status})`;
        throw new Error(msg);
    }

    return data as ProductsResponse;
}

/* ====================== helpers ====================== */

function fmtPriceRUB(v: number | undefined) {
    const n = typeof v === "number" && Number.isFinite(v) ? v : 0;
    // макетный формат: "48 652,00"
    return new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
}

function fmtRating(v: number | undefined) {
    const n = typeof v === "number" && Number.isFinite(v) ? v : 0;
    return `${n.toFixed(1)}/5`;
}

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}

/* ====================== small UI (icons) ====================== */

function IconSearch(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <path
                d="M16.5 16.5 21 21"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

function IconRefresh(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path
                d="M20 12a8 8 0 0 1-14.7 4.3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <path
                d="M4 12a8 8 0 0 1 14.7-4.3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <path
                d="M8 16H5v3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 8h3V5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconPlus(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function IconDots(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path
                d="M6.5 12h.01M12 12h.01M17.5 12h.01"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
            />
        </svg>
    );
}

function IconChevronLeft(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path
                d="M14.5 6 9 12l5.5 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconChevronRight(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path
                d="M9.5 6 15 12l-5.5 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconCheck(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path
                d="M6 12.5 10.2 16.5 18 8.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconMinus(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path d="M6.5 12h11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
    );
}

function ProgressBar({ active }: { active: boolean }) {
    return (
        <div className="h-[3px] w-full bg-transparent">
            <div
                className={[
                    "h-full bg-[#242EDB] transition-[width,opacity] duration-200",
                    active ? "w-[70%] opacity-100" : "w-0 opacity-0",
                ].join(" ")}
            />
        </div>
    );
}

/* ====================== primitives ====================== */

type ToastState = { open: boolean; text: string; variant?: "default" | "error" };

function Toast({ state, onClose }: { state: ToastState; onClose: () => void }) {
    if (!state.open) return null;
    return (
        <div className="fixed z-[99999] right-6 bottom-6">
            <div
                className={[
                    "min-w-[260px] max-w-[420px]",
                    "rounded-[14px] px-4 py-3 shadow-[0_10px_26px_rgba(0,0,0,0.18)]",
                    state.variant === "error" ? "bg-red-600 text-white" : "bg-[#111827] text-white",
                ].join(" ")}
                role="status"
            >
                <div className="text-[14px] leading-[18px]">{state.text}</div>
                <button
                    onClick={onClose}
                    className="mt-2 text-[12px] opacity-80 hover:opacity-100 underline underline-offset-2"
                >
                    Закрыть
                </button>
            </div>
        </div>
    );
}

function ModalShell(props: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
    if (!props.open) return null;
    return (
        <div className="fixed inset-0 z-[99998]">
            <div
                className="absolute inset-0 bg-black/50"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) props.onClose();
                }}
            />
            <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="w-full max-w-[560px] rounded-[20px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
                    <div className="px-6 py-5 border-b border-black/10 flex items-center justify-between">
                        <div className="text-[18px] font-semibold text-black/90">{props.title}</div>
                        <button
                            onClick={props.onClose}
                            className="h-9 w-9 rounded-[10px] grid place-items-center hover:bg-black/5"
                            aria-label="Закрыть"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="p-6">{props.children}</div>
                </div>
            </div>
        </div>
    );
}

function Checkbox(props: {
    checked: boolean;
    indeterminate?: boolean;
    onChange: (checked: boolean) => void;
    ariaLabel?: string;
}) {
    const { checked, indeterminate = false } = props;

    return (
        <button
            type="button"
            aria-label={props.ariaLabel}
            aria-checked={indeterminate ? "mixed" : checked}
            role="checkbox"
            onClick={() => props.onChange(!checked)}
            className="inline-flex"
        >
      <span
          className={[
              "relative grid place-items-center",
              "h-[22px] w-[22px] rounded-[4px]",
              "border border-[#E1E4EA] bg-white",
              "transition-colors",
              checked || indeterminate ? "bg-[#3C538E] border-[#3C538E]" : "",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#242EDB]/35",
          ].join(" ")}
      >
        <span className={checked || indeterminate ? "opacity-100" : "opacity-0"}>
          {indeterminate ? <IconMinus className="h-[14px] w-[14px] text-white" /> : null}
        </span>
      </span>
        </button>
    );
}

/* ====================== Page ====================== */

const ProductsPage = observer(function ProductsPage() {
    const [sp, setSp] = useSearchParams();

    const q = (sp.get("q") || "").trim();
    const page = clamp(Number(sp.get("page") || "1") || 1, 1, 9999);

    const sortBy = (sp.get("sortBy") as SortKeyUI) || undefined;
    const order = (sp.get("order") as SortDir) || "asc";

    // UI state
    const [qInput, setQInput] = useState(q);
    const debounceRef = useRef<number | null>(null);

    const [selected, setSelected] = useState<Record<string, boolean>>({});

    const [toastState, setToastState] = useState<ToastState>({ open: false, text: "" });
    const toastTimerRef = useRef<number | null>(null);

    const showToast = useCallback((text: string, variant: ToastState["variant"] = "default") => {
        setToastState({ open: true, text, variant });
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => {
            setToastState((s) => ({ ...s, open: false }));
        }, 2500);
    }, []);

    // local added products (без API)
    const [localAdded, setLocalAdded] = useState<Product[]>([]);
    const [addOpen, setAddOpen] = useState(false);
    const [fTitle, setFTitle] = useState("");
    const [fPrice, setFPrice] = useState("");
    const [fBrand, setFBrand] = useState("");
    const [fSku, setFSku] = useState("");

    useEffect(() => setQInput(q), [q]);

    const { data, error, isFetching, isLoading, refetch } = useQuery({
        queryKey: ["products", q, page, sortBy, order],
        queryFn: () => fetchProducts({ q, page, sortBy, order }),
        placeholderData: keepPreviousData,
        staleTime: 15_000,
        retry: false,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (error) showToast((error as any)?.message || "Ошибка загрузки", "error");
    }, [error, showToast]);

    const remote = data?.products ?? [];
    const total = data?.total ?? 0;
    const from = total ? (page - 1) * LIMIT + 1 : 0;
    const to = total ? Math.min(page * LIMIT, total) : 0;

    // локальные показываем в списке тоже (и фильтруем поиском локально)
    const localFiltered = useMemo(() => {
        if (!localAdded.length) return [];
        if (!q) return localAdded;
        const qq = q.toLowerCase();
        return localAdded.filter((p) => p.title.toLowerCase().includes(qq));
    }, [localAdded, q]);

    const rows = useMemo(() => {
        // как правило — локальные сверху (как “добавленные”)
        return [...localFiltered, ...remote];
    }, [localFiltered, remote]);

    const pagesCount = Math.max(1, Math.ceil(total / LIMIT));

    const pageButtons = useMemo(() => {
        // как на макете: 1..5 (или меньше)
        const max = Math.min(5, pagesCount);
        return Array.from({ length: max }, (_, i) => i + 1);
    }, [pagesCount]);

    const patch = useCallback(
        (next: Record<string, string | null>) => {
            // берём актуальные params, чтобы не ловить “stale sp”
            const copy = new URLSearchParams(window.location.search);
            for (const [k, v] of Object.entries(next)) {
                if (!v) copy.delete(k);
                else copy.set(k, v);
            }
            setSp(copy, { replace: true });
        },
        [setSp]
    );

    const setSort = useCallback(
        (key: SortKeyUI) => {
            const nextOrder: SortDir = sortBy === key ? (order === "asc" ? "desc" : "asc") : "asc";
            patch({ sortBy: key, order: nextOrder, page: "1" });
        },
        [sortBy, order, patch]
    );

    const goPage = useCallback(
        (p: number) => {
            patch({ page: String(clamp(p, 1, pagesCount)) });
        },
        [pagesCount, patch]
    );

    const toggleAll = useCallback(
        (checked: boolean) => {
            const next: Record<string, boolean> = { ...selected };
            rows.forEach((p) => {
                next[String(p.id)] = checked;
            });
            setSelected(next);
        },
        [rows, selected]
    );

    const toggleOne = useCallback((id: string, checked: boolean) => {
        setSelected((prev) => ({ ...prev, [id]: checked }));
    }, []);

    const allChecked = rows.length > 0 && rows.every((p) => !!selected[String(p.id)]);
    const someChecked = rows.some((p) => !!selected[String(p.id)]);

    // debounce search -> API
    useEffect(() => {
        window.clearTimeout(debounceRef.current || undefined);
        debounceRef.current = window.setTimeout(() => {
            patch({ q: qInput.trim() || null, page: "1" });
        }, 350);

        return () => window.clearTimeout(debounceRef.current || undefined);
    }, [qInput, patch]);

    function openAdd() {
        setFTitle("");
        setFPrice("");
        setFBrand("");
        setFSku("");
        setAddOpen(true);
    }

    function submitAdd(e: React.FormEvent) {
        e.preventDefault();

        const title = fTitle.trim();
        const brand = fBrand.trim();
        const sku = fSku.trim();
        const price = Number(String(fPrice).replace(",", "."));

        if (!title) return showToast("Введите Наименование", "error");
        if (!brand) return showToast("Введите Вендор", "error");
        if (!sku) return showToast("Введите Артикул", "error");
        if (!Number.isFinite(price) || price <= 0) return showToast("Введите корректную цену", "error");

        const item: Product = {
            id: `local_${Date.now()}`,
            title,
            brand,
            sku,
            price,
            rating: 0, // чтобы подсветка <3 сработала
            category: "—",
            thumbnail: "",
        };

        setLocalAdded((prev) => [item, ...prev]);
        setAddOpen(false);
        showToast("Товар добавлен");
    }


    const thCls = "text-[14px] font-medium text-[#B7BBC6] px-4 py-4 select-none";
    const tdCls = "px-4 py-[16px] text-[14px] text-black/80 border-t border-[#ECEEF2]";

    const thAlign = (align: "left" | "center" | "right" = "left") =>
        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

    const tdAlign = (align: "left" | "center" | "right" = "left") =>
        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

    const clickableTh = (
        active: boolean,
        align: "left" | "center" | "right" = "left"
    ) =>
        [
            thCls,
            thAlign(align),
            "cursor-pointer hover:text-black/60",
            active ? "text-black/55" : "",
        ].join(" ");

    return (
        <div className="min-h-screen bg-[#F5F6FA]">
            {/* Top header */}
            <div className="bg-white px-8 py-8 flex items-center my-[30px] gap-8">
                <div className="text-[24px] font-semibold text-black/90">Товары</div>

                <div className="flex-1">
                    <div className="mx-auto max-w-[980px]">
                        <div className="h-[56px] rounded-[14px] bg-[#F2F3F5] px-4 flex items-center gap-3">
                            <IconSearch className="h-5 w-5 text-black/30" />
                            <input
                                value={qInput}
                                onChange={(e) => setQInput(e.target.value)}
                                placeholder="Найти"
                                className="flex-1 bg-transparent outline-none text-[15px] text-black/80 placeholder:text-black/30"
                            />
                        </div>
                    </div>
                </div>

                <div className="w-[120px]" />
            </div>

            {/* Content card */}
            <div className="bg-white px-8 py-8">
                <div className="flex items-center justify-between">
                    <div className="text-[20px] font-semibold text-black/85">Все позиции</div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className="h-[44px] w-[44px] rounded-[12px] border border-[#E6E8EE] grid place-items-center hover:bg-black/5"
                            aria-label="Обновить"
                        >
                            <IconRefresh className="h-5 w-5 text-black/50" />
                        </button>

                        <button
                            onClick={openAdd}
                            className="h-[44px] rounded-[12px] bg-[#242EDB] px-5 text-white font-semibold text-[14px] flex items-center gap-3 hover:bg-[#1f28c8]"
                        >
                <span className="h-6 w-6 rounded-full border border-white/35 grid place-items-center">
                  <IconPlus className="h-4 w-4 text-white" />
                </span>
                            Добавить
                        </button>
                    </div>
                </div>

                <div className="mt-5">
                    <ProgressBar active={isFetching || isLoading} />
                </div>

                {/* Table */}
                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-[1100px] w-full">
                        <colgroup>
                            <col className="w-[60px]" />
                            <col />
                            <col className="w-[220px]" />
                            <col className="w-[220px]" />
                            <col className="w-[160px]" />
                            <col className="w-[200px]" />
                            <col className="w-[170px]" />
                        </colgroup>

                        <thead>
                        <tr>
                            <th className={[thCls, "w-[60px]"].join(" ")}>
                                <Checkbox
                                    ariaLabel="Выбрать все"
                                    checked={allChecked}
                                    indeterminate={!allChecked && someChecked}
                                    onChange={(v) => toggleAll(v)}
                                />
                            </th>

                            <th className={clickableTh(sortBy === "title", "left")} onClick={() => setSort("title")}>
                                Наименование
                            </th>

                            <th className={clickableTh(sortBy === "brand", "center")} onClick={() => setSort("brand")}>
                                Вендор
                            </th>

                            <th className={clickableTh(sortBy === "sku", "center")} onClick={() => setSort("sku")}>
                                Артикул
                            </th>

                            <th className={clickableTh(sortBy === "rating", "center")} onClick={() => setSort("rating")}>
                                Оценка
                            </th>

                            <th className={clickableTh(sortBy === "price", "center")} onClick={() => setSort("price")}>
                                Цена, ₽
                            </th>

                            <th className={[thCls, thAlign("right")].join(" ")} />

                            <th className={[thCls, "text-right"].join(" ")} />
                        </tr>
                        </thead>

                        <tbody>
                        {rows.map((p) => {
                            const id = String(p.id);
                            const checked = !!selected[id];
                            const rating = typeof p.rating === "number" ? p.rating : 0;
                            const ratingLow = rating < 3;

                            return (
                                <tr className={["bg-white", "hover:bg-black/[0.02]"].join(" ")}>
                                    <td className={[tdCls, "w-[60px]"].join(" ")}>
                                        <Checkbox
                                            ariaLabel="Выбрать строку"
                                            checked={checked}
                                            onChange={(v) => toggleOne(id, v)}
                                        />
                                    </td>

                                    <td className={[tdCls, tdAlign("left")].join(" ")}>
                                        <div className="flex items-center gap-4">
                                            {/* preview 48x48 r=8 fill C4C4C4 stroke */}
                                            <div className="h-[48px] w-[48px] rounded-[8px] bg-[#C4C4C4] border border-[#E6E8EE] overflow-hidden flex-shrink-0">
                                                {p.thumbnail ? (
                                                    <img
                                                        src={p.thumbnail}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : null}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="font-semibold text-black/90 truncate">{p.title}</div>
                                                <div className="text-[13px] text-black/35 truncate">{p.category || "—"}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className={[tdCls, tdAlign("center")].join(" ")}>
                                        <span className="font-semibold text-black/90">{p.brand || "—"}</span>
                                    </td>

                                    <td className={[tdCls, tdAlign("center")].join(" ")}>
                                        <span className="text-black/80">{p.sku || "—"}</span>
                                    </td>

                                    <td className={[tdCls, tdAlign("center")].join(" ")}>
                                        <span className={ratingLow ? "text-red-500" : "text-black/80"}>
                                          {fmtRating(rating)}
                                        </span>
                                    </td>

                                    <td className={[tdCls, tdAlign("center")].join(" ")}>
                                        <span className="font-medium text-black/80 tabular-nums">
                                          {fmtPriceRUB(p.price)}
                                        </span>
                                    </td>

                                    <td className={[tdCls, "text-right"].join(" ")}>
                                        {/* actions: 133x32, gap 10 */}
                                        <div className="ml-auto h-[32px] w-fit flex items-center justify-end gap-[10px]">
                                            {/* plus: 54x30 */}
                                            <button
                                                className="h-[30px] w-[54px] rounded-[999px] bg-[#242EDB] text-white grid place-items-center hover:bg-[#1f28c8]"
                                                aria-label="Действие"
                                                onClick={() => showToast("Действие (пока заглушка)")}
                                            >
                                                <IconPlus className="h-[16px] w-[16px]" />
                                            </button>

                                            {/* dots: 30x30 */}
                                            <button
                                                className="h-[30px] w-[30px] rounded-full border border-[#D8DCE5] grid place-items-center text-black/45 hover:bg-black/5"
                                                aria-label="Меню"
                                                onClick={() => showToast("Меню (пока заглушка)")}
                                            >
                                                <IconDots className="h-[18px] w-[18px] text-black/45" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {!isLoading && rows.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-black/45">
                                    Ничего не найдено
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: "Показано..." + pagination */}
                <div className="mt-6 flex items-center justify-between">
                    <div className="text-[14px] text-black/35">
                        Показано {from}-{to} из {total}
                    </div>

                    <div className="flex items-center gap-[10px]">
                        <button
                            onClick={() => goPage(page - 1)}
                            disabled={page <= 1}
                            className={[
                                "h-[30px] w-[30px] grid place-items-center rounded-[6px]",
                                page <= 1 ? "opacity-40" : "hover:bg-black/5",
                            ].join(" ")}
                            aria-label="Назад"
                        >
                            <IconChevronLeft className="h-4 w-4 text-black/55" />
                        </button>

                        <div className="flex items-center gap-[10px]">
                            {pageButtons.map((pnum) => {
                                const active = pnum === page;
                                return (
                                    <button
                                        key={pnum}
                                        onClick={() => goPage(pnum)}
                                        className={[
                                            "h-[30px] w-[30px] rounded-[4px] text-[14px] font-medium",
                                            active
                                                ? "bg-[#797FEA] text-white"
                                                : "bg-white text-black/35 border border-[#E6E8EE] hover:bg-black/5",
                                        ].join(" ")}
                                    >
                                        {pnum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => goPage(page + 1)}
                            disabled={page >= pagesCount}
                            className={[
                                "h-[30px] w-[30px] grid place-items-center rounded-[6px]",
                                page >= pagesCount ? "opacity-40" : "hover:bg-black/5",
                            ].join(" ")}
                            aria-label="Вперёд"
                        >
                            <IconChevronRight className="h-4 w-4 text-black/55" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Add modal */}
            <ModalShell open={addOpen} title="Добавить товар" onClose={() => setAddOpen(false)}>
                <form onSubmit={submitAdd} className="space-y-4">
                    <div>
                        <div className="text-[13px] font-medium text-black/60">Наименование</div>
                        <input
                            value={fTitle}
                            onChange={(e) => setFTitle(e.target.value)}
                            className="mt-2 h-[44px] w-full rounded-[12px] border border-black/10 px-4 outline-none focus:border-black/25"
                            placeholder="Например: USB флэшка 16GB"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <div className="text-[13px] font-medium text-black/60">Цена</div>
                            <input
                                value={fPrice}
                                onChange={(e) => setFPrice(e.target.value)}
                                inputMode="decimal"
                                className="mt-2 h-[44px] w-full rounded-[12px] border border-black/10 px-4 outline-none focus:border-black/25"
                                placeholder="48652"
                            />
                        </div>

                        <div>
                            <div className="text-[13px] font-medium text-black/60">Вендор</div>
                            <input
                                value={fBrand}
                                onChange={(e) => setFBrand(e.target.value)}
                                className="mt-2 h-[44px] w-full rounded-[12px] border border-black/10 px-4 outline-none focus:border-black/25"
                                placeholder="Samsung"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="text-[13px] font-medium text-black/60">Артикул</div>
                        <input
                            value={fSku}
                            onChange={(e) => setFSku(e.target.value)}
                            className="mt-2 h-[44px] w-full rounded-[12px] border border-black/10 px-4 outline-none focus:border-black/25"
                            placeholder="RCH45Q1A"
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setAddOpen(false)}
                            className="h-[44px] rounded-[12px] px-5 border border-black/10 hover:bg-black/5 text-[14px] font-medium"
                        >
                            Отмена
                        </button>

                        <button
                            type="submit"
                            className="h-[44px] rounded-[12px] px-5 bg-[#242EDB] text-white text-[14px] font-semibold hover:bg-[#1f28c8]"
                        >
                            Сохранить
                        </button>
                    </div>
                </form>
            </ModalShell>

            {/* Toast */}
            <Toast state={toastState} onClose={() => setToastState((s) => ({ ...s, open: false }))} />
        </div>
    );
});

export default ProductsPage;
