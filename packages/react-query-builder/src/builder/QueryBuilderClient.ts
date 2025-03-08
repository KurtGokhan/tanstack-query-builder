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

export class QueryBuilderClient<
  TVars,
  TData,
  TError,
  TKey extends unknown[],
  TTags extends Record<string, unknown>,
  TFilters = QueryFilters<TData, TError, TData, TKey>,
> {
  private declare _options: BuilderConfig<TVars, TData, TError, TKey>['options'];
  private declare _pgOptions: BuilderConfig<TVars, TData, TError, TKey>['paginationOptions'];
  constructor(private builder: QueryBuilderFrozen<TVars, TData, TError, TKey, TTags, any>) {}

  readonly ensureData = (vars: TVars, opts?: typeof this._options) =>
    this.builder.config.queryClient?.ensureQueryData(this.builder.getQueryOptions(vars, opts));

  readonly ensureInfiniteData = (vars: TVars, opts?: typeof this._pgOptions) =>
    this.builder.config.queryClient?.ensureInfiniteQueryData(this.builder.getInfiniteQueryOptions(vars, opts));

  readonly refetch = (vars: TVars, filters?: TFilters, opts?: RefetchOptions) =>
    this.builder.config.queryClient?.refetchQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly fetch = (vars: TVars, opts?: typeof this._options) =>
    this.builder.config.queryClient?.fetchQuery(this.builder.getQueryOptions(vars, opts));

  readonly fetchInfinite = (vars: TVars, opts?: typeof this._pgOptions) =>
    this.builder.config.queryClient?.fetchInfiniteQuery(this.builder.getInfiniteQueryOptions(vars, opts));

  readonly isFetching = (vars: TVars, filters?: TFilters) =>
    this.builder.config.queryClient?.isFetching({ queryKey: this.builder.getQueryKey(vars), ...filters });

  readonly prefetch = (vars: TVars, opts?: typeof this._options) =>
    this.builder.config.queryClient?.prefetchQuery(this.builder.getQueryOptions(vars, opts));

  readonly prefetchInfinite = (vars: TVars, opts?: typeof this._pgOptions) =>
    this.builder.config.queryClient?.prefetchInfiniteQuery(this.builder.getInfiniteQueryOptions(vars, opts));

  readonly reset = (vars: TVars, filters?: TFilters, opts?: ResetOptions) =>
    this.builder.config.queryClient?.resetQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly remove = (vars: TVars, filters?: TFilters) =>
    this.builder.config.queryClient?.removeQueries({ queryKey: this.builder.getQueryKey(vars), ...filters });

  readonly cancel = (vars: TVars, filters?: TFilters, opts?: CancelOptions) =>
    this.builder.config.queryClient?.cancelQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly invalidate = (vars: TVars, filters?: TFilters, opts?: InvalidateOptions) =>
    this.builder.config.queryClient?.invalidateQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly getData = (vars: TVars) => this.builder.config.queryClient?.getQueryData<TData>(this.builder.getQueryKey(vars));

  readonly setData = (vars: TVars, updater: SetDataUpdater<TData>, opts?: SetDataOptions) =>
    this.builder.config.queryClient?.setQueryData<TData>(this.builder.getQueryKey(vars), updater, opts);

  readonly getState = (vars: TVars) => this.builder.config.queryClient?.getQueryState<TData, TError>(this.builder.getQueryKey(vars));

  readonly getMutation = (vars?: TVars, filters?: MutationFilters<TData, TError, TVars>, queryClient?: QueryClient) => {
    const client = queryClient || this.builder.config.queryClient!;
    return client.getMutationCache().find(this.builder.getMutationFilters(vars, filters));
  };

  readonly isMutating = (vars?: TVars, filters?: MutationFilters<TData, TError, TVars>, queryClient?: QueryClient) => {
    const client = queryClient || this.builder.config.queryClient!;
    return client.isMutating(this.builder.getMutationFilters(vars, filters));
  };

  readonly mutate = async (vars: TVars, opts?: typeof this._options, queryClient?: QueryClient) => {
    const client = queryClient || this.builder.config.queryClient!;
    const options = this.builder.getMutationOptions(client, opts);
    const observer = new MutationObserver<TData, TError, TVars>(client, options);
    return observer.mutate(vars, options).finally(() => observer.reset());
  };
}

type SetDataUpdater<T> = T | undefined | ((oldData: T | undefined) => T | undefined);
