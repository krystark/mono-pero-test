import React, { PropsWithChildren, ReactNode } from "react";

type Props = {
  header: ReactNode;
  sidebar: ReactNode;
  notifications?: ReactNode;
};

export default function AppShell({
  header,
  sidebar,
  notifications,
  children,
}: PropsWithChildren<Props>) {
  return (
    <div className="min-h-screen bg-background text-text pb-[96px] tablet:pb-0">
      {/* На desktop: двухколоночный флекс, растягиваем до экрана */}
      <div className="desktop:flex desktop:items-stretch desktop:min-h-screen">
        {/* Левый столбец */}
        {sidebar}

        {/* Правый столбец */}
        <div className="flex-1 min-w-0 desktop:min-h-screen flex flex-col px-[20px]  max-w-[1920px] mx-auto">
          {/* Фиксировать header не требуется — он просто занимает свою высоту */}
          {header}

          {/* main тянется на остаток высоты */}
          <main className="flex-1 min-h-0">
            <section className="mx-auto pt-[16px] pb-[88px] desktop:pb-0">{children}</section>
          </main>
        </div>
      </div>

      {/* Notifications поверх всего */}
      {notifications && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">{notifications}</div>
      )}
    </div>
  );
}
