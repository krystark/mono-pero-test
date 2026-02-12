// app/store/rootStore.ts
import { makeAutoObservable } from "mobx";
import type { User, IUserStore, IRootStore } from "@krystark/app-kernel";
import { markRegistryMutation } from "@krystark/app-kernel";

export class ModulesRegistry {
    registry = new Map<string, unknown>();

    constructor() {
        makeAutoObservable(this, { registry: false }, { autoBind: true });
    }

    get<T>(key: string): T | undefined {
        return this.registry.get(key) as T | undefined;
    }

    has(key: string): boolean {
        return this.registry.has(key);
    }

    register(key: string, value: unknown) {
        this.registry.set(key, value);
        markRegistryMutation();
    }

    unregister(key: string) {
        if (this.registry.delete(key)) {
            markRegistryMutation();
        }
    }

    clear() {
        if (this.registry.size) {
            this.registry.clear();
            markRegistryMutation();
        }
    }
}

export class UserData implements IUserStore {
    token: string | null = null;
    data: User | null = null;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    setData(user: User | null) {
        this.data = user;
    }

    setAuth(token: string | null, user: User | null) {
        this.token = token;
        this.data = user;
    }

    clearAuth() {
        this.token = null;
        this.data = null;
    }

    get isAuthorized() {
        return !!this.token && !!this.data?.id;
    }
}

export class RootStore implements IRootStore {
    [key: string]: unknown;

    modules = new ModulesRegistry();
    user = new UserData();

    constructor() {
        makeAutoObservable(this, { modules: false }, { autoBind: true });
    }
}

export const rootStore = new RootStore();
