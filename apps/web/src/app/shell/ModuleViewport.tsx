import React, { PropsWithChildren } from 'react';

/**
 * Универсальный холст для модулей.
 * Модули могут сами решать, делать ли им узкий контейнер, грид или 100% ширину.
 */
export default function ModuleViewport({ children }: PropsWithChildren) {
    return (
        <div
            className="
        // базовая колонка
        flex flex-col
        [&>.panel]:rounded-xl [&>.panel]:border [&>.panel]:border-border
        [&>.panel]:bg-background-secondary [&>.panel]:p-4
      "
        >
            {children}
        </div>
    );
}
