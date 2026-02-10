import React from 'react';
import { Notification, normalizeLevel } from '../../types/notifications';

export default function AppNotifications({ notifications = [] as any[] }) {
    const normalized: Notification[] = notifications.map(n => ({
        ...n,
        level: normalizeLevel(n.level), // приведение к union
    }));

    return (
        <>
            {normalized.map(n => (
                <div
                    key={n.id}
                    className="min-w-[260px] max-w-[360px] rounded-xl border border-border bg-background-secondary shadow p-3"
                >
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-text-secondary mt-1">
                        ({n.level})
                    </div>
                </div>
            ))}
        </>
    );
}
