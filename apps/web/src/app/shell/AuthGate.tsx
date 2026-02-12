// app/shell/AuthGate.tsx
import React, { useEffect, useMemo, useState } from "react";
import { rootStore } from "../store/rootStore";
import { AuthPrimaryButton } from "../components/AuthPrimaryButton";

const AUTH_STORAGE_KEY = "mono.auth";
const AUTH_EVENT = "mono-auth-changed";
const RUNTIME_TOKEN_KEY = "__monoAuthToken__";

const AUTH_BASE_URL =
    (import.meta.env.VITE_AUTH_API_URL as string) || "https://dummyjson.com";

function joinUrl(base: string, path: string) {
    return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

function setHtmlFont(kind: "inter" | "roboto") {
    const el = document.documentElement;
    el.style.setProperty(
        "--font-family",
        kind === "inter" ? "var(--font-family-inter)" : "var(--font-family-roboto)"
    );
}

function emitAuthChanged() {
    window.dispatchEvent(new Event(AUTH_EVENT));
}

function safeGetStorage(kind: "local" | "session"): Storage | null {
    try {
        return kind === "local" ? window.localStorage : window.sessionStorage;
    } catch {
        return null;
    }
}

function setRuntimeToken(token: string | null) {
    try {
        (window as any)[RUNTIME_TOKEN_KEY] = token;
    } catch {}
}

function saveAuthTokens(
    tokens: { accessToken: string; refreshToken?: string | null },
    remember: boolean
) {
    // runtime — всегда
    setRuntimeToken(tokens.accessToken);

    // storage — если доступен
    const payload = JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
    });

    const ls = safeGetStorage("local");
    const ss = safeGetStorage("session");

    try {
        if (remember) {
            ls?.setItem(AUTH_STORAGE_KEY, payload);
            ss?.removeItem(AUTH_STORAGE_KEY);
        } else {
            ss?.setItem(AUTH_STORAGE_KEY, payload);
            ls?.removeItem(AUTH_STORAGE_KEY);
        }
    } catch {}

    emitAuthChanged();
}

