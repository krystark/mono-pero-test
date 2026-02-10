// hooks/useApiMutation.ts (обновлённый)
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { sendJSON, type FetcherOptions } from '../api/client';

type Methods = 'post'|'put'|'patch'|'delete';

export function useApiMutation<TOut = unknown, TIn = unknown>(
    url: string,
    method: Methods,
    opts?: Omit<UseMutationOptions<TOut, unknown, TIn, unknown>, 'mutationFn'> & {
        fetcher?: FetcherOptions;
    }
) {
    const { fetcher, ...rq } = opts ?? {};
    return useMutation<TOut, unknown, TIn>({
        mutationFn: (input: TIn) => sendJSON<TOut>(method.toUpperCase(), url, input, fetcher),
        ...rq,
    });
}
