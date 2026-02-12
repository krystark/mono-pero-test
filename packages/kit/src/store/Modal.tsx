// packages/kit/src/store/Modal.ts
import { makeAutoObservable } from "mobx";
import type { ReactNode } from "react";

export type ModalKind = "card" | "node";

export type ModalEntry = {
    id: string;
    kind: ModalKind;

    title?: string;
    showClose?: boolean;
    cardClassName?: string;
    contentClassName?: string;
    wrapperClassName?: string;
    maxWidth?: number | string;
    imageOnly?: boolean;

    // behavior
    lockScroll?: boolean; // default true
    closeOnEsc?: boolean; // default true
    closeOnBackdrop?: boolean; // default true

    // z
    zIndex?: number;

    // content
    content: ReactNode | ((close: () => void) => ReactNode);
};

export type OpenModalInput =
    Omit<ModalEntry, "id" | "kind" | "lockScroll" | "closeOnEsc" | "closeOnBackdrop"> & {
    id?: string;
    kind?: ModalKind;
    lockScroll?: boolean;
    closeOnEsc?: boolean;
    closeOnBackdrop?: boolean;
};

function genId() {
    try {
        return crypto.randomUUID();
    } catch {
        return `m_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
}

export class ModalsStore {
    stack: ModalEntry[] = [];

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    get top(): ModalEntry | null {
        return this.stack.length ? this.stack[this.stack.length - 1] : null;
    }

    get hasLockScroll(): boolean {
        return this.stack.some((m) => m.lockScroll !== false);
    }

    open(input: OpenModalInput): string {
        const {
            id: inputId,
            kind,
            lockScroll,
            closeOnEsc,
            closeOnBackdrop,
            ...rest
        } = input;

        const id = inputId ?? genId();

        const entry: ModalEntry = {
            id,
            kind: kind ?? "card",
            lockScroll: lockScroll ?? true,
            closeOnEsc: closeOnEsc ?? true,
            closeOnBackdrop: closeOnBackdrop ?? true,
            ...rest,
        };

        this.stack.push(entry);
        return id;
    }

    close(id: string) {
        const idx = this.stack.findIndex((m) => m.id === id);
        if (idx >= 0) this.stack.splice(idx, 1);
    }

    closeTop() {
        if (this.stack.length) this.stack.pop();
    }

    clear() {
        this.stack = [];
    }
}
