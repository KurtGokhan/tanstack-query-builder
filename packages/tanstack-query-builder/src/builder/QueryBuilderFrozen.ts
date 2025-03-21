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
  UseSuspenseQueryResult,
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
import type { BuilderConfig, BuilderFlags, BuilderQueriesResult, HasClient, HasPagination, IsBound } from './types';
import { areKeysEqual, assertBound, getRandomKey, mergeMutationOptions, mergeVars } from './utils';

type AnyBuilder<TFlags extends BuilderFlags> = QueryBuilderFrozen<any, any, any, any, any, TFlags>;
type IsBoundThis<TFlags extends BuilderFlags> = IsBound<TFlags, AnyBuilder<TFlags>>;

type UseQueriesArgs<TVars, TData, TError, TKey extends unknown[]> = [
  queries: {
    vars: TVars;
    options?: BuilderConfig<TVars, TData, TError, TKey>['options'];
    mapKey?: PropertyKey;
  }[],
  sharedVars?: TVars,
  sharedOpts?: BuilderOptions<TVars, TData, TError, TKey>,
];

const methodsToBind = [
  'getQueryFn',
  'getQueryKeyHashFn',
  'getQueryKey',
  'getQueryOptions',
  'useQuery',
  'useSuspenseQuery',
  'usePrefetchQuery',
  'useIsFetching',
  'useQueriesInternal',
  'useQueries',
  'useSuspenseQueries',
  'getInfiniteQueryOptions',
  'useInfiniteQuery',
  'usePrefetchInfiniteQuery',
  'useSuspenseInfiniteQuery',
  'getMutationFn',
  'getMutationKey',
  'getMutationOptions',
  'getMutationFilters',
  'useMutation',
  'useIsMutating',
  'useMutationState',
];

export class QueryBuilderFrozen<
  TVars,
  TData,
  TError,
  TKey extends unknown[],
  TTags extends Record<string, unknown> = Record<string, unknown>,
  TFlags extends BuilderFlags = '',
