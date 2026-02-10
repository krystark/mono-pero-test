// @krystark/app-common/src/excel/saveExcel.ts
type RowObj = Record<string, any>;

export type ColumnSpec<T extends RowObj = RowObj> = {
    key?: keyof T | string;
    title?: string;
    width?: number;
    fmt?: string;
    map?: (value: any, row: T, rowIndex: number) => any;
};

export type GroupHeader = {
    title: string;
    from: number; // 0-based
    to: number;   // 0-based inclusive
};

export type SheetSpec<T extends RowObj = RowObj> = {
    name?: string;
    rows: T[] | any[][];
    columns?: ColumnSpec<T>[];
    header?: string[];
    groupHeaders?: GroupHeader[];
    merges?: Array<[r1: number, c1: number, r2: number, c2: number]>;
    stripHtml?: boolean;
    autoFit?: boolean;
};

export type ExportOptions = {
    fileName: string;
    sheets: SheetSpec | SheetSpec[];
};

export type CsvOptions = {
    fileName: string;
    rows: any[][]; // AoA
    header?: string[];
};

const RE_HTML = /<\/?[^>]+(>|$)/g;
const stripHtml = (v: any) => (typeof v === 'string' ? v.replace(RE_HTML, '') : v);

const safeName = (name: string) =>
    (name || 'export').replace(/[\\/:*?"<>|]/g, ' ').trim();

const strWidth = (v: any) => {
    if (v == null) return 0;
    return Math.min(Math.max(String(v).length, 3), 80);
};

export async function saveExcel(opts: ExportOptions) {
    const XLSX = await import('xlsx'); // не попадает в initial bundle
    const sheets = Array.isArray(opts.sheets) ? opts.sheets : [opts.sheets];
    const wb = XLSX.utils.book_new();

    for (const sheet of sheets) {
        const {
            name = 'Sheet1',
            rows,
            columns,
            header,
            merges = [],
            groupHeaders,
            stripHtml: needStrip = true,
            autoFit = true,
        } = sheet;

        let aoa: any[][];

        // Нормализация в AoA
        if (Array.isArray(rows) && rows.length && !Array.isArray(rows[0])) {
            const sample = rows[0] as RowObj;

            const cols: ColumnSpec<RowObj>[] = (columns && columns.length
                    ? columns
                    : (Object.keys(sample) as Array<keyof RowObj | string>).map((k) => ({
                        key: k,
                        title: String(k),
                    }))
            ) as ColumnSpec<RowObj>[];

            const head = cols.map((c) => (needStrip ? stripHtml(c.title ?? String(c.key)) : (c.title ?? String(c.key))));
            aoa = [head];

            (rows as RowObj[]).forEach((r, ri) => {
                const line = cols.map((c) => {
                    const raw = c.key == null ? undefined : (r as any)[c.key as string];
                    const mapped = c.map ? c.map(raw, r, ri) : raw;  // ← больше не ругается
                    return needStrip ? stripHtml(mapped) : mapped;
                });
                aoa.push(line);
            });

            if (groupHeaders?.length) {
                const grpRow: any[] = new Array(head.length).fill('');
                groupHeaders.forEach(g => {
                    grpRow[g.from] = needStrip ? stripHtml(g.title) : g.title;
                    merges.push([0, g.from, 0, g.to]);
                });
                aoa = [grpRow, head, ...aoa.slice(1)];
            }
        } else {
            // rows: AoA
            aoa = rows as any[][];
            if (header?.length) aoa = [(needStrip ? header.map(stripHtml) : header), ...aoa];
            if (groupHeaders?.length) {
                const columnsCount = Math.max(...aoa.map(r => r.length));
                const grpRow: any[] = new Array(columnsCount).fill('');
                groupHeaders.forEach(g => {
                    grpRow[g.from] = needStrip ? stripHtml(g.title) : g.title;
                    merges.push([0, g.from, 0, g.to]);
                });
                aoa = [grpRow, ...aoa];
            }
        }

        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // Форматы колонок (если были объекты и columns с fmt)
        if (Array.isArray(rows) && rows.length && !Array.isArray(rows[0]) && columns?.length) {
            const headerRowIdx = (sheet.groupHeaders?.length ? 1 : 0);
            const dataStartRow = headerRowIdx + 1;
            const range = XLSX.utils.decode_range(ws['!ref'] as string);

            columns.forEach((c, ci) => {
                if (!c.fmt) return;
                for (let r = dataStartRow; r <= range.e.r; r++) {
                    const addr = XLSX.utils.encode_cell({ r, c: ci });
                    const cell = ws[addr];
                    if (!cell) continue;
                    cell.z = c.fmt;
                    if (typeof cell.v === 'number') cell.t = 'n';
                }
            });
        }

        if (merges.length) {
            ws['!merges'] = (ws['!merges'] || []).concat(
                merges.map(([r1, c1, r2, c2]) => ({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } }))
            );
        }

        if (autoFit || columns?.some(c => c.width)) {
            const range = XLSX.utils.decode_range(ws['!ref'] as string);
            const widths: number[] = new Array(range.e.c - range.s.c + 1).fill(10);

            columns?.forEach((c, i) => { if (c.width) widths[i] = c.width; });

            for (let C = range.s.c; C <= range.e.c; ++C) {
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const addr = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[addr];
                    if (!cell || cell.v == null) continue;
                    widths[C] = Math.max(widths[C], strWidth(cell.v));
                }
            }
            ws['!cols'] = widths.map(wch => ({ wch }));
        }

        XLSX.utils.book_append_sheet(wb, ws, name);
    }

    const outName = `${safeName(opts.fileName)}.xlsx`;
    // Безопаснее и конкретнее для XLSX:
    if (typeof window !== 'undefined') {
        // в браузере
        (await import('xlsx')).writeFileXLSX(wb, outName);
    } else {
        // SSR/Node: ничего не делаем, можно вернуть Buffer через write
        // но это уже вне зоны фронтового helper-а
        console.warn('[saveExcel] Skipped (non-browser environment).');
    }
}

export async function saveCSV(opts: CsvOptions) {
    const XLSX = await import('xlsx');
    const { rows, header, fileName } = opts;
    let aoa = rows;
    if (header?.length) aoa = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const csv = XLSX.utils.sheet_to_csv(ws);
    if (typeof window === 'undefined') {
        console.warn('[saveCSV] Skipped (non-browser environment).');
        return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName(fileName)}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}
