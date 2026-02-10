export function formDataToJSON(fd: FormData, defaults?: Record<string, any>) {
    const out: Record<string, any> = { ...(defaults || {}) };
    const arrays: Record<string, any[]> = {};

    fd.forEach((value, key) => {
        if (key.endsWith('[]')) {
            const k = key.slice(0, -2);
            (arrays[k] ??= []).push(value);
            return;
        }
        if (value === 'on') { out[key] = true; return; }
        if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) {
            out[key] = Number(value);
            return;
        }
        out[key] = value;
    });

    Object.entries(arrays).forEach(([k, arr]) => (out[k] = arr));
    return out;
}
