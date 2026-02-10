import { makeAutoObservable } from 'mobx';
import React from "react";

export type ToastVariant = 'default' | 'error';

export type ToastItem = {
    id: string;
    content: React.ReactNode;
    variant?: ToastVariant;
    duration?: number;         // мс (по умолчанию 5000)
    onClose?: () => void;
    createdAt: number;
    closing?: boolean;         // ← для exit-анимации
};

export class ToastsStore {
    list: ToastItem[] = [];
    private lifeTimers = new Map<string, number>();   // авто-закрытие (duration)
    private closeTimers = new Map<string, number>();  // задержка на exit-анимацию

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    /** Показать тост. Если активных >=5 — старейший закрываем (с анимацией) */
    show(item: Omit<ToastItem, 'id' | 'createdAt' | 'closing'> & { id?: string }) {
        const id = item.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const full: ToastItem = {
            id,
            content: item.content,
            variant: item.variant ?? 'default',
            duration: item.duration ?? 5000,
            onClose: item.onClose,
            createdAt: Date.now(),
            closing: false,
        };

        // лимит 5: считаем только не-closing
        const active = this.list.filter(x => !x.closing);
        if (active.length >= 5) {
            const oldest = active.sort((a, b) => a.createdAt - b.createdAt)[0];
            if (oldest) this.remove(oldest.id); // мягкое закрытие с анимацией
        }

        this.list.push(full);

        if (full.duration && full.duration > 0) {
            const t = window.setTimeout(() => this.remove(id), full.duration);
            this.lifeTimers.set(id, t);
        }

        return id;
    }

    /** Мягкое закрытие: ставим closing=true и удаляем после короткой задержки */
    remove(id: string, immediate = false) {
        const idx = this.list.findIndex(x => x.id === id);
        if (idx < 0) return;

        // гасим таймер жизни
        const life = this.lifeTimers.get(id);
        if (life) { window.clearTimeout(life); this.lifeTimers.delete(id); }

        const item = this.list[idx];

        if (immediate) {
            this.list.splice(idx, 1);
            item?.onClose?.();
            return;
        }

        if (item.closing) return; // уже уходит
        item.closing = true;

        // даём времени на exit-анимацию (должно совпадать с CSS)
        const t = window.setTimeout(() => {
            const i = this.list.findIndex(x => x.id === id);
            if (i >= 0) {
                const [removed] = this.list.splice(i, 1);
                removed?.onClose?.();
            }
            const ct = this.closeTimers.get(id);
            if (ct) { window.clearTimeout(ct); this.closeTimers.delete(id); }
        }, 260);

        this.closeTimers.set(id, t);
    }

    clear() {
        this.list.forEach(t => {
            const life = this.lifeTimers.get(t.id);
            if (life) window.clearTimeout(life);
            const close = this.closeTimers.get(t.id);
            if (close) window.clearTimeout(close);
        });
        this.lifeTimers.clear();
        this.closeTimers.clear();
        this.list = [];
    }
}