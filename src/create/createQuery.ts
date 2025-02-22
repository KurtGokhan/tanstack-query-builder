import {
  QueryClient,
  QueryFunction,
  UseQueryOptions,
  UseSuspenseQueryOptions,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { QueryTagOption } from '../tags/types';
import { CreateQueryMergeVarsFn } from './types';
import { mergeQueryOptions, mergeVars } from './utils';

export type CreateQueryTemplate = {
  data?: unknown;
  error?: unknown;
  vars?: unknown;
};

export type CreatedQueryOptions<T> = Omit<
  Partial<UseQueryOptions<PickData<T>, PickError<T>, PickData<T>, PickKey<T>>>,
  'queryFn'
>;

type PickData<T> = T extends { data: infer U } ? U : unknown;
type PickError<T> = T extends { error: infer U } ? U : unknown;
type PickVars<T> = T extends { vars: infer U } ? U : unknown;
type PickKey<T> = [PickVars<T>];
type PickQueryFn<T> = QueryFunction<PickData<T>, PickKey<T>>;

export type CreateQueryConfig<T> = {
  queryFn: PickQueryFn<T>;
  vars?: Partial<PickVars<T>>;
  mergeVars?: CreateQueryMergeVarsFn<PickVars<T>>;

  tags?: QueryTagOption<PickVars<T>, PickData<T>, PickError<T>>;

  options?: CreatedQueryOptions<T>;
  queryClient?: QueryClient;
};

export type CreateQueryResult<T> = {
  getQueryKey: (vars: PickVars<T>) => PickKey<T>;

  getQueryOptions: (
    vars: PickVars<T>,
    opts?: CreatedQueryOptions<T>,
  ) => UseQueryOptions<PickData<T>, PickError<T>, PickData<T>, PickKey<T>> &
    UseSuspenseQueryOptions<PickData<T>, PickError<T>, PickData<T>, PickKey<T>>;

  useQuery: (
    vars: PickVars<T>,
    opts?: CreatedQueryOptions<T>,
  ) => ReturnType<typeof useQuery<PickData<T>, PickError<T>, PickData<T>, PickKey<T>>>;

  useSuspenseQuery: (
    vars: PickVars<T>,
    opts?: CreatedQueryOptions<T>,
  ) => ReturnType<typeof useSuspenseQuery<PickData<T>, PickError<T>, PickData<T>, PickKey<T>>>;

  withVars: (vars: Partial<PickVars<T>>) => CreateQueryResult<T>;
};

export function createQuery<T extends CreateQueryTemplate>(config: CreateQueryConfig<T>): CreateQueryResult<T> {
  type TData = PickData<T>;
  type TSel = PickData<T>;
  type TError = PickError<T>;
  type TVars = PickVars<T>;
  type TKey = PickKey<T>;

  type TResult = CreateQueryResult<T>;

  const result: TResult = {
    getQueryKey(vars) {
      return [mergeVars([config.vars as TVars, vars], config.mergeVars)] as const;
    },

    getQueryOptions(vars, opts) {
      return mergeQueryOptions([
        {
          queryFn: config.queryFn,
          queryKey: result.getQueryKey(vars),
          meta: { tags: config.tags },
        },
        config.options,
        opts,
      ]);
    },

    useQuery(vars, opts) {
      return useQuery<TData, TError, TSel, TKey>(result.getQueryOptions(vars, opts), config.queryClient);
    },

    useSuspenseQuery(vars, opts) {
      return useSuspenseQuery<TData, TError, TSel, TKey>(result.getQueryOptions(vars, opts), config.queryClient);
    },

    withVars(vars) {
      return createQuery<T>({ ...config, vars: mergeVars([config?.vars as TVars, vars], config.mergeVars) });
    },
  };

  return result;
}
