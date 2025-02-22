import type { DefaultError, QueryKey, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { httpRequest } from '../http/request';
import { mergeQueryEnabled } from '../tags/mergeQueryEnabled';
import { mergeTagOptions } from '../tags/mergeTagOptions';
import { FunctionType } from '../types/utils';
import { BuilderMergeVarsFn, BuilderQueryFn, HttpBuilderTypeTemplate } from './types';

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
    opts.meta = {
      ...opts.meta,
      ...meta,
      tags: mergeTagOptions([opts.meta?.tags, meta?.tags]),
    };
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
    opts.meta = {
      ...opts.meta,
      ...meta,
      invalidates: mergeTagOptions([opts.meta?.invalidates, meta?.invalidates]),
      updates: mergeTagOptions([opts.meta?.updates, meta?.updates]),
      optimisticUpdates: mergeTagOptions([opts.meta?.optimisticUpdates, meta?.optimisticUpdates]),
    };
  }

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
    headers: {
      ...v1?.headers!,
      ...v2?.headers!,
    },
    params: {
      ...v1?.params!,
      ...v2?.params!,
    },
    search: {
      ...v1?.search!,
      ...v2?.search!,
    },
  };
};

export function createHttpQueryFn<T extends HttpBuilderTypeTemplate>(
  mergeVarsFn: BuilderMergeVarsFn<T['vars']>,
): BuilderQueryFn<T['data'], T['vars']> {
  return async ({ queryKey, signal, meta, pageParam }: any) => {
    const [vars] = queryKey || [];
    const mergedVars = mergeVarsFn(vars, pageParam);
    return httpRequest<T['data']>({ ...(mergedVars as any), meta, signal });
  };
}