/* ===== inline icons (как ты просил) ===== */
function UserIcon(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path
                d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function LockIcon(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path
                d="M7 10V8a5 5 0 0 1 10 0v2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <path
                d="M6.5 10h11A2.5 2.5 0 0 1 20 12.5v6A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-6A2.5 2.5 0 0 1 6.5 10Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function EyeIcon(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path
                d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <path
                d="M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z"
                stroke="currentColor"
                strokeWidth="1.6"
            />
        </svg>
    );
}
function EyeOffIcon(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path
                d="M3 5l18 14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <path
                d="M10.6 6.3A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-3.1 3.9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <path
                d="M6.6 8.2C3.7 10.6 2.5 12 2.5 12s3.5 7 9.5 7c1.3 0 2.5-.2 3.6-.6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <path
                d="M9.9 9.7A3 3 0 0 0 12 15c.4 0 .8-.1 1.1-.2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}
function XIcon(props: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={props.className} fill="none">
            <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

/* ====================== Component ====================== */

export default function AuthGate() {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);

    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const [errLogin, setErrLogin] = useState<string | null>(null);
    const [errPass, setErrPass] = useState<string | null>(null);
    const [errCommon, setErrCommon] = useState<string | null>(null);

    const canSubmit = useMemo(
        () => login.trim().length > 0 && password.trim().length > 0,
        [login, password]
    );

    useEffect(() => {
        setHtmlFont("inter");
    }, []);

    async function handleAuth() {
        setErrLogin(null);
        setErrPass(null);
        setErrCommon(null);

        const l = login.trim();
        const p = password.trim();

        let ok = true;
        if (!l) {
            setErrLogin("Введите логин");
            ok = false;
        }
        if (!p) {
            setErrPass("Введите пароль");
            ok = false;
        }
        if (!ok) return;

        setLoading(true);
        try {
            const res = await fetch(joinUrl(AUTH_BASE_URL, "auth/login"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: l, password: p, expiresInMins: 30 }),
            });

            const json = (await res.json()) as any;

            if (!res.ok) {
                setErrCommon(json?.message || "Ошибка авторизации");
                return;
            }

            const accessToken: string | null = json?.accessToken ?? json?.token ?? null;
            const refreshToken: string | null = json?.refreshToken ?? null;

            if (!accessToken) {
                setErrCommon("Не получили accessToken от сервера");
                return;
            }

            saveAuthTokens({ accessToken, refreshToken }, remember);

            const user: any = {
                id: json.id,
                username: json.username,
                email: json.email,
                name: json.firstName,
                last_name: json.lastName,
                image: json.image,
            };

            rootStore.user.setAuth(accessToken, user);

            setHtmlFont("roboto");
        } catch (e: any) {
            setErrCommon(e?.message || "Сетевая ошибка");
        } finally {
            setLoading(false);
        }
    }

    const fieldWrap = (hasError: boolean) =>
        [
            "mt-3 h-[56px] rounded-[14px] border bg-white px-[16px] flex items-center gap-3",
            hasError ? "border-red-500/60" : "border-black/10",
            "focus-within:border-[#2D55FF]",
        ].join(" ");

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[rgb(var(--background-secondary))]">
            <div
                className={[
                    "relative w-full max-w-[640px]",
                    "rounded-[40px] bg-white",
                    "border border-black/5",
                    "shadow-[0_28px_70px_rgba(0,0,0,0.14)]",
                    "px-[56px] pt-[56px] pb-[52px]",
                ].join(" ")}
            >
                <div className="pointer-events-none absolute inset-[10px] rounded-[32px] border border-black/5" />

                <div className="flex justify-center">
                    <div className="h-[56px] w-[56px] rounded-full bg-white border border-black/5 shadow-[0_14px_38px_rgba(0,0,0,0.12)] flex items-center justify-center">
                        <img className="h-[34px] w-[34px]" src="/img/logo.svg" alt="" />
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <div className="text-[40px] leading-[40px] font-semibold text-[var(--color-black)]">
                        Добро пожаловать!
                    </div>
                    <div className="mt-4 text-[20px] leading-[24px] text-black/30">
                        Пожалуйста, авторизируйтесь
                    </div>
                </div>

                <div className="mt-12 space-y-8">
                    <div>
                        <div className="text-[22px] leading-[26px] font-medium text-[var(--color-black)]">
                            Логин
                        </div>

                        <div className={fieldWrap(!!errLogin)}>
                            <UserIcon className="h-6 w-6 text-black/25" />

                            <input
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                placeholder="Введите логин"
                                autoComplete="username"
                                className="flex-1 bg-transparent text-[20px] text-black/80 placeholder:text-black/30"
                            />

                            {login.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setLogin("")}
                                    className="h-10 w-10 grid place-items-center rounded-xl text-black/25 hover:text-black/55"
                                    aria-label="Очистить"
                                >
                                    <XIcon className="h-6 w-6" />
                                </button>
                            )}
                        </div>

                        {errLogin && <div className="mt-3 text-[14px] text-red-600">{errLogin}</div>}
                    </div>

                    <div>
                        <div className="text-[22px] leading-[26px] font-medium text-[var(--color-black)]">
                            Пароль
                        </div>

                        <div className={fieldWrap(!!errPass)}>
                            <LockIcon className="h-6 w-6 text-black/25" />

                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Введите пароль"
                                type={showPass ? "text" : "password"}
                                autoComplete="current-password"
                                className="flex-1 bg-transparent text-[20px] text-black/80 placeholder:text-black/30"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPass((v) => !v)}
                                className="h-10 w-10 grid place-items-center rounded-xl text-black/25 hover:text-black/55"
                                aria-label={showPass ? "Скрыть пароль" : "Показать пароль"}
                            >
                                {showPass ? <EyeOffIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                            </button>
                        </div>

                        {errPass && <div className="mt-3 text-[14px] text-red-600">{errPass}</div>}
                    </div>

                    <label className="flex items-center gap-4 text-[18px] text-black/45 select-none">
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="h-6 w-6 rounded-[6px] border border-black/20"
                        />
                        Запомнить данные
                    </label>

                    {errCommon && (
                        <div className="rounded-[14px] border border-red-500/30 bg-red-500/5 px-4 py-3 text-[16px] text-red-700">
                            {errCommon}
                        </div>
                    )}

                    <AuthPrimaryButton disabled={!canSubmit || loading} onClick={handleAuth}>
                        {loading ? "Входим..." : "Войти"}
                    </AuthPrimaryButton>

                    <div className="pt-2">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                            <div className="h-px bg-black/10" />
                            <div className="text-[18px] text-black/30">или</div>
                            <div className="h-px bg-black/10" />
                        </div>
                    </div>

                    <div className="pt-2 text-center text-[22px] text-black/45">
                        Нет аккаунта?{" "}
                        <a href="#" className="text-[#242EDB] underline underline-offset-4">
                            Создать
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
