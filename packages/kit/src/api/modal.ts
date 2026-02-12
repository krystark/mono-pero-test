// packages/kit/src/api/modal.ts
import { getStore, markRegistryMutation } from "@krystark/app-kernel";
import { ModalsStore, type OpenModalInput } from "../store/Modal";

const REG_KEY = "modals";

function getModulesRegistry(): Map<string, unknown> {
    const store = getStore<any>();
    const reg = store?.modules?.registry;

    if (!reg || !(reg instanceof Map)) {
        throw new Error(
            "[modals] Store.modules registry is not available. Ensure rootStore has modules.registry: Map and call setStore(rootStore) before installModals().",
        );
    }

    return reg;
}

export function ensureModalsStore(): ModalsStore {
    const reg = getModulesRegistry();
    const existing = reg.get(REG_KEY);

    if (existing && existing instanceof ModalsStore) return existing;

    const created = new ModalsStore();
    reg.set(REG_KEY, created);

    try {
        markRegistryMutation();
    } catch {
        // ignore
    }

    return created;
}

export function getModalsStore(): ModalsStore {
    return ensureModalsStore();
}

export function installModals() {
    ensureModalsStore();
}

export function openModal(input: OpenModalInput): string {
    return ensureModalsStore().open(input);
}

export function closeModal(id: string) {
    ensureModalsStore().close(id);
}

export function closeTopModal() {
    ensureModalsStore().closeTop();
}

export function clearModals() {
    ensureModalsStore().clear();
}
