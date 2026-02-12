// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/ru";

import App from "./app/views/App";
import { queryClient, installModals, installToasts, ModalRoot, ToastRoot } from "@krystark/app-kit";
import { attachCommonEventHandlers, setEnv, setStore } from "@krystark/app-kernel";
import { rootStore } from "./app/store/rootStore";

dayjs.locale("ru");

setStore(rootStore);
setEnv(import.meta.env as any);
attachCommonEventHandlers();

installModals();
installToasts();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ModalRoot />
                <ToastRoot />
                <App />
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>
);
