import React from 'react';
import {Link} from "react-router";
import { Crumb } from '../../types/nav';

// Разделитель «>»
const Sep = () => <span className="mx-2 text-text-secondary">›</span>;

export function Breadcrumbs({
                                items,
                                className = ''
                            }: { items: Crumb[]; className?: string }) {
    if (!items?.length) return null;

    const last = items[items.length - 1];

    return (
        <nav
            aria-label="Хлебные крошки"
            className={`flex items-center min-w-0 ${className}`}
        >
            {/* Мобильная версия: дом → текущая */}
            <div className="flex md:hidden items-center min-w-0">
                {items[0] && (
                    <>
                        <CrumbLink item={items[0]} isLast={false} />
                        <Sep />
                    </>
                )}
                <span className="truncate text-text font-medium">{last.title}</span>
            </div>

            {/* Полная версия */}
            <ol className="hidden md:flex items-center min-w-0">
                {items.map((item, i) => {
                    const isLast = i === items.length - 1;
                    return (
                        <li key={item.id} className="flex items-center min-w-0">
                            {i > 0 && <Sep />}
                            <CrumbLink item={item} isLast={isLast} />
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

function CrumbLink({ item, isLast }: { item: Crumb; isLast: boolean }) {
    const content = (
        <span
            className={`inline-flex items-center gap-1 min-w-0 ${
                isLast ? 'text-text font-medium' : 'text-text-secondary hover:text-text'
            }`}
        >
      {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span className="truncate">{item.title}</span>
    </span>
    );

    if (isLast || !item.url) {
        return (
            <span
                aria-current={isLast ? 'page' : undefined}
                className="max-w-[240px] md:max-w-[280px]"
                title={item.title}
            >
        {content}
      </span>
        );
    }

    return (
        <Link
            to={item.url}
            className="max-w-[240px] md:max-w-[280px]"
            title={item.title}
        >
            {content}
        </Link>
    );
}
