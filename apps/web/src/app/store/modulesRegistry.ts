// app/store/modulesRegistry.ts
export type ModuleKey = string;

export class ModulesRegistry {
    private map = new Map<ModuleKey, unknown>();

    get<T = unknown>(key: ModuleKey): T | undefined {
        return this.map.get(key) as T | undefined;
    }

    set<T = unknown>(key: ModuleKey, value: T): void {
        this.map.set(key, value);
    }

    has(key: ModuleKey): boolean {
        return this.map.has(key);
    }

    delete(key: ModuleKey): boolean {
        return this.map.delete(key);
    }

    clear(): void {
        this.map.clear();
    }
}
