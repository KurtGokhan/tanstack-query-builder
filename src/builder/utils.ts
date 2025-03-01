import {
  type DefaultError,
  type MutationKey,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
  hashKey,
} from '@tanstack/react-query';
import { httpRequest } from '../http/request';
import { createHttpUrl } from '../http/utils';
import type { BuilderKeySanitizerFn, BuilderMergeVarsFn, BuilderQueryFn, HttpBuilderVars } from './types';

export function mergeQueryEnabled(
  opts: (UseQueryOptions<any, any, any, any>['enabled'] | undefined | null)[],
): UseQueryOptions<any, any, any, any>['enabled'] {
  if (opts.some((opt) => typeof opt === 'function'))
    return (q) => opts.every((opt) => (typeof opt === 'function' ? opt(q) : opt !== false));
  return opts.every((x) => x !== false);
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

export function mergeVars<T>(list: (Partial<T> | undefined)[], fn?: BuilderMergeVarsFn<T>): T {
  if (list.length === 0) return {} as T;
  if (list.length === 1) return list[0] as T;
  return list.reduce((acc, curr) =>
    curr == null ? acc : acc == null ? curr : fn ? fn(acc as T, curr) : { ...(acc as any), ...curr },
  ) as T;
}

export function createHttpMergeVarsFn<TVars extends HttpBuilderVars>(): BuilderMergeVarsFn<TVars> {
  const mergeHttpVars: BuilderMergeVarsFn<TVars> = (v1, v2) => {
    return {
      ...v1,
      ...v2,
      ...(v1?.headers || v2?.headers ? { headers: { ...v1?.headers!, ...v2?.headers! } } : {}),
      ...(v1?.params || v2?.params ? { params: { ...v1?.params!, ...v2?.params! } } : {}),
      ...(v1?.search || v2?.search ? { search: { ...v1?.search!, ...v2?.search! } } : {}),
      ...(v1?.meta || v2?.meta ? { meta: { ...v1?.meta!, ...v2?.meta! } } : {}),
    };
  };

  return mergeHttpVars;
}

export function createHttpQueryFn<TVars, TData, TError, TKey extends unknown[]>(
  mergeVarsFn: BuilderMergeVarsFn<TVars>,
): BuilderQueryFn<TVars, TData, TError, TKey> {
  return async ({ queryKey, signal, pageParam }) => {
    const [vars] = queryKey || [];
    const mergedVars = mergeVarsFn(vars as any, pageParam as any);
    return httpRequest<TData>({ ...(mergedVars as any), signal });
  };
}

/**
 * A query key hash function that normalizes the query key
 * and removes irrelevant options which do not affect the query result.
 */

export function createHttpQueryKeySanitizer<TKey extends [HttpBuilderVars]>(): BuilderKeySanitizerFn<TKey> {
  const sanitizer: BuilderKeySanitizerFn<TKey> = function httpQueryKeySanitizer(queryKey) {
    const [vars] = queryKey || [];

    const { baseUrl, params, search, path, method, body, headers, key } = vars;
    const url = createHttpUrl({ path, params, baseUrl, search });

    const res = [url, method, body, headers, key];

    const lastNullIndex = res.findLastIndex((x) => x != null);
    return res.slice(0, lastNullIndex + 1) as TKey;
  };

  return sanitizer;
}

export function areKeysEqual(a: QueryKey | MutationKey, b: QueryKey | MutationKey, hashFn?: BuilderKeySanitizerFn<any>): boolean {
  if (!hashFn) return hashKey(a) === hashKey(b);
  return hashKey(hashFn(a)) === hashKey(hashFn(b));
}
export function getRandomKey() {
  return Math.random().toString(36).substring(7);
}
