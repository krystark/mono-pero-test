let mutations = 0;
let lastTs = 0;

export function markRegistryMutation() {
    mutations += 1;
    lastTs =
        typeof performance !== "undefined" && performance.now
            ? performance.now()
            : Date.now();
}

function getRegistryState() {
    return { mutations, lastTs };
}

export async function waitForKernelIdle(opts?: { quietMs?: number; maxMs?: number }) {
    const quietMs = opts?.quietMs ?? 0;
    const maxMs = opts?.maxMs ?? 2000;

    const start = Date.now();

    await Promise.resolve();
    await new Promise<void>((r) =>
        typeof requestAnimationFrame !== "undefined"
            ? requestAnimationFrame(() => r())
            : setTimeout(r, 0),
    );

    let { mutations: seen, lastTs: last } = getRegistryState();

    while (true) {
        await new Promise<void>((r) =>
            typeof requestAnimationFrame !== "undefined"
                ? requestAnimationFrame(() => r())
                : setTimeout(r, 16),
        );

        const now = Date.now();
        const { mutations: curr, lastTs } = getRegistryState();

        if (curr === seen) {
            const baseNow =
                typeof performance !== "undefined" && performance.now ? performance.now() : now;
            const timeSinceLast = baseNow - last;
            if (timeSinceLast >= quietMs) return;
        }

        seen = curr;
        last = lastTs;

        if (now - start >= maxMs) return;
    }
}
