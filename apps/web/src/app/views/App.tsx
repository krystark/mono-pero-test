// app/views/App.tsx
import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { rootStore } from "../store/rootStore";
import AuthGate from "../shell/AuthGate";
import ProductsPage from "../pages/ProductsPage";
import { useBootstrapAuth } from "../hooks/useBootstrapAuth";

function setHtmlFont(kind: "inter" | "roboto") {
    const el = document.documentElement;
    el.style.setProperty(
        "--font-family",
        kind === "inter" ? "var(--font-family-inter)" : "var(--font-family-roboto)"
    );
}

const App: React.FC = observer(() => {
    const boot = useBootstrapAuth();

    useEffect(() => {
        if (boot.isAuthorized && boot.token && boot.user?.id) {
            rootStore.user.setAuth(boot.token, {
                id: boot.user.id,
                email: boot.user.email,
                name: boot.user.firstName,
                last_name: boot.user.lastName,
                token: boot.token,
            } as any);
        }
    }, [boot.isAuthorized, boot.token, boot.user?.id]);

    useEffect(() => {
        setHtmlFont(rootStore.user.isAuthorized ? "roboto" : "inter");
    }, [rootStore.user.isAuthorized]);

    if (boot.isChecking && !rootStore.user.isAuthorized) {
        return (
            <div className="min-h-screen grid place-items-center bg-[rgb(var(--background-secondary))]">
                <div className="text-black/50">Проверяем сессию...</div>
            </div>
        );
    }

    return rootStore.user.isAuthorized ? <ProductsPage /> : <AuthGate />;
});

export default App;
