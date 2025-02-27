import {
  type DefaultError,
  type MutationKey,
  type QueryKey,
  QueryKeyHashFunction,
  type UseMutationOptions,
  type UseQueryOptions,
  hashKey,
} from '@tanstack/react-query';
import { httpRequest } from '../http/request';
import { createHttpUrl } from '../http/utils';
import type { FunctionType } from '../types/utils';
import type { BuilderMergeVarsFn, BuilderQueryFn, HttpBuilderTypeTemplate } from './types';

export function mergeQueryEnabled(
  opts: (UseQueryOptions<any, any, any, any>['enabled'] | undefined | null)[],
): UseQueryOptions<any, any, any, any>['enabled'] {
  if (opts.some((opt) => typeof opt === 'function'))
    return (q) => opts.every((opt) => (typeof opt === 'function' ? opt(q) : opt !== false));
  return opts.every((x) => x !== false);
}

export function mergeQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  optsList: (Partial<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>> | undefined | null)[],
): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & { queryFn: FunctionType } {
  type TOpt = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & { queryFn: FunctionType };
  const filtered = optsList.filter(Boolean) as TOpt[];

  if (filtered.length === 1) return filtered[0];

  const opts = {} as TOpt;

  for (const { enabled, meta, ...opt } of filtered) {
    Object.assign(opts, opt);
    opts.enabled = mergeQueryEnabled([opts.enabled, enabled]) as TOpt['enabled'];
    opts.meta = { ...opts.meta, ...meta };
  }

  return opts;
}

export function mergeMutationOptions<TData = unknown, TError = DefaultError, TVars = unknown>(
  optsList: (Partial<UseMutationOptions<TData, TError, TVars>> | undefined | null)[],
): UseMutationOptions<TData, TError, TVars> {
  type TOpt = UseMutationOptions<TData, TError, TVars>;
  const filtered = optsList.filter(Boolean) as TOpt[];

  if (filtered.length === 1) return filtered[0];

  const opts = {} as TOpt;

  for (const { meta, ...opt } of filtered) {
    Object.assign(opts, opt);
    opts.meta = { ...opts.meta, ...meta };
  }

  opts.meta ??= {};

  return opts;
}

export function mergeVars<T>(list: [T, ...Partial<T>[]], fn?: BuilderMergeVarsFn<T>): T {
  if (list.length === 0) return {} as T;
  if (list.length === 1) return list[0];
  return list.reduce((acc, curr) => (fn ? fn(acc as T, curr) : { ...(acc as any), ...curr })) as T;
}
export const mergeHttpVars: BuilderMergeVarsFn<HttpBuilderTypeTemplate['vars']> = (v1, v2) => {
  return {
    ...v1,
    ...v2,
    ...(v1?.headers || v2?.headers ? { headers: { ...v1?.headers!, ...v2?.headers! } } : {}),
    ...(v1?.params || v2?.params ? { params: { ...v1?.params!, ...v2?.params! } } : {}),
    ...(v1?.search || v2?.search ? { search: { ...v1?.search!, ...v2?.search! } } : {}),
    ...(v1?.meta || v2?.meta ? { meta: { ...v1?.meta!, ...v2?.meta! } } : {}),
  };
};

export function createHttpQueryFn<T extends HttpBuilderTypeTemplate>(
  mergeVarsFn: BuilderMergeVarsFn<T['vars']>,
): BuilderQueryFn<T> {
  return async ({ queryKey, signal, pageParam }) => {
    const [vars] = queryKey || [];
    const mergedVars = mergeVarsFn(vars, pageParam as Partial<T['vars']>);
    return httpRequest<T['data']>({ ...(mergedVars as any), signal });
  };
}

/**
 * A query key hash function that normalizes the query key
 * and removes irrelevant options which do not affect the query result.
 */

export function createHttpQueryHashFn<T extends HttpBuilderTypeTemplate>(): QueryKeyHashFunction<T['queryKey']> {
  const httpQueryHashFn: QueryKeyHashFunction<T['queryKey']> = function httpQueryKeyHashFn(queryKey) {
    const [vars] = queryKey || [];

    const { baseUrl, params, search, path, method, body, headers, key } = vars;
    const url = createHttpUrl({ path, params, baseUrl, search });

    return hashKey([url, method, body, headers, key].filter((x) => x != null));
  };

  return httpQueryHashFn;
}

export function areKeysEqual(
  a: QueryKey | MutationKey,
  b: QueryKey | MutationKey,
  hashFn: typeof hashKey = hashKey,
): boolean {
  return hashFn(a) === hashFn(b);
}
