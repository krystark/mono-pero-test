// components/forms/ApiForm.tsx
import React from 'react';
import { toast, toastError } from "../api/toasts";
import { useApiMutation } from '../hooks/useApiMutation';
import { formDataToJSON } from '../utils/formDataToJSON';
import type { FetcherOptions } from '../api/client';

type Methods = 'post'|'put'|'patch'|'delete';

export type ApiFormProps<TIn = unknown, TOut = unknown> = Omit<
    React.FormHTMLAttributes<HTMLFormElement>,
    'onSubmit' | 'action' | 'method' // управление у нас
> & {
    url: string;
    method?: Methods;
    fetcher?: FetcherOptions; // { baseUrl?, token? }
    headers?: Record<string, string>;

    /** Собрать объект для отправки. Если вернёшь FormData — уйдёт multipart */
    transform?: (data: Record<string, any>, form: HTMLFormElement) => TIn | FormData;

    onSuccess?: (data: TOut) => void;
    onError?: (e: unknown) => void;

    successToast?: string | false;
    errorToast?: string | false;

    /** дефолтные значения для formDataToJSON (uncontrolled-инпуты) */
    defaultValues?: Record<string, any>;
};

export function ApiForm<TIn = any, TOut = any>({
                                                   url,
                                                   method = 'post',
                                                   fetcher,
                                                   transform,
                                                   headers, // опционально, если хочешь передавать специфичные заголовки на бэкенд
                                                   onSuccess,
                                                   onError,
                                                   successToast = 'Сохранено',
                                                   errorToast = 'Ошибка при сохранении',
                                                   defaultValues,
                                                   children,
                                                   ...formProps
                                               }: ApiFormProps<TIn, TOut>) {
    // NB: если нужен multipart, просто верни FormData из transform — наш клиент это поддержит
    const { mutateAsync, isPending } = useApiMutation<TOut, TIn | FormData>(url, method, {
        fetcher,
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;

        const raw = formDataToJSON(new FormData(form), defaultValues);
        const payload = transform ? transform(raw, form) : (raw as unknown as TIn);

        try {
            // Если payload — FormData, то в sendJSON улетит тело как есть (без JSON.stringify)
            const res = await mutateAsync(payload as any);
            if (successToast) toast(String(successToast));
            onSuccess?.(res);
        } catch (err) {
            if (errorToast) toastError(String(errorToast));
            onError?.(err);
        }
    };

    return (
        <form {...formProps} onSubmit={handleSubmit} aria-busy={isPending}>
            <fieldset disabled={isPending} className="contents">
                {children}
            </fieldset>
        </form>
    );
}
