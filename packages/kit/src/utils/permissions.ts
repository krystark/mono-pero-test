import { useMemo } from 'react';
import { getStore } from '@krystark/app-kernel';

type PermLike = string | string[];
export type UserLike =
    | { roles?: string[] | string | Record<string, any>; permissions?: string[] | string | Record<string, any> }
    | null
    | undefined;

const toArray = (x: unknown): string[] => {
    if (Array.isArray(x)) return (x as any[]).map(String);
    if (typeof x === 'string') return x.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (x && typeof x === 'object') return Object.values(x as Record<string, any>).map(String);
    return [];
};
const norm = (s: string) => s.trim().toLowerCase();

export type PermissionCheckerOptions = {
    /** Роль, которая даёт все права (добавляет супер-пермишен). По умолчанию 'admin'. */
    adminRole?: string;
    /** Карта соответствий роль → список пермишенов, которые эта роль даёт автоматически. */
    roleMap?: Record<string, string[]>;
    /** Имя супер-пермишена (джокера). По умолчанию '*'. */
    superPerm?: string;
};

export function makePermissionChecker(user: UserLike, opts: PermissionCheckerOptions = {}) {
    const { adminRole = 'admin', roleMap = {}, superPerm = '*' } = opts;

    const roleSet = new Set(toArray(user?.roles).map(norm));
    const permSet = new Set(toArray(user?.permissions).map(norm));

    // Расширяем пермишены на основе ролей
    roleSet.forEach((r) => {
        const implied = roleMap[r];
        if (Array.isArray(implied)) implied.forEach((p) => permSet.add(norm(p)));
    });

    // Админ даёт «всё»
    if (roleSet.has(norm(adminRole))) permSet.add(superPerm);

    const hasRole = (value: PermLike) => toArray(value).map(norm).every((r) => roleSet.has(r));
    const hasAnyRole = (value: PermLike) => toArray(value).map(norm).some((r) => roleSet.has(r));

    const hasPermAll = (value: PermLike) => {
        if (permSet.has(superPerm)) return true;
        return toArray(value).map(norm).every((p) => permSet.has(p));
    };
    const hasPermAny = (value: PermLike) => {
        if (permSet.has(superPerm)) return true;
        return toArray(value).map(norm).some((p) => permSet.has(p));
    };

    return {
        roles: Array.from(roleSet),
        permissions: Array.from(permSet),
        isAdmin: roleSet.has(norm(adminRole)),
        superPerm,
        hasRole,
        hasAnyRole,
        hasPerm: hasPermAll,
        hasPermAny,
        can: hasPermAll,
        canAll: hasPermAll,
        canAny: hasPermAny,
    };
}

/** Хук, который берёт юзера из стора (поддержка user.data и user). */
export function usePermissions(options?: PermissionCheckerOptions) {
    const appStore = getStore() as any;
    const rawUser = appStore?.user?.data ?? appStore?.user ?? null;

    // Меняем мемо-ключи только по сути значимых опций
    const deps = JSON.stringify({
        adminRole: options?.adminRole ?? 'admin',
        superPerm: options?.superPerm ?? '*',
        roleMap: options?.roleMap ?? {},
        roles: toArray(rawUser?.roles).map(norm),
        perms: toArray(rawUser?.permissions).map(norm),
    });

    return useMemo(() => makePermissionChecker(rawUser, options), [deps]);
}
