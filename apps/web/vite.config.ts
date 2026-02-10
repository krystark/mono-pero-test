// vite.config.ts
import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import child_process from "node:child_process";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const base = (env.VITE_PATH_URL || "/").replace(/\/?$/, "/");

    const pkg = JSON.parse(
        fs.readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
    );
    let commit = "";
    try {
        commit = child_process.execSync("git rev-parse --short HEAD").toString().trim();
    } catch {}

    const versionEmitter: PluginOption = {
        name: "emit-version-json",
        apply: "build",
        generateBundle() {
            this.emitFile({
                type: "asset",
                fileName: "version.json",
                source: JSON.stringify({
                    version: pkg.version,
                    commit,
                    builtAt: new Date().toISOString(),
                }),
            });
        },
    };

    return {
        base,
        define: {
            __APP_VERSION__: JSON.stringify(pkg.version),
        },
        plugins: [react(), versionEmitter],
        resolve: {
            alias: {
                "@krystark/app-kernel": path.resolve(__dirname, "../../packages/kernel/src"),
                "@krystark/app-icons": path.resolve(__dirname, "../../packages/icons/src"),
                "@krystark/app-kit": path.resolve(__dirname, "../../packages/kit/src"),
            },
            dedupe: ["react", "react-dom", "mobx", "mobx-react-lite"],
        },
        build: { target: "es2022", modulePreload: true },
        esbuild: { target: "es2022" },
        server: { hmr: { protocol: "ws", host: "localhost" } },
    };
});
