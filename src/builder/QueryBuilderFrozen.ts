import {
  DataTag,
  InfiniteData,
  InfiniteQueryPageParamsOptions,
  QueryFilters,
  QueryFunction,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseQueryOptions,
  UseSuspenseInfiniteQueryResult,
  useInfiniteQuery,
  useIsFetching,
  usePrefetchInfiniteQuery,
  usePrefetchQuery,
  useQueries,
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { FunctionType, TODO } from '../types/utils';
import { QueryBuilderClient } from './QueryBuilderClient';
import { BuilderConfig, BuilderQueriesResult } from './types';
import { mergeQueryOptions, mergeVars } from './utils';

export type QueryBuilderOptions<TVars, TData, TError, TKey extends unknown[]> = Partial<
  UseQueryOptions<TData, TError, TData, TKey> & { queryFn: FunctionType } & InfiniteQueryPageParamsOptions<TData, Partial<TVars>>
>;

export type QueryBuilderConfig<TVars, TData, TError, TKey extends unknown[]> = BuilderConfig<TVars, TData, TError, TKey> & {
  options?: QueryBuilderOptions<TVars, TData, TError, TKey>;
};

export class QueryBuilderFrozen<
  TVars,
  TData,
  TError,
  TKey extends unknown[],
  TTags extends Record<string, unknown> = Record<string, unknown>,
> {
  protected declare _config: QueryBuilderConfig<TVars, TData, TError, TKey>;
  protected declare _options: QueryBuilderOptions<TVars, TData, TError, TKey>;

  constructor(public config: typeof this._config) {}

  protected mergeConfigs: (config: typeof this._config, other: Partial<typeof this._config>) => typeof this._config = (config, other) => {
    return {
      ...config,
      ...other,
      vars: mergeVars([config.vars, other.vars], other.mergeVars || config.mergeVars),
      options: mergeQueryOptions([config.options, other.options]),
    };
  };

  protected mergeVars: (list: (Partial<TVars> | undefined)[]) => TVars = (list) => {
    return mergeVars(list, this.config.mergeVars);
  };

  protected preprocessVars: (vars: TVars) => TKey[0] = (vars) => {
    if (!this.config.preprocessorFn) return vars as TKey[0];
    return this.config.preprocessorFn(vars);
  };

  getQueryFn: () => QueryFunction<TData, TKey, Partial<TVars>> = () => {
    return ({ client, meta, queryKey, signal, pageParam }) => {
      return this.config.queryFn({ client, meta, queryKey, signal, pageParam, originalQueryKey: queryKey });
    };
  };

  getQueryKey: (vars: TVars) => DataTag<TKey, TData, TError> = (vars) => {
    return [this.preprocessVars(this.mergeVars([this.config.vars, vars]))] as DataTag<TKey, TData, TError>;
  };

  getQueryOptions: (vars: TVars, opts?: typeof this._options) => UseQueryOptions<TData, TError, TData, TKey> & { queryFn: FunctionType } = (
    vars,
    opts,
  ) => {
    return mergeQueryOptions([
      {
        queryFn: this.getQueryFn(),
        queryKeyHashFn: this.config.queryKeyHashFn,
        queryKey: this.getQueryKey(vars),
      },
      this.config.options,
      opts,
    ]);
  };

  getInfiniteQueryOptions: (
    vars: TVars,
    opts?: typeof this._options,
  ) => UseInfiniteQueryOptions<TData, TError, InfiniteData<TData, Partial<TVars>>, TData, TKey> & { queryFn: FunctionType } = (
    vars,
    opts,
  ) => {
    return this.getQueryOptions(vars, opts) as TODO;
  };

  useQuery: (vars: TVars, opts?: typeof this._options) => ReturnType<typeof useQuery<TData, TError, TData, TKey>> = (vars, opts) => {
    return useQuery(this.getQueryOptions(vars, opts), this.config.queryClient);
  };

  useSuspenseQuery: (vars: TVars, opts?: typeof this._options) => ReturnType<typeof useSuspenseQuery<TData, TError, TData, TKey>> = (
    vars,
    opts,
  ) => {
    return useSuspenseQuery(this.getQueryOptions(vars, opts), this.config.queryClient);
  };

  usePrefetchQuery: (vars: TVars, opts?: typeof this._options) => ReturnType<typeof usePrefetchQuery<TData, TError, TData, TKey>> = (
    vars,
    opts,
  ) => {
    return usePrefetchQuery(this.getQueryOptions(vars, opts), this.config.queryClient);
  };

  useIsFetching: (vars: TVars, filters?: QueryFilters) => number = (vars, filters) => {
    return useIsFetching({ queryKey: this.getQueryKey(vars), ...filters }, this.config.queryClient);
  };

  private useQueriesInternal: (useHook: typeof useQueries | typeof useSuspenseQueries) => (
    queries: {
      vars: TVars;
      options?: QueryBuilderConfig<TVars, TData, TError, TKey>['options'];
      mapKey?: PropertyKey;
    }[],
    sharedVars?: TVars,
    sharedOpts?: typeof this._options,
  ) => BuilderQueriesResult<TVars, TData, TError, TKey> = (useHook) => (queries, sharedVars, sharedOpts) => {
    type ResultType = BuilderQueriesResult<TVars, TData, TError, TKey>;

    const mapKeys = queries.map((q) => q.mapKey);

    const queryList = queries.map(({ vars, options }) =>
      this.getQueryOptions(this.mergeVars([sharedVars!, vars]), mergeQueryOptions([sharedOpts, options])),
    );

    const result = useHook({ queries: queryList }) as ResultType;

    const queryMap: ResultType['queryMap'] = {};
    for (let index = 0; index < mapKeys.length; index++) {
      const key = mapKeys[index];
      if (typeof key !== 'undefined') queryMap[key] = result[index];
    }

    result.queryMap = queryMap;

    return result;
  };

  useQueries: ReturnType<typeof this.useQueriesInternal> = (queries, sharedVars, sharedOpts) => {
    return this.useQueriesInternal(useQueries)(queries, sharedVars, sharedOpts);
  };

  useSuspenseQueries: ReturnType<typeof this.useQueriesInternal> = (queries, sharedVars, sharedOpts) => {
    return this.useQueriesInternal(useSuspenseQueries)(queries, sharedVars, sharedOpts);
  };

  useInfiniteQuery: (vars: TVars, opts?: typeof this._options) => UseInfiniteQueryResult<InfiniteData<TData, Partial<TVars>>, TError> = (
    vars,
    opts,
  ) => {
    return useInfiniteQuery(this.getInfiniteQueryOptions(vars, opts), this.config.queryClient);
  };

  usePrefetchInfiniteQuery: (vars: TVars, opts?: typeof this._options) => void = (vars, opts) => {
    return usePrefetchInfiniteQuery(this.getInfiniteQueryOptions(vars, opts), this.config.queryClient);
  };

  useSuspenseInfiniteQuery: (
    vars: TVars,
    opts?: typeof this._options,
  ) => UseSuspenseInfiniteQueryResult<InfiniteData<TData, Partial<TVars>>, TError> = (vars, opts) => {
    return useSuspenseInfiniteQuery(this.getInfiniteQueryOptions(vars, opts), this.config.queryClient);
  };

  private _client?: QueryBuilderClient<TVars, TData, TError, TKey>;
  get client() {
    return (this._client ??= new QueryBuilderClient(this));
  }
}
