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
            fontFamily: {
                // чтобы можно было юзать font-sans и оно брало var(--font-family)
                sans: ["var(--font-family)", "system-ui", "Segoe UI", "Arial", "sans-serif"],
                inter: ["var(--font-family-inter)", "system-ui", "Segoe UI", "Arial", "sans-serif"],
                roboto: ["var(--font-family-roboto)", "system-ui", "Segoe UI", "Arial", "sans-serif"],
            },
        },
    },
    plugins: [],
};

export default config;
