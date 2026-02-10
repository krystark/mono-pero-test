// apps/web/tailwind.config.ts
import path from "node:path";
import type { Config } from "tailwindcss";

const r = (p: string) => path.resolve(__dirname, p).replace(/\\/g, "/");

const content: string[] = [
    r("./index.html"),
    r("./src/**/*.{js,ts,jsx,tsx}"),

    r("../../packages/kit/src/**/*.{js,ts,jsx,tsx}"),
    r("../../packages/kernel/src/**/*.{js,ts,jsx,tsx}"),
    r("../../packages/icons/src/**/*.{js,ts,jsx,tsx}")
];

const config: Config = {
    content,
    theme: {
        extend: {
            // позже добавим сюда палитру/радиусы из фигмы (или через css variables)
        }
    },
    plugins: []
};

export default config;
