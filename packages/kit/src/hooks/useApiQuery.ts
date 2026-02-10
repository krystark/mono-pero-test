import {
    useQuery,
    keepPreviousData,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query';
import { getJSON, type FetcherOptions } from '../api/client';

export function useApiQuery<
    TData = unknown,
    TError = unknown,
    TKey extends QueryKey = QueryKey
>(
    key: TKey,
    url: string,
    opts: Omit<UseQueryOptions<TData, TError, TData, TKey>, 'queryKey' | 'queryFn'> & {
        fetcher?: FetcherOptions;
    } = {},
): UseQueryResult<TData, TError> {
    const { fetcher, ...rq } = opts;

    return useQuery<TData, TError, TData, TKey>({
        queryKey: key,
        queryFn: ({ signal }) => getJSON<TData>(url, { signal }, fetcher), // ← HERE
        placeholderData: keepPreviousData,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        ...rq,
    });
}
