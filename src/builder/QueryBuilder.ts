import { QueryClient, QueryFunction, UseQueryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { QueryTagOption } from '../tags/types';
import { FunctionType, Prettify } from '../types/utils';
import { BuilderMergeVarsFn } from './types';
import { BuilderTypeTemplate, PrettifyWithVars } from './types';
import { mergeQueryOptions, mergeVars } from './utils';

export class QueryBuilderFrozen<T extends BuilderTypeTemplate> {
  constructor(protected config: QueryBuilderConfig<T>) {}

  getQueryKey: (vars: T['vars']) => [T['vars']] = (vars) => {
    return [mergeVars([this.config.vars, vars], this.config.mergeVars)] as const;
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

  withConfig(config: Partial<QueryBuilderConfig<T>>): QueryBuilder<T> {
    return new QueryBuilder<T>({ ...this.config, ...config });
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
