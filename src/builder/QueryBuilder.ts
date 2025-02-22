import {
  QueryClient,
  QueryFilters,
  QueryFunction,
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
import { BuilderMergeVarsFn, BuilderQueriesResult } from './types';
import { BuilderTypeTemplate, PrettifyWithVars } from './types';
import { mergeQueryOptions, mergeVars } from './utils';

export class QueryBuilderFrozen<T extends BuilderTypeTemplate> {
  constructor(protected config: QueryBuilderConfig<T>) {}

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

  getQueryKey: (vars: T['vars']) => [T['vars']] = (vars) => {
    return [this.mergeVars([this.config.vars, vars])] as const;
  };

  getQueryOptions: (
    vars: T['vars'],
    opts?: QueryBuilderConfig<T>['options'],
  ) => UseQueryOptions<T['data'], T['error'], T['data'], [T['vars']]> & { queryFn: FunctionType } = (vars, opts) => {
    return mergeQueryOptions([
      {
        queryFn: this.config.queryFn,
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
}

export class QueryBuilder<T extends BuilderTypeTemplate = BuilderTypeTemplate> extends QueryBuilderFrozen<T> {
  withVars<TVars>(vars?: TVars): QueryBuilder<PrettifyWithVars<T, TVars>> {
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
}

export type QueryBuilderConfig<T extends BuilderTypeTemplate> = {
  queryFn: QueryFunction<T['data'], [T['vars']]>;
  vars?: Partial<T['vars']>;
  mergeVars?: BuilderMergeVarsFn<T['vars']>;

  tags?: QueryTagOption<T['vars'], T['data'], T['error']>;

  options?: Partial<UseQueryOptions<T['data'], T['error'], T['data'], [T['vars']]> & { queryFn: FunctionType }>;

  queryClient?: QueryClient;
};
