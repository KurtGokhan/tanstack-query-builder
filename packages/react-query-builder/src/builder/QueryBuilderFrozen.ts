import {
  DataTag,
  InfiniteData,
  Mutation,
  MutationFilters,
  MutationFunction,
  MutationKey,
  QueryClient,
  QueryFilters,
  QueryFunction,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseQueryResult,
  UseSuspenseInfiniteQueryResult,
  hashKey,
  useInfiniteQuery,
  useIsFetching,
  useIsMutating,
  useMutation,
  useMutationState,
  usePrefetchInfiniteQuery,
  usePrefetchQuery,
  useQueries,
  useQuery,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '@tanstack/react-query';
import type { TODO, WithRequired } from '../type-utils';
import { QueryBuilderClient } from './QueryBuilderClient';
import { QueryBuilderTagsManager } from './QueryBuilderTagsManager';
import { type BuilderOptions, BuilderPaginationOptions, mergeBuilderOptions, mergeBuilderPaginationOptions } from './options';
import type { BuilderConfig, BuilderFlags, BuilderQueriesResult, HasClient, HasPagination } from './types';
import { areKeysEqual, getRandomKey, mergeMutationOptions, mergeVars } from './utils';

export class QueryBuilderFrozen<
  TVars,
  TData,
  TError,
  TKey extends unknown[],
  TTags extends Record<string, unknown> = Record<string, unknown>,
  TFlags extends BuilderFlags = '',
> {
  protected declare _options: BuilderOptions<TVars, TData, TError, TKey>;
  protected declare _pgOptions: Partial<BuilderPaginationOptions<TVars, TData, TError, TKey>>;

  constructor(public readonly config: BuilderConfig<TVars, TData, TError, TKey>) {}

  protected mergeConfigs: (config: typeof this.config, other: Partial<typeof this.config>) => typeof this.config = (config, other) => {
    return {
      ...config,
      ...other,
      vars: mergeVars([config.vars, other.vars], other.mergeVars || config.mergeVars),
      options: mergeBuilderOptions([config.options, other.options]),
      paginationOptions: mergeBuilderPaginationOptions([config.paginationOptions, other.paginationOptions]),
    };
  };

  protected mergeVars: (list: (Partial<TVars> | undefined)[]) => TVars = (list) => {
    return mergeVars(list, this.config.mergeVars);
  };

  protected preprocessVars: (vars: TVars) => TKey[0] = (vars) => {
    if (!this.config.preprocessorFn) return vars as TKey[0];
    return this.config.preprocessorFn(vars);
  };

  //#region Query

  getQueryFn: (operationType?: 'query' | 'queries' | 'infiniteQuery') => QueryFunction<TData, TKey, Partial<TVars>> = (
    operationType = 'query',
  ) => {
    return ({ client, meta, queryKey, signal, pageParam }) => {
      return this.config.queryFn({
        client,
        meta,
        queryKey,
        signal,
        pageParam,
        originalQueryKey: queryKey,
        operationType,
      });
    };
  };

  getQueryKeyHashFn: () => (key: TKey) => string = () => {
    return (key) => {
      const sanitized = this.config.queryKeySanitizer ? this.config.queryKeySanitizer(key) : key;
      return hashKey(sanitized);
    };
  };

  getQueryKey: (vars: TVars) => DataTag<TKey, TData, TError> = (vars) => {
    return [this.preprocessVars(this.mergeVars([this.config.vars, vars]))] as DataTag<TKey, TData, TError>;
  };

  getQueryOptions: (
    vars: TVars,
    opts?: typeof this._options,
    operationType?: 'query' | 'queries' | 'infiniteQuery',
  ) => WithRequired<BuilderOptions<TVars, TData, TError, TKey>, 'queryFn' | 'queryKey'> = (vars, opts, operationType) => {
    return mergeBuilderOptions([
      {
        queryFn: this.getQueryFn(operationType),
        queryKeyHashFn: this.getQueryKeyHashFn(),
        queryKey: this.getQueryKey(vars),
      },
      this.config.options,
      opts,
    ]) as TODO;
  };

  useQuery: (vars: TVars, opts?: typeof this._options) => UseQueryResult<TData, TError> = (vars, opts) => {
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

  //#endregion

  //#region Queries

  private useQueriesInternal: (useHook: typeof useQueries | typeof useSuspenseQueries) => (
    queries: {
      vars: TVars;
      options?: BuilderConfig<TVars, TData, TError, TKey>['options'];
      mapKey?: PropertyKey;
    }[],
    sharedVars?: TVars,
    sharedOpts?: typeof this._options,
  ) => BuilderQueriesResult<TVars, TData, TError, TKey> = (useHook) => (queries, sharedVars, sharedOpts) => {
    type ResultType = BuilderQueriesResult<TVars, TData, TError, TKey>;

    const mapKeys = queries.map((q) => q.mapKey);

    const queryList = queries.map(({ vars, options }) =>
      this.getQueryOptions(this.mergeVars([sharedVars!, vars]), mergeBuilderOptions([sharedOpts, options]), 'queries'),
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

  //#endregion

  //#region InfiniteQuery

  getInfiniteQueryOptions = ((vars, opts) => {
    // Remove incompatible options from the base query options
    const {
      enabled,
      staleTime,
      initialData,
      placeholderData,
      refetchInterval,
      refetchOnWindowFocus,
      refetchOnReconnect,
      refetchOnMount,
      select,
      persister,
      behavior,
      ...options
    } = this.config.options || {};

    return mergeBuilderPaginationOptions([
      {
        queryFn: this.getQueryFn('infiniteQuery'),
        queryKeyHashFn: this.getQueryKeyHashFn(),
        queryKey: this.getQueryKey(vars),
      },
      options,
      this.config.paginationOptions,
      opts,
    ]);
  }) as HasPagination<
    TFlags,
    (
      vars: TVars,
      opts?: typeof this._pgOptions,
    ) => WithRequired<BuilderPaginationOptions<TVars, TData, TError, TKey>, 'queryFn' | 'queryKey' | 'initialPageParam'>
  >;

  useInfiniteQuery = ((vars, opts) => {
    return useInfiniteQuery(this.getInfiniteQueryOptions(vars, opts), this.config.queryClient);
  }) as HasPagination<
    TFlags,
    (vars: TVars, opts?: typeof this._pgOptions) => UseInfiniteQueryResult<InfiniteData<TData, Partial<TVars>>, TError>
  >;

  usePrefetchInfiniteQuery = ((vars, opts) => {
    return usePrefetchInfiniteQuery(this.getInfiniteQueryOptions(vars, opts), this.config.queryClient);
  }) as HasPagination<TFlags, (vars: TVars, opts?: typeof this._pgOptions) => void>;

  useSuspenseInfiniteQuery = ((vars, opts) => {
    return useSuspenseInfiniteQuery(this.getInfiniteQueryOptions(vars, opts), this.config.queryClient);
  }) as HasPagination<
    TFlags,
    (vars: TVars, opts?: typeof this._pgOptions) => UseSuspenseInfiniteQueryResult<InfiniteData<TData, Partial<TVars>>, TError>
  >;

  //#endregion

  //#region Mutation

  getMutationFn: (queryClient: QueryClient, meta?: any) => MutationFunction<TData, TVars> = (queryClient, meta) => {
    return async (vars) => {
      const queryKey = [this.mergeVars([this.config.vars, vars])] as TKey;
      return this.config.queryFn({
        queryKey,
        meta,
        client: this.config.queryClient || queryClient,
        signal: new AbortController().signal,
        originalQueryKey: queryKey,
        operationType: 'mutation',
      });
    };
  };

  private randomKey?: string;
  getMutationKey: () => MutationKey = () => {
    if (this.config.options?.mutationKey) return this.config.options.mutationKey;

    if (this.config.queryKeySanitizer && this.config.vars) return this.config.queryKeySanitizer([this.config.vars] as TKey);

    return this.config.options?.mutationKey || [(this.randomKey ||= getRandomKey())];
  };

  getMutationOptions: (queryClient: QueryClient, opts?: typeof this._options) => UseMutationOptions<TData, TError, TVars> = (
    queryClient,
    opts,
  ) => {
    return mergeMutationOptions([
      {
        mutationKey: this.getMutationKey(),
        mutationFn: this.getMutationFn(queryClient, opts?.meta),
      },
      this.config.options,
      opts,
    ]);
  };

  getMutationFilters: (vars?: TVars, filters?: MutationFilters<TData, TError, TVars>) => MutationFilters<any, any, any> = (
    vars,
    filters,
  ) => {
    const baseKey = this.preprocessVars(this.mergeVars([this.config.vars, vars]));

    return {
      mutationKey: this.getMutationKey(),
      ...filters,
      predicate: (m) => {
        if (filters?.predicate && !filters.predicate(m)) return false;
        if (vars == null) return true;
        if (!m.state.variables) return false;

        const curKey = this.preprocessVars(this.mergeVars([this.config.vars, m.state.variables]));
        return areKeysEqual([curKey], [baseKey], this.config.queryKeySanitizer);
      },
    };
  };

  useMutation: (opts?: typeof this._options) => ReturnType<typeof useMutation<TData, TError, TVars>> = (opts) => {
    const queryClient = useQueryClient(this.config.queryClient);
    return useMutation(this.getMutationOptions(queryClient, opts), this.config.queryClient);
  };

  useIsMutating: (vars: TVars, filters?: MutationFilters<TData, TError, TVars>) => number = (vars, filters) => {
    return useIsMutating(this.getMutationFilters(vars, filters), this.config.queryClient);
  };

  useMutationState: <TSelect = Mutation<TData, TError, TVars>>(
    vars?: TVars,
    filters?: MutationFilters<TData, TError, TVars>,
    select?: (mt: Mutation<TData, TError, TVars>) => TSelect,
  ) => TSelect[] = (vars, filters, select) => {
    return useMutationState({ filters: this.getMutationFilters(vars, filters), select: select as any }, this.config.queryClient);
  };

  //#endregion

  private _client?: QueryBuilderClient<TVars, TData, TError, TKey, TTags>;
  get client(): HasClient<TFlags, QueryBuilderClient<TVars, TData, TError, TKey, TTags>> {
    return (this._client ??= new QueryBuilderClient(this)) as any;
  }

  private _tags?: QueryBuilderTagsManager<TVars, TData, TError, TKey, TTags>;
  get tags() {
    return (this._tags ??= new QueryBuilderTagsManager(this));
  }
}
