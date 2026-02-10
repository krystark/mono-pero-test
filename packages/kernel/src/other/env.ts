let _env: Record<string, string | undefined> = {};

export function setEnv(e: Record<string, string | undefined>) {
    _env = e;
}

export function getEnv() {
    return _env;
}
