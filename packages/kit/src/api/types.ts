export type TokenProvider = () => string | null;

export type ApiError = {
    code: number;
    message?: string;
    payload?: unknown;
};

export type JsonValue = Record<string, unknown> | unknown[] | null;