> {
  constructor(public readonly config: BuilderConfig<TVars, TData, TError, TKey>) {
    if (config.bound) {
      const self = this as unknown as any;
      for (const method of methodsToBind) self[method] = self[method].bind(self);
    }
  }

  readonly client = new QueryBuilderClient(this) as HasClient<TFlags, QueryBuilderClient<TVars, TData, TError, TKey, TTags>>;
  readonly tags = new QueryBuilderTagsManager(this) as HasClient<TFlags, QueryBuilderTagsManager<TVars, TData, TError, TKey, TTags>>;

  protected mergeConfigs(config: typeof this.config, other: Partial<typeof this.config>): typeof this.config {
    return {
      ...config,
      ...other,
      vars: mergeVars([config.vars, other.vars], other.mergeVars || config.mergeVars),
      options: mergeBuilderOptions([config.options, other.options]),
      paginationOptions: mergeBuilderPaginationOptions([config.paginationOptions, other.paginationOptions]),
    };
  }

  protected mergeVars(list: (Partial<TVars> | undefined)[]): TVars {
    return mergeVars(list, this.config.mergeVars);
  }

  protected preprocessVars(vars: TVars): TKey[0] {
    if (!this.config.preprocessorFn) return vars as TKey[0];
    return this.config.preprocessorFn(vars);
  }

  //#region Query

  getQueryFn(
    this: IsBoundThis<TFlags>,
    operationType: 'query' | 'queries' | 'infiniteQuery' = 'query',
  ): QueryFunction<TData, TKey, Partial<TVars>> {
    assertBound(this);
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
  }

  getQueryKeyHashFn(this: IsBoundThis<TFlags>): (key: TKey) => string {
    assertBound(this);
    return (key) => {
      const sanitized = this.config.queryKeySanitizer ? this.config.queryKeySanitizer(key) : key;
      return hashKey(sanitized);
    };
  }

  getQueryKey(this: IsBoundThis<TFlags>, vars: TVars): DataTag<TKey, TData, TError> {
    assertBound(this);
    return [this.preprocessVars(this.mergeVars([this.config.vars, vars as TODO]))] as DataTag<TKey, TData, TError>;
  }

  getQueryOptions(
    this: IsBoundThis<TFlags>,
    vars: TVars,
    opts?: BuilderOptions<TVars, TData, TError, TKey>,
    operationType?: 'query' | 'queries' | 'infiniteQuery',
  ): WithRequired<BuilderOptions<TVars, TData, TError, TKey>, 'queryFn' | 'queryKey'> {
    assertBound(this);

    return mergeBuilderOptions([
      {
        queryFn: this.getQueryFn(operationType),
        queryKeyHashFn: this.getQueryKeyHashFn(),
        queryKey: this.getQueryKey(vars),
      },
      this.config.options,
      opts,
    ]) as TODO;
  }

  useQuery(this: IsBoundThis<TFlags>, vars: TVars, opts?: BuilderOptions<TVars, TData, TError, TKey>): UseQueryResult<TData, TError> {
    assertBound(this);
    return useQuery(this.getQueryOptions(vars, opts), this.config.queryClient);
  }

  useSuspenseQuery(
    this: IsBoundThis<TFlags>,
    vars: TVars,
    opts?: BuilderOptions<TVars, TData, TError, TKey>,
  ): UseSuspenseQueryResult<TData, TError> {
    assertBound(this);
    return useSuspenseQuery(this.getQueryOptions(vars, opts), this.config.queryClient);
  }

  usePrefetchQuery(this: IsBoundThis<TFlags>, vars: TVars, opts?: BuilderOptions<TVars, TData, TError, TKey>): void {
    assertBound(this);
    usePrefetchQuery(this.getQueryOptions(vars, opts), this.config.queryClient);
  }

  useIsFetching(this: IsBoundThis<TFlags>, vars: TVars, filters?: QueryFilters): number {
    assertBound(this);
    return useIsFetching({ queryKey: this.getQueryKey(vars), ...filters }, this.config.queryClient);
  }

  //#endregion

  //#region Queries

  private useQueriesInternal(
    this: IsBoundThis<TFlags>,
    useHook: typeof useQueries | typeof useSuspenseQueries,
    ...[queries, sharedVars, sharedOpts]: UseQueriesArgs<TVars, TData, TError, TKey>
  ): BuilderQueriesResult<TVars, TData, TError, TKey> {
    assertBound(this);

    type ResultType = BuilderQueriesResult<TVars, TData, TError, TKey>;

    const mapKeys = queries.map((q) => q.mapKey);

    const queryList = queries.map(({ vars, options }) =>
      this.getQueryOptions(this.mergeVars([sharedVars!, vars as any]), mergeBuilderOptions([sharedOpts, options]), 'queries'),
    );

    const result = useHook({ queries: queryList }) as ResultType;

    const queryMap: ResultType['queryMap'] = {};
    for (let index = 0; index < mapKeys.length; index++) {
      const key = mapKeys[index];
      if (typeof key !== 'undefined') queryMap[key] = result[index];
    }

    result.queryMap = queryMap;

    return result;
  }

  useQueries(
    this: IsBoundThis<TFlags>,
    ...args: UseQueriesArgs<TVars, TData, TError, TKey>
  ): BuilderQueriesResult<TVars, TData, TError, TKey> {
    assertBound(this);
    return this.useQueriesInternal(useQueries, ...args);
  }

  useSuspenseQueries(
    this: IsBoundThis<TFlags>,
    ...args: UseQueriesArgs<TVars, TData, TError, TKey>
  ): BuilderQueriesResult<TVars, TData, TError, TKey> {
    assertBound(this);
    return this.useQueriesInternal(useSuspenseQueries, ...args);
  }

  //#endregion

  //#region InfiniteQuery

  declare getInfiniteQueryOptions: HasPagination<
    TFlags,
    (
      this: IsBoundThis<TFlags>,
      vars: TVars,
      opts?: Partial<BuilderPaginationOptions<TVars, TData, TError, TKey>>,
    ) => WithRequired<BuilderPaginationOptions<TVars, TData, TError, TKey>, 'queryFn' | 'queryKey' | 'initialPageParam'>
  >;

  declare useInfiniteQuery: HasPagination<
    TFlags,
    (
      this: IsBoundThis<TFlags>,
      vars: TVars,
      opts?: Partial<BuilderPaginationOptions<TVars, TData, TError, TKey>>,
    ) => UseInfiniteQueryResult<InfiniteData<TData, Partial<TVars>>, TError>
  >;

  declare usePrefetchInfiniteQuery: HasPagination<
    TFlags,
    (this: IsBoundThis<TFlags>, vars: TVars, opts?: Partial<BuilderPaginationOptions<TVars, TData, TError, TKey>>) => void
  >;

  declare useSuspenseInfiniteQuery: HasPagination<
    TFlags,
    (
      this: IsBoundThis<TFlags>,
      vars: TVars,
      opts?: Partial<BuilderPaginationOptions<TVars, TData, TError, TKey>>,
    ) => UseSuspenseInfiniteQueryResult<InfiniteData<TData, Partial<TVars>>, TError>
  >;

  //#endregion

  //#region Mutation

  getMutationFn(this: IsBoundThis<TFlags>, queryClient: QueryClient, meta?: any): MutationFunction<TData, TVars> {
    assertBound(this);

    return async (vars) => {
      const queryKey = [this.mergeVars([this.config.vars, vars as TODO])] as TKey;
      return this.config.queryFn({
        queryKey,
        meta,
        client: this.config.queryClient || queryClient,
        signal: new AbortController().signal,
        originalQueryKey: queryKey,
        operationType: 'mutation',
      });
    };
  }

  #randomKey?: string;
  getMutationKey(this: IsBoundThis<TFlags>): MutationKey {
    assertBound(this);

    if (this.config.options?.mutationKey) return this.config.options.mutationKey;

    if (this.config.queryKeySanitizer && this.config.vars) return this.config.queryKeySanitizer([this.config.vars] as TKey);

    return this.config.options?.mutationKey || [(this.#randomKey ||= getRandomKey())];
  }

  getMutationOptions(
    this: IsBoundThis<TFlags>,
    queryClient: QueryClient,
    opts?: BuilderOptions<TVars, TData, TError, TKey>,
  ): UseMutationOptions<TData, TError, TVars> {
    assertBound(this);

    return mergeMutationOptions([
      {
        mutationKey: this.getMutationKey(),
        mutationFn: this.getMutationFn(queryClient, opts?.meta),
      },
      this.config.options,
      opts,
    ]);
  }

  getMutationFilters(
    this: IsBoundThis<TFlags>,
    vars?: TVars,
    filters?: MutationFilters<TData, TError, TVars>,
  ): MutationFilters<any, any, any> {
    assertBound(this);

    const baseKey = this.preprocessVars(this.mergeVars([this.config.vars, vars as TODO]));

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
  }

  useMutation(
    this: IsBoundThis<TFlags>,
    opts?: BuilderOptions<TVars, TData, TError, TKey>,
  ): ReturnType<typeof useMutation<TData, TError, TVars>> {
    assertBound(this);
    const queryClient = useQueryClient(this.config.queryClient);
    return useMutation(this.getMutationOptions(queryClient, opts), this.config.queryClient);
  }

  useIsMutating(this: IsBoundThis<TFlags>, vars: TVars, filters?: MutationFilters<TData, TError, TVars>): number {
    assertBound(this);
    return useIsMutating(this.getMutationFilters(vars, filters), this.config.queryClient);
  }

  useMutationState<TSelect = Mutation<TData, TError, TVars>>(
    this: IsBoundThis<TFlags>,
    vars?: TVars,
    filters?: MutationFilters<TData, TError, TVars>,
    select?: (mt: Mutation<TData, TError, TVars>) => TSelect,
  ): TSelect[] {
    assertBound(this);
    return useMutationState({ filters: this.getMutationFilters(vars, filters), select: select as any }, this.config.queryClient);
  }

  //#endregion
}

//#region InfiniteQuery implementation

QueryBuilderFrozen.prototype.getInfiniteQueryOptions = function getInfiniteQueryOptions(vars, opts) {
  assertBound(this);

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
  ]) as TODO;
};

QueryBuilderFrozen.prototype.useInfiniteQuery = function (vars, opts) {
  assertBound(this);
  return useInfiniteQuery(this.getInfiniteQueryOptions(vars, opts), this.config.queryClient);
};

QueryBuilderFrozen.prototype.usePrefetchInfiniteQuery = function (vars, opts) {
  assertBound(this);
  return usePrefetchInfiniteQuery(this.getInfiniteQueryOptions(vars, opts), this.config.queryClient);
};

QueryBuilderFrozen.prototype.useSuspenseInfiniteQuery = function (vars, opts) {
  assertBound(this);
  return useSuspenseInfiniteQuery(this.getInfiniteQueryOptions(vars, opts), this.config.queryClient);
};

//#endregion
