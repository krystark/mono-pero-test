import React from 'react';
import type { MenuItem, IconLike } from '../../types/nav';

type AnyNav = any;

export function normalizeMenuForSidebar(items: AnyNav[]): MenuItem[] {
    return (items ?? []).map((it: AnyNav) => {
        let icon: IconLike | undefined;

        const raw = it?.icon;
        if (raw) {
            if (React.isValidElement(raw)) icon = raw as IconLike;
            else if (typeof raw === 'function') icon = raw as IconLike;
        }

        const tabs = Array.isArray(it?.tabs)
            ? it.tabs.map((t: any) => ({ id: t.id ?? t.title, title: t.title, url: t.url }))
            : undefined;

        const res: MenuItem = {
            id: it.id ?? it.title,
            title: it.title ?? '',
            url: it.url,
            icon,
            tabs,
            // доп. поля для мобильного дока — если есть
            mobile: it.mobile,
            sort: it.sort,
        };
        return res;
    });
}
