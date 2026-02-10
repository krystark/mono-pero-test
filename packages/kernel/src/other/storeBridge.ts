export type RootStoreLike = Record<string, unknown>;

let _store: RootStoreLike | null = null;

export function setStore<T extends RootStoreLike>(store: T) {
    _store = store;
}

export function getStore<T extends RootStoreLike = RootStoreLike>(): T {
    if (!_store) {
        throw new Error("RootStore not set. Call setStore() before usage.");
    }
    return _store as T;
}
