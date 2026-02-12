import { useMemo } from 'react';
import { getStore, User } from '@krystark/app-kernel';

function normalizeUser(v: unknown): User | null {
    if (!v || typeof v !== 'object') return null;
    const id = (v as any).id;
    return id ? (v as User) : null;
}

export function useAuth() {
    const store = (typeof getStore === 'function' ? (getStore() as any) : null) ?? null;

    const userModel =
        store?.user ??
        store?.auth ??
        store?.account ??
        null;

    const raw = userModel?.data ?? userModel ?? null;
    const user = normalizeUser(raw);

    const logout = (reason?: string) => {
        // 1) пытаемся очистить модель
        if (userModel?.setData) {
            userModel.setData({ id: 0 } as User);
        } else if (store?.setUser) {
            store.setUser(null);
        } else if ('user' in (store ?? {})) {
            try { store.user = { id: 0 }; } catch {}
        }
    };

    return useMemo(() => ({
        user,
        isAuthorized: !!user,
        logout
    }), [user]);
}
