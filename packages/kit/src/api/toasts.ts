import type React from 'react';
import { getStore } from '@krystark/app-kernel';
import { ToastsStore, type ToastVariant } from '../store/Toasts';

const TOASTS_MODULE_KEY = 'toasts';

export function installToasts() {
    const store = getStore();
    if (!store.modules.get<ToastsStore>(TOASTS_MODULE_KEY)) {
        store.modules.register(TOASTS_MODULE_KEY, new ToastsStore());
    }
}

export function getToastsStore(): ToastsStore {
    const store = getStore();
    const mod = store.modules.get<ToastsStore>(TOASTS_MODULE_KEY);
    if (!mod) {
        throw new Error('[toasts] ToastsStore not installed. Call installToasts() after setStore(rootStore).');
    }
    return mod;
}

export function showToast(opts: {
    content: React.ReactNode;
    variant?: ToastVariant;
    duration?: number; // мс
    onClose?: () => void;
    id?: string;
}) {
    return getToastsStore().show(opts);
}

export function toast(content: React.ReactNode, duration = 5000) {
    return showToast({ content, duration, variant: 'default' });
}

export function toastError(content: React.ReactNode, duration = 5000) {
    return showToast({ content, duration, variant: 'error' });
}

export function hideToast(id: string) {
    getToastsStore().remove(id);
}

export function clearToasts() {
    getToastsStore().clear();
}
