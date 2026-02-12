// app/shell/AppLayout.tsx
import React, { PropsWithChildren, ReactNode } from "react";

type Props = {
    header?: ReactNode;
};

export function AppLayout({ header, children }: PropsWithChildren<Props>) {
    return (
        <div className="min-h-screen bg-background text-text">
            <div className="mx-auto w-full max-w-[1280px] px-4 tablet:px-6">
                {header ? <div className="pt-4">{header}</div> : <div className="pt-6" />}
                <main className="py-6">{children}</main>
            </div>
        </div>
    );
}
