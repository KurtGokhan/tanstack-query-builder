import type {
  CancelOptions,
  InvalidateOptions,
  MutationFilters,
  QueryClient,
  QueryFilters,
  RefetchOptions,
  ResetOptions,
  SetDataOptions,
} from '@tanstack/react-query';
import { MutationObserver } from '@tanstack/react-query';
import type { QueryBuilderFrozen } from './QueryBuilderFrozen';
import type { BuilderConfig } from './types';
import { bindMethods } from './utils';

const methodsToBind = [
  'ensureData',
  'ensureInfiniteData',
  'refetch',
  'fetch',
  'fetchInfinite',
  'isFetching',
  'prefetch',
  'prefetchInfinite',
  'reset',
  'remove',
  'cancel',
  'invalidate',
  'getData',
  'setData',
  'getState',
  'getMutation',
  'isMutating',
  'mutate',
];

export class QueryBuilderClient<
  TVars,
  TData,
  TError,
  TKey extends unknown[],
  TTags extends Record<string, unknown>,
  TFilters = QueryFilters<TKey>,
> {
  private declare _options: BuilderConfig<TVars, TData, TError, TKey>['options'];
  private declare _pgOptions: BuilderConfig<TVars, TData, TError, TKey>['paginationOptions'];

  constructor(private builder: QueryBuilderFrozen<TVars, TData, TError, TKey, TTags, any>) {
    if (builder.config.bound) bindMethods(this, methodsToBind);
  }

  ensureData(vars: TVars, opts?: typeof this._options) {
    return this.builder.config.queryClient?.ensureQueryData(this.builder.getQueryOptions(vars, opts));
  }

  ensureInfiniteData(vars: TVars, opts?: typeof this._pgOptions) {
    return this.builder.config.queryClient?.ensureInfiniteQueryData(this.builder.getInfiniteQueryOptions(vars, opts));
  }

  refetch(vars: TVars, filters?: TFilters, opts?: RefetchOptions) {
    return this.builder.config.queryClient?.refetchQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);
  }

  fetch(vars: TVars, opts?: typeof this._options) {
    return this.builder.config.queryClient?.fetchQuery(this.builder.getQueryOptions(vars, opts));
  }

  fetchInfinite(vars: TVars, opts?: typeof this._pgOptions) {
    return this.builder.config.queryClient?.fetchInfiniteQuery(this.builder.getInfiniteQueryOptions(vars, opts));
  }

  isFetching(vars: TVars, filters?: TFilters) {
    return this.builder.config.queryClient?.isFetching({ queryKey: this.builder.getQueryKey(vars), ...filters });
  }

  prefetch(vars: TVars, opts?: typeof this._options) {
    return this.builder.config.queryClient?.prefetchQuery(this.builder.getQueryOptions(vars, opts));
  }

  prefetchInfinite(vars: TVars, opts?: typeof this._pgOptions) {
    return this.builder.config.queryClient?.prefetchInfiniteQuery(this.builder.getInfiniteQueryOptions(vars, opts));
  }

  reset(vars: TVars, filters?: TFilters, opts?: ResetOptions) {
    return this.builder.config.queryClient?.resetQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);
  }

  remove(vars: TVars, filters?: TFilters) {
    return this.builder.config.queryClient?.removeQueries({ queryKey: this.builder.getQueryKey(vars), ...filters });
  }

  cancel(vars: TVars, filters?: TFilters, opts?: CancelOptions) {
    return this.builder.config.queryClient?.cancelQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);
  }

  invalidate(vars: TVars, filters?: TFilters, opts?: InvalidateOptions) {
    return this.builder.config.queryClient?.invalidateQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);
  }

  getData(vars: TVars) {
    return this.builder.config.queryClient?.getQueryData<TData>(this.builder.getQueryKey(vars));
  }

  setData(vars: TVars, updater: SetDataUpdater<TData>, opts?: SetDataOptions) {
    return this.builder.config.queryClient?.setQueryData<TData>(this.builder.getQueryKey(vars), updater, opts);
  }

  getState(vars: TVars) {
    return this.builder.config.queryClient?.getQueryState<TData, TError>(this.builder.getQueryKey(vars));
  }

  getMutation(vars?: TVars, filters?: MutationFilters<TData, TError, TVars>, queryClient?: QueryClient) {
    const client = queryClient || this.builder.config.queryClient!;
    return client.getMutationCache().find(this.builder.getMutationFilters(vars, filters));
  }

  isMutating(vars?: TVars, filters?: MutationFilters<TData, TError, TVars>, queryClient?: QueryClient) {
    const client = queryClient || this.builder.config.queryClient!;
    return client.isMutating(this.builder.getMutationFilters(vars, filters));
  }

  async mutate(vars: TVars, opts?: typeof this._options, queryClient?: QueryClient) {
    const client = queryClient || this.builder.config.queryClient!;
    const options = this.builder.getMutationOptions(client, opts);
    const observer = new MutationObserver<TData, TError, TVars>(client, options);
    return observer.mutate(vars, options).finally(() => observer.reset());
  }
}

type SetDataUpdater<T> = T | undefined | ((oldData: T | undefined) => T | undefined);
