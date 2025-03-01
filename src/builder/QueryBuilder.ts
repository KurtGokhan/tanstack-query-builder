import {
  CancelOptions,
  DataTag,
  InvalidateOptions,
  QueryFilters,
  QueryFunction,
  RefetchOptions,
  ResetOptions,
  SetDataOptions,
  UseQueryOptions,
  useIsFetching,
  usePrefetchQuery,
  useQueries,
  useQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { operateOnTags } from '../tags/operateOnTags';
import { QueryTagOption } from '../tags/types';
import { FunctionType } from '../types/utils';
import { MutationBuilder } from './MutationBuilder';
import { MiddlewareFn, createMiddlewareFunction } from './createMiddlewareFunction';
import { PreprocessorFn, createPreprocessorFunction, identityPreprocessor } from './createPreprocessorFunction';
import { createTagMiddleware } from './createTagMiddleware';
import { BuilderConfig, BuilderQueriesResult } from './types';
import { mergeQueryOptions, mergeVars } from './utils';

export class QueryBuilderFrozen<TVars, TData, TError, TKey extends unknown[]> {
  protected declare _config: QueryBuilderConfig<TVars, TData, TError, TKey>;
  protected declare _options: typeof this._config.options;
  protected declare _vars: TVars;

  constructor(public config: typeof this._config) {}

  protected mergeConfigs: (config: typeof this._config, other: Partial<typeof this._config>) => typeof this._config = (
    config,
    other,
  ) => {
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

  getQueryFn: () => QueryFunction<TData, TKey> = () => {
    return ({ client, meta, queryKey, signal, pageParam }) => {
      return this.config.queryFn({ client, meta, queryKey, signal, pageParam, originalQueryKey: queryKey });
    };
  };

  getQueryKey: (vars: TVars) => DataTag<TKey, TData, TError> = (vars) => {
    return [this.preprocessVars(this.mergeVars([this.config.vars, vars]))] as DataTag<TKey, TData, TError>;
  };

  getQueryOptions: (
    vars: TVars,
    opts?: typeof this._options,
  ) => UseQueryOptions<TData, TError, TData, TKey> & { queryFn: FunctionType } = (vars, opts) => {
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

  useQuery: (vars: TVars, opts?: typeof this._options) => ReturnType<typeof useQuery<TData, TError, TData, TKey>> = (
    vars,
    opts,
  ) => {
    return useQuery(this.getQueryOptions(vars, opts), this.config.queryClient);
  };

  useSuspenseQuery: (
    vars: TVars,
    opts?: typeof this._options,
  ) => ReturnType<typeof useSuspenseQuery<TData, TError, TData, TKey>> = (vars, opts) => {
    return useSuspenseQuery(this.getQueryOptions(vars, opts), this.config.queryClient);
  };

  usePrefetchQuery: (
    vars: TVars,
    opts?: typeof this._options,
  ) => ReturnType<typeof usePrefetchQuery<TData, TError, TData, TKey>> = (vars, opts) => {
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

  private _client?: QueryBuilderClient<TVars, TData, TError, TKey>;
  get client() {
    return (this._client ??= new QueryBuilderClient(this));
  }
}

class QueryBuilderClient<
  TVars,
  TData,
  TError,
  TKey extends unknown[],
  TFilters = QueryFilters<TData, TError, TData, TKey>,
> {
  private declare _options: QueryBuilderConfig<TVars, TData, TError, TKey>['options'];
  constructor(private builder: QueryBuilderFrozen<TVars, TData, TError, TKey>) {}

  readonly ensureData = (vars: TVars, opts?: typeof this._options) =>
    this.builder.config.queryClient?.ensureQueryData(this.builder.getQueryOptions(vars, opts));

  readonly refetch = (vars: TVars, filters?: TFilters, opts?: RefetchOptions) =>
    this.builder.config.queryClient?.refetchQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly fetch = (vars: TVars, opts?: typeof this._options) =>
    this.builder.config.queryClient?.fetchQuery(this.builder.getQueryOptions(vars, opts));

  readonly isFetching = (vars: TVars, filters?: TFilters) =>
    this.builder.config.queryClient?.isFetching({ queryKey: this.builder.getQueryKey(vars), ...filters });

  readonly prefetch = (vars: TVars, opts?: typeof this._options) =>
    this.builder.config.queryClient?.prefetchQuery(this.builder.getQueryOptions(vars, opts));

  readonly reset = (vars: TVars, filters?: TFilters, opts?: ResetOptions) =>
    this.builder.config.queryClient?.resetQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly remove = (vars: TVars, filters?: TFilters) =>
    this.builder.config.queryClient?.removeQueries({ queryKey: this.builder.getQueryKey(vars), ...filters });

  readonly cancel = (vars: TVars, filters?: TFilters, opts?: CancelOptions) =>
    this.builder.config.queryClient?.cancelQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly invalidate = (vars: TVars, filters?: TFilters, opts?: InvalidateOptions) =>
    this.builder.config.queryClient?.invalidateQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly getData = (vars: TVars) =>
    this.builder.config.queryClient?.getQueryData<TData>(this.builder.getQueryKey(vars));

  readonly setData = (vars: TVars, updater: Updater<TData>, opts?: SetDataOptions) =>
    this.builder.config.queryClient?.setQueryData<TData>(this.builder.getQueryKey(vars), updater, opts);

  readonly getState = (vars: TVars) =>
    this.builder.config.queryClient?.getQueryState<TData, TError>(this.builder.getQueryKey(vars));
}

export class QueryBuilder<TVars, TData, TError, TKey extends unknown[]> extends QueryBuilderFrozen<
  TVars,
  TData,
  TError,
  TKey
> {
  withVars<TVars$ = TVars, const TReset extends boolean = false>(
    vars?: TVars$,
    resetVars = false as TReset,
  ): QueryBuilder<TVars$, TData, TError, TKey> {
    if (!vars) return this as any;

    return this.withConfig({
      vars: resetVars ? vars : mergeVars([this.config.vars, vars], this.config.mergeVars),
    }) as any;
  }

  withData<TData$>(): QueryBuilder<TVars, TData$, TError, TKey> {
    return this as any;
  }

  withError<TError$>(): QueryBuilder<TVars, TData, TError$, TKey> {
    return this as any;
  }

  withConfig(config: Partial<typeof this._config>): this {
    const ctor = this.constructor as typeof QueryBuilder;
    const newConfig = this.mergeConfigs(this.config, config);
    return new ctor(newConfig) as this;
  }

  withPreprocessor(preprocessor: PreprocessorFn<TVars, TVars>): this;
  withPreprocessor<TVars$ = TVars>(
    preprocessor: PreprocessorFn<TVars$, TVars>,
  ): QueryBuilder<TVars$, TData, TError, TKey>;

  withPreprocessor<TVars$ = TVars>(
    preprocessor: PreprocessorFn<TVars$, TVars>,
  ): QueryBuilder<TVars$, TData, TError, TKey> {
    const newBuilder = this as unknown as QueryBuilder<TVars$, TData, TError, TKey>;

    return newBuilder.withConfig({
      preprocessorFn: createPreprocessorFunction(preprocessor, this.config.preprocessorFn || identityPreprocessor),
    });
  }

  withMiddleware(middleware: MiddlewareFn<TVars, TData, TError, TKey>): this;
  withMiddleware<TVars$ = TVars, TData$ = TData, TError$ = TError>(
    middleware: MiddlewareFn<TVars$, TData$, TError$, TKey>,
  ): QueryBuilder<TVars$, TData$, TError$, TKey>;

  withMiddleware<TVars$ = TVars, TData$ = TData, TError$ = TError>(
    middleware: MiddlewareFn<TVars$, TData$, TError$, TKey>,
    config?: Partial<QueryBuilderConfig<TVars$, TData$, TError$, TKey>>,
  ): QueryBuilder<TVars$, TData$, TError$, TKey> {
    const newBuilder = this as unknown as QueryBuilder<TVars$, TData$, TError$, TKey>;

    return newBuilder.withConfig({
      ...config,
      queryFn: createMiddlewareFunction(this.config.queryFn, middleware, newBuilder.config),
    });
  }

  static tagCacheId = 0;

  withTags(...tags: QueryTagOption<TVars, TData, TError>[]): this {
    if (this.config.queryClient) {
      this.config.syncChannel?.addEventListener('message', (event) => {
        const { type, data } = event.data;
        if (type === 'invalidate') {
          const queryClient = this.config.queryClient;
          if (queryClient) operateOnTags({ queryClient, tags: data });
        }
      });
    }

    return this.withMiddleware(createTagMiddleware(tags, QueryBuilder.tagCacheId++)) as unknown as this;
  }

  freeze(): QueryBuilderFrozen<TVars, TData, TError, TKey> {
    return this;
  }

  protected MutationBuilderConstructor: typeof MutationBuilder = MutationBuilder;

  asMutationBuilder(): MutationBuilder<TVars, TData, TError, TKey> {
    const { options, ...restConfig } = this.config;
    return new this.MutationBuilderConstructor(restConfig);
  }
}

type Updater<T> = T | undefined | ((oldData: T | undefined) => T | undefined);

export type QueryBuilderConfig<TVars, TData, TError, TKey extends unknown[]> = BuilderConfig<
  TVars,
  TData,
  TError,
  TKey
> & {
  options?: Partial<UseQueryOptions<TData, TError, TData, TKey> & { queryFn: FunctionType }>;
};
