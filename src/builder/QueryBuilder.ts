import {
  CancelOptions,
  DataTag,
  InvalidateOptions,
  QueryClient,
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
import { mergeTagOptions } from '../tags/mergeTagOptions';
import { QueryTagOption } from '../tags/types';
import { FunctionType, Prettify } from '../types/utils';
import { MutationBuilder } from './MutationBuilder';
import { BuilderMergeVarsFn, BuilderQueriesResult, BuilderQueryFn } from './types';
import { BuilderTypeTemplate, PrettifyWithVars } from './types';
import { mergeQueryOptions, mergeVars } from './utils';

export class QueryBuilderFrozen<T extends BuilderTypeTemplate> {
  constructor(public config: QueryBuilderConfig<T>) {}

  protected mergeConfigs: (
    config: QueryBuilderConfig<T>,
    other: Partial<QueryBuilderConfig<T>>,
  ) => QueryBuilderConfig<T> = (config, other) => {
    return {
      ...config,
      ...other,
      tags: mergeTagOptions([config.tags, other.tags]),
      vars: mergeVars([config.vars, other.vars], other.mergeVars || config.mergeVars),
      options: mergeQueryOptions([config.options, other.options]),
    };
  };

  protected mergeVars: (list: [T['vars'], ...Partial<T['vars']>[]]) => T['vars'] = (list) => {
    return mergeVars(list, this.config.mergeVars);
  };

  getQueryFn: () => QueryFunction<T['data'], [T['vars']]> = () => {
    return ({ client, meta, queryKey, signal, pageParam }) => {
      return this.config.queryFn({ client, meta, queryKey, signal, pageParam });
    };
  };

  getQueryKey: (vars: T['vars']) => DataTag<[T['vars']], T['data'], T['error']> = (vars) => {
    return [this.mergeVars([this.config.vars, vars])] as DataTag<[T['vars']], T['data'], T['error']>;
  };

  getQueryOptions: (
    vars: T['vars'],
    opts?: QueryBuilderConfig<T>['options'],
  ) => UseQueryOptions<T['data'], T['error'], T['data'], [T['vars']]> & { queryFn: FunctionType } = (vars, opts) => {
    return mergeQueryOptions([
      {
        queryFn: this.getQueryFn(),
        queryKey: this.getQueryKey(vars),
        meta: { tags: this.config.tags },
      },
      this.config.options,
      opts,
    ]);
  };

  useQuery: (
    vars: T['vars'],
    opts?: QueryBuilderConfig<T>['options'],
  ) => ReturnType<typeof useQuery<T['data'], T['error'], T['data'], [T['vars']]>> = (vars, opts) => {
    return useQuery(this.getQueryOptions(vars, opts), this.config.queryClient);
  };

  useSuspenseQuery: (
    vars: T['vars'],
    opts?: QueryBuilderConfig<T>['options'],
  ) => ReturnType<typeof useSuspenseQuery<T['data'], T['error'], T['data'], [T['vars']]>> = (vars, opts) => {
    return useSuspenseQuery(this.getQueryOptions(vars, opts), this.config.queryClient);
  };

  usePrefetchQuery: (
    vars: T['vars'],
    opts?: QueryBuilderConfig<T>['options'],
  ) => ReturnType<typeof usePrefetchQuery<T['data'], T['error'], T['data'], [T['vars']]>> = (vars, opts) => {
    return usePrefetchQuery(this.getQueryOptions(vars, opts), this.config.queryClient);
  };

  useIsFetching: (vars: T['vars'], filters?: QueryFilters) => number = (vars, filters) => {
    return useIsFetching({ queryKey: this.getQueryKey(vars), ...filters }, this.config.queryClient);
  };

  private useQueriesInternal: (useHook: typeof useQueries | typeof useSuspenseQueries) => (
    queries: {
      vars: T['vars'];
      options?: QueryBuilderConfig<T>['options'];
      mapKey?: PropertyKey;
    }[],
    sharedVars?: T['vars'],
    sharedOpts?: QueryBuilderConfig<T>['options'],
  ) => BuilderQueriesResult<T> = (useHook) => (queries, sharedVars, sharedOpts) => {
    type ResultType = BuilderQueriesResult<T>;

    const mapKeys = queries.map((q) => q.mapKey);

    const queryList = queries.map(({ vars, options }) =>
      this.getQueryOptions(this.mergeVars([sharedVars, vars]), mergeQueryOptions([sharedOpts, options])),
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

  private _client?: QueryBuilderClient<T>;
  get client() {
    return (this._client ??= new QueryBuilderClient(this));
  }
}

class QueryBuilderClient<
  T extends BuilderTypeTemplate,
  TFilters = QueryFilters<T['data'], T['error'], T['data'], [T['vars']]>,
> {
  constructor(private builder: QueryBuilderFrozen<T>) {}

  readonly ensureData = (vars: T['vars'], opts?: QueryBuilderConfig<T>['options']) =>
    this.builder.config.queryClient?.ensureQueryData(this.builder.getQueryOptions(vars, opts));

  readonly refetch = (vars: T['vars'], filters?: TFilters, opts?: RefetchOptions) =>
    this.builder.config.queryClient?.refetchQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly fetch = (vars: T['vars'], opts?: QueryBuilderConfig<T>['options']) =>
    this.builder.config.queryClient?.fetchQuery(this.builder.getQueryOptions(vars, opts));

  readonly isFetching = (vars: T['vars'], filters?: TFilters) =>
    this.builder.config.queryClient?.isFetching({ queryKey: this.builder.getQueryKey(vars), ...filters });

  readonly prefetch = (vars: T['vars'], opts?: QueryBuilderConfig<T>['options']) =>
    this.builder.config.queryClient?.prefetchQuery(this.builder.getQueryOptions(vars, opts));

  readonly reset = (vars: T['vars'], filters?: TFilters, opts?: ResetOptions) =>
    this.builder.config.queryClient?.resetQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly remove = (vars: T['vars'], filters?: TFilters) =>
    this.builder.config.queryClient?.removeQueries({ queryKey: this.builder.getQueryKey(vars), ...filters });

  readonly cancel = (vars: T['vars'], filters?: TFilters, opts?: CancelOptions) =>
    this.builder.config.queryClient?.cancelQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly invalidate = (vars: T['vars'], filters?: TFilters, opts?: InvalidateOptions) =>
    this.builder.config.queryClient?.invalidateQueries({ queryKey: this.builder.getQueryKey(vars), ...filters }, opts);

  readonly getData = (vars: T['vars']) =>
    this.builder.config.queryClient?.getQueryData<T['data']>(this.builder.getQueryKey(vars));

  readonly setData = (vars: T['vars'], updater: Updater<T['data']>, opts?: SetDataOptions) =>
    this.builder.config.queryClient?.setQueryData(this.builder.getQueryKey(vars), updater, opts);

  readonly getState = (vars: T['vars']) =>
    this.builder.config.queryClient?.getQueryState<T['data'], T['error']>(this.builder.getQueryKey(vars));
}

export class QueryBuilder<T extends BuilderTypeTemplate = BuilderTypeTemplate> extends QueryBuilderFrozen<T> {
  withVars<TVars = T['vars']>(vars?: TVars): QueryBuilder<PrettifyWithVars<T, Partial<TVars>>> {
    if (!vars) return this as any;

    return this.withConfig({
      vars: mergeVars([this.config.vars, vars], this.config.mergeVars),
    }) as any;
  }

  withData<TData>(): QueryBuilder<Prettify<T & { data: TData }>> {
    return this as any;
  }

  withError<TError>(): QueryBuilder<Prettify<T & { error: TError }>> {
    return this as any;
  }

  withConfig(config: Partial<QueryBuilderConfig<T>>): this {
    const ctor = this.constructor as typeof QueryBuilder;
    const newConfig = this.mergeConfigs(this.config, config);
    return new ctor<T>(newConfig) as this;
  }

  freeze(): QueryBuilderFrozen<T> {
    return this;
  }

  protected MutationBuilderConstructor: typeof MutationBuilder = MutationBuilder;

  asMutationBuilder(): MutationBuilder<T> {
    return new this.MutationBuilderConstructor({
      queryFn: this.config.queryFn,
      queryClient: this.config.queryClient,
      mergeVars: this.config.mergeVars,
      vars: this.config.vars,
    });
  }
}

type Updater<T> = T | undefined | ((oldData: T | undefined) => T | undefined);

export type QueryBuilderConfig<T extends BuilderTypeTemplate> = {
  queryFn: BuilderQueryFn<T>;
  vars?: Partial<T['vars']>;
  mergeVars?: BuilderMergeVarsFn<T['vars']>;

  tags?: QueryTagOption<T['vars'], T['data'], T['error']>;

  options?: Partial<UseQueryOptions<T['data'], T['error'], T['data'], [T['vars']]> & { queryFn: FunctionType }>;

  queryClient?: QueryClient;
};
