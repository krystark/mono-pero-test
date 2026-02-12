// api/toasts.ts
import type React from "react";
import { getStore } from "@krystark/app-kernel";
import { ToastsStore, type ToastVariant } from "../store/Toasts";

const TOASTS_MODULE_KEY = "toasts";

type ModulesRegistry = {
    get<T>(key: string): T | undefined;
    register(key: string, value: unknown): void;
};

function getModulesRegistry(): ModulesRegistry {
    const store = getStore() as any;

    const reg = store?.modules as ModulesRegistry | undefined;
    if (!reg || typeof reg.get !== "function" || typeof reg.register !== "function") {
        throw new Error(
            "[toasts] Store.modules registry is not available. Call setStore(rootStore) before installToasts()."
        );
    }

    return reg;
}

export function installToasts() {
    const reg = getModulesRegistry();
    if (!reg.get<ToastsStore>(TOASTS_MODULE_KEY)) {
        reg.register(TOASTS_MODULE_KEY, new ToastsStore());
    }
}

export function getToastsStore(): ToastsStore {
    const reg = getModulesRegistry();
    const mod = reg.get<ToastsStore>(TOASTS_MODULE_KEY);
    if (!mod) {
        throw new Error(
            "[toasts] ToastsStore not installed. Call installToasts() after setStore(rootStore)."
        );
    }
    return mod;
}

export function showToast(opts: {
    content: React.ReactNode;
    variant?: ToastVariant;
    duration?: number;
    onClose?: () => void;
    id?: string;
}) {
    return getToastsStore().show(opts);
}

export function toast(content: React.ReactNode, duration = 5000) {
    return showToast({ content, duration, variant: "default" });
}

export function toastError(content: React.ReactNode, duration = 5000) {
    return showToast({ content, duration, variant: "error" });
}

export function hideToast(id: string) {
    getToastsStore().remove(id);
}

export function clearToasts() {
    getToastsStore().clear();
}
