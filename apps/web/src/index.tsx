import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/ru";

import App from "./app/views/App";
import { applyInitialTheme } from "./app/functions/theme";

import { queryClient, installModals, installToasts, ModalRoot, ToastRoot } from "@krystark/app-kit";
import { attachCommonEventHandlers, setEnv, setStore } from "@krystark/app-kernel";
import { rootStore } from "./app/store/rootStore";

dayjs.locale("ru");
applyInitialTheme();

// kernel/common
setStore(rootStore);
setEnv(import.meta.env as any);
attachCommonEventHandlers();

// базовый UI
installModals();
installToasts();

const RAW_BASE = import.meta.env.VITE_PATH_URL || "/";
const BASENAME = RAW_BASE.replace(/\/+$/, "");
const routerBasename = BASENAME === "" || BASENAME === "/" ? undefined : BASENAME;

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter basename={routerBasename}>
                <ModalRoot />
                <ToastRoot />
                <App />
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>,
);
