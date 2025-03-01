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
  UseInfiniteQueryOptions,
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
import { operateOnTags } from '../tags/operateOnTags';
import { TagOperationOptions } from '../tags/types';
import { FunctionType, TODO, WithRequired } from '../type-utils';
import { QueryBuilderClient } from './QueryBuilderClient';
import { BuilderOptions, mergeBuilderOptions } from './options';
import { BuilderConfig, BuilderQueriesResult } from './types';
import { areKeysEqual, getRandomKey, mergeMutationOptions, mergeVars } from './utils';

export class QueryBuilderFrozen<
  TVars,
  TData,
  TError,
  TKey extends unknown[],
  TTags extends Record<string, unknown> = Record<string, unknown>,
> {
  protected declare _options: BuilderOptions<TVars, TData, TError, TKey>;

  constructor(public readonly config: BuilderConfig<TVars, TData, TError, TKey>) {}

  protected mergeConfigs: (config: typeof this.config, other: Partial<typeof this.config>) => typeof this.config = (config, other) => {
    return {
      ...config,
      ...other,
      vars: mergeVars([config.vars, other.vars], other.mergeVars || config.mergeVars),
      options: mergeBuilderOptions([config.options, other.options]),
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

  getInfiniteQueryOptions: (
    vars: TVars,
    opts?: typeof this._options,
  ) => UseInfiniteQueryOptions<TData, TError, InfiniteData<TData, Partial<TVars>>, TData, TKey, Partial<TVars>> & {
    queryFn: FunctionType;
  } = (vars, opts) => {
    // TODO: eventually allow these options as well
    const {
      enabled,
      staleTime,
      initialData,
      placeholderData,
      getInitialPageParam,
      refetchInterval,
      refetchOnWindowFocus,
      refetchOnReconnect,
      refetchOnMount,
      select,
      persister,
      behavior,
      ...options
    } = this.getQueryOptions(vars, opts, 'infiniteQuery');
    return {
      ...options,
      initialPageParam: typeof getInitialPageParam === 'function' ? getInitialPageParam() : getInitialPageParam!,
      getNextPageParam: options.getNextPageParam!,
    };
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
    return {
      mutationKey: this.getMutationKey(),
      ...filters,
      predicate: (m) => {
        if (filters?.predicate && !filters.predicate(m)) return false;
        if (vars == null) return true;
        if (!m.state.variables) return false;
        return areKeysEqual([m.state.variables], [vars], this.config.queryKeySanitizer);
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

  /**
   * This hook returns a function that can be used to operate on queries based on tags.
   * It also returns the mutation object that can be used to track the state of the operation.
   * See `operateOnTags` for more information.
   */
  useTagOperation(opts?: TagOperationOptions<TTags> | void) {
    const queryClient = useQueryClient();
    const mutationFn: MutationFunction<unknown, TagOperationOptions<TTags> | void> = (
      { tags = [], operation = 'invalidate', filters, options } = opts || {},
    ) => operateOnTags({ queryClient, tags, operation }, filters, options);

    const mutation = useMutation({ mutationFn });
    const operate = mutation.mutateAsync;

    return [operate, mutation] as const;
  }

  private _client?: QueryBuilderClient<TVars, TData, TError, TKey, TTags>;
  get client() {
    return (this._client ??= new QueryBuilderClient(this));
  }
}
