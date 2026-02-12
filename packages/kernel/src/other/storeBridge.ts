// other/storeBridge.ts
export type RootStoreLike = Record<string, unknown>;

const STORE_KEY = Symbol.for("krystark.app-kernel.rootStore");

let _store: RootStoreLike | null = null;

export function setStore<T extends RootStoreLike>(store: T) {
    _store = store;

    try {
        (globalThis as any)[STORE_KEY] = store;
    } catch {
    }
}

export function getStore<T extends RootStoreLike = RootStoreLike>(): T {
    if (_store) return _store as T;

    try {
        const fromGlobal = (globalThis as any)[STORE_KEY] as T | undefined;
        if (fromGlobal) {
            _store = fromGlobal as any;
            return fromGlobal;
        }
    } catch {
    }

    throw new Error("RootStore not set. Call setStore() before usage.");
}
