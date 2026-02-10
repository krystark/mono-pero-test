import { makeAutoObservable } from 'mobx';
import type { User, Notification, NotificationLevel, IRootStore } from '@krystark/app-contracts';

// ===== User store =====
export class UserData {
    data: User | null = null;
    constructor() { makeAutoObservable(this); }
    setData(user: User | null) { this.data = user; }
    get isAuthorized() { return !!this.data?.id; }
}

// ===== Notifications store =====
export class NotificationsStore {
    list: Notification[] = [];

    constructor() { makeAutoObservable(this); }

    add(n: Omit<Notification, 'id' | 'createdAt'> & Partial<Pick<Notification, 'id' | 'createdAt'>>) {
        const item: Notification = {
            id: n.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: n.createdAt ?? Date.now(),
            title: n.title,
            level: n.level as NotificationLevel, // если level приходит как строка, приведи к enum до вызова
            source: n.source,
            message: n.message,
        };
        this.list.unshift(item);
    }

    remove(id: string) {
        this.list = this.list.filter(x => x.id !== id);
    }

    clear() { this.list = []; }
}

// ===== Modules registry =====
export class ModulesRegistry {
    map = new Map<string, unknown>();
    constructor() { makeAutoObservable(this); }
    register<T>(id: string, store: T) { this.map.set(id, store); }
    get<T>(id: string): T | undefined { return this.map.get(id) as T | undefined; }
}

// ===== Root store =====
// Если где-то требуют именно IRootStore — явно "implements"
export class RootStore implements IRootStore {
    notifications = new NotificationsStore();
    modules = new ModulesRegistry();
    user = new UserData();

    constructor() { makeAutoObservable(this); }
}

export const rootStore = new RootStore();
