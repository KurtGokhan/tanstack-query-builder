import type { CancelOptions, InvalidateOptions, QueryFilters, RefetchOptions, ResetOptions, SetDataOptions } from '@tanstack/react-query';
import { QueryBuilderConfig, QueryBuilderFrozen } from './QueryBuilderFrozen';

export class QueryBuilderClient<TVars, TData, TError, TKey extends unknown[], TFilters = QueryFilters<TData, TError, TData, TKey>> {
  private declare _options: QueryBuilderConfig<TVars, TData, TError, TKey>['options'];
  constructor(private builder: QueryBuilderFrozen<TVars, TData, TError, TKey>) {}

  readonly ensureData = (vars: TVars, opts?: typeof this._options) =>
    this.builder.config.queryClient?.ensureQueryData(this.builder.getQueryOptions(vars, opts));

  readonly ensureInfiniteData = (vars: TVars, opts?: typeof this._options) =>
    this.builder.config.queryClient?.ensureInfiniteQueryData(this.builder.getInfiniteQueryOptions(vars, opts));

  readonly refetch = (vars: TVars, filters?: TFilters, opts?: RefetchOptions) =>
    this.builder.config.queryClient?.refetchQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly fetch = (vars: TVars, opts?: typeof this._options) =>
    this.builder.config.queryClient?.fetchQuery(this.builder.getQueryOptions(vars, opts));

  readonly fetchInfinite = (vars: TVars, opts?: typeof this._options) =>
    this.builder.config.queryClient?.fetchInfiniteQuery(this.builder.getInfiniteQueryOptions(vars, opts));

  readonly isFetching = (vars: TVars, filters?: TFilters) =>
    this.builder.config.queryClient?.isFetching({ queryKey: this.builder.getQueryKey(vars), ...filters });

  readonly prefetch = (vars: TVars, opts?: typeof this._options) =>
    this.builder.config.queryClient?.prefetchQuery(this.builder.getQueryOptions(vars, opts));

  readonly prefetchInfinite = (vars: TVars, opts?: typeof this._options) =>
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
}

type SetDataUpdater<T> = T | undefined | ((oldData: T | undefined) => T | undefined);
