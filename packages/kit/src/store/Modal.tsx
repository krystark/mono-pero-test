import React from "react";
import { makeAutoObservable } from 'mobx';

export type ModalId = string;
export type RenderFn = (close: () => void) => React.ReactNode;

export type OpenRawParams = {
    content: React.ReactNode | RenderFn;
    closeOnBackdrop?: boolean; // default: true
    closeOnEsc?: boolean;      // default: true
    lockScroll?: boolean;      // default: true
    zIndex?: number;           // default: 1000 + index
    wrapperClassName?: string; // tailwind-классы для внешней обёртки
};

export type OpenCardParams = OpenRawParams & {
    title?: string;
    showClose?: boolean;       // default: true
    cardClassName?: string;
    contentClassName?: string;
    maxWidth?: number | string; // <-- расширили
    imageOnly?: boolean;        // <-- опционально, если используешь
};

type BaseEntry = {
    id: ModalId;
    closeOnBackdrop: boolean;
    closeOnEsc: boolean;
    lockScroll: boolean;
    zIndex: number;
    wrapperClassName: string;
    content: React.ReactNode | RenderFn;
};

export type RawEntry = BaseEntry & { kind: 'raw' };

export type CardEntry = BaseEntry & {
    kind: 'card';
    title?: string;
    showClose: boolean;
    cardClassName?: string;
    contentClassName?: string;
    maxWidth: number | string;
    imageOnly?: boolean;
};

export type ModalEntry = RawEntry | CardEntry;

// type-guards
export const isCard = (m: ModalEntry): m is CardEntry => m.kind === 'card';
export const isRaw  = (m: ModalEntry): m is RawEntry  => m.kind === 'raw';

export class ModalsStore {
    stack: ModalEntry[] = [];

    constructor() { makeAutoObservable(this); }

    openRaw(p: OpenRawParams) {
        const id: ModalId = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        const entry: RawEntry = {
            id, kind: 'raw',
            closeOnBackdrop: p.closeOnBackdrop ?? true,
            closeOnEsc: p.closeOnEsc ?? true,
            lockScroll: p.lockScroll ?? true,
            zIndex: p.zIndex ?? 1000,
            wrapperClassName: p.wrapperClassName ?? '',
            content: p.content,
        };
        this.stack.push(entry);
        return { id, close: () => this.close(id) };
    }

    openCard(p: OpenCardParams) {
        const id: ModalId = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        const entry: CardEntry = {
            id, kind: 'card',
            closeOnBackdrop: p.closeOnBackdrop ?? true,
            closeOnEsc: p.closeOnEsc ?? true,
            lockScroll: p.lockScroll ?? true,
            zIndex: p.zIndex ?? 1000,
            wrapperClassName: p.wrapperClassName ?? '',
            content: p.content,
            title: p.title,
            showClose: p.showClose ?? true,
            cardClassName: p.cardClassName,
            contentClassName: p.contentClassName,
            maxWidth: p.maxWidth ?? 720,
            imageOnly: p.imageOnly ?? false,
        };
        this.stack.push(entry);
        return { id, close: () => this.close(id) };
    }

    close(id: ModalId) { this.stack = this.stack.filter(m => m.id !== id); }
    closeTop() { this.stack.pop(); }
    closeAll() { this.stack = []; }

    get hasLockScroll() { return this.stack.some(m => m.lockScroll !== false); }
    get top() { return this.stack[this.stack.length - 1]; }
}
