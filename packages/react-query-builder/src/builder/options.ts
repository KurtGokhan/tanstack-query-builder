import type { GetNextPageParamFunction, GetPreviousPageParamFunction, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import type { FunctionType, WithOptional } from '../type-utils';
import { mergeQueryEnabled } from './utils';

export type BuilderPaginationOptions<TVars, TData, TError, TKey extends unknown[]> = {
  getNextPageParam: GetNextPageParamFunction<Partial<TVars>, TData>;
  getPreviousPageParam?: GetPreviousPageParamFunction<Partial<TVars>, TData>;
  getInitialPageParam?: Partial<TVars> | (() => Partial<TVars>);
};

export type BuilderOptions<TVars, TData, TError, TKey extends unknown[]> = WithOptional<
  UseQueryOptions<TData, TError, TData, TKey>,
  'queryFn' | 'queryKey'
> & { queryFn?: FunctionType } & Partial<BuilderPaginationOptions<TVars, TData, TError, TKey>> &
  Pick<
    UseMutationOptions<TData, TError, TVars>,
    'onError' | 'onMutate' | 'onSettled' | 'onSuccess' | 'gcTime' | 'mutationKey' | 'networkMode' | 'retry' | 'retryDelay' | 'throwOnError'
  >;

export function mergeBuilderOptions<TVars, TData, TError, TKey extends unknown[]>(
  optsList: (Partial<BuilderOptions<TVars, TData, TError, TKey>> | undefined | null)[],
): BuilderOptions<TVars, TData, TError, TKey> {
  type TOpt = BuilderOptions<TVars, TData, TError, TKey>;
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
