import { getStore, bus } from '@krystark/app-kernel';
import { ModalsStore, type OpenCardParams, type OpenRawParams } from '../store/Modal';

const MODALS_KEY = 'modals';

function ensureModalsStore(): ModalsStore {
    const reg = getStore().modules;
    let s = reg.get<ModalsStore>(MODALS_KEY);
    if (!s) {
        s = new ModalsStore();
        reg.register(MODALS_KEY, s);

        // опционально: закрывать все модалки при логауте
        bus?.subscribe?.('auth:logout', () => s!.closeAll());
    }
    return s;
}

export function installModals() {
    ensureModalsStore();
}

export function getModalsStore(): ModalsStore {
    return ensureModalsStore();
}

export function openModal(params: OpenCardParams) {
    return ensureModalsStore().openCard(params);
}

export function openRawModal(params: OpenRawParams) {
    return ensureModalsStore().openRaw(params);
}

export function closeTopModal() {
    ensureModalsStore().closeTop();
}

export function closeAllModals() {
    ensureModalsStore().closeAll();
}
