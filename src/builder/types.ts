import type { QueryClient, QueryFunctionContext, QueryKeyHashFunction, UseQueryResult } from '@tanstack/react-query';
import type { RequestError } from '../http/errors';
import type { HttpRequestOptions } from '../http/types';
import type { Prettify } from '../types/utils';

export interface BuilderTypeTemplate {
  data: unknown;
  error: unknown;
  vars: unknown;
  queryKey: unknown[];
}

export type BuilderConfig<T extends BuilderTypeTemplate> = {
  queryFn: BuilderQueryFn<T>;
  queryKeyHashFn?: QueryKeyHashFunction<T['queryKey']>;
  vars?: Partial<T['vars']>;
  mergeVars?: BuilderMergeVarsFn<T['vars']>;
  queryClient?: QueryClient;
  syncChannel?: BroadcastChannel;
  preprocessorFn?: (vars: T['vars']) => T['queryKey'][0];
};

export type HttpBaseHeaders = Record<string, string | string[]>;
export type HttpBaseParams = Record<string | number, unknown>;
export type HttpBaseSearch = Record<string | number, unknown>;

export type HttpBuilderBaseVars = Omit<HttpRequestOptions, 'body' | 'headers' | 'params' | 'search'>;

export type HttpBuilderVars = HttpBuilderBaseVars & {
  body?: unknown;
  headers?: unknown;
  params?: unknown;
  search?: unknown;
};

export interface HttpBuilderTypeTemplate extends BuilderTypeTemplate {
  data: unknown;
  error: RequestError;
  vars: HttpBuilderVars;
  queryKey: [HttpBuilderVars];
}

export type BuilderMergeVarsFn<TVars> = (vars1: TVars, vars2: TVars | Partial<TVars>) => TVars;

type QueriesResultItemType<T extends BuilderTypeTemplate> = UseQueryResult<T['data'], T['error']>;
type QueriesResultMapType<T extends BuilderTypeTemplate> = Record<PropertyKey, QueriesResultItemType<T>>;
export type BuilderQueriesResult<T extends BuilderTypeTemplate> = QueriesResultItemType<T>[] & {
  queryMap: QueriesResultMapType<T>;
};

export type BuilderQueryContext<TQueryKey extends unknown[]> = QueryFunctionContext<TQueryKey, never> & {
  originalQueryKey: unknown[];
};

export type BuilderQueryFn<T extends BuilderTypeTemplate> = (
  context: BuilderQueryContext<T['queryKey']>,
) => T['data'] | Promise<T['data']>;

export type SetDataType<T extends BuilderTypeTemplate, TData> = Prettify<Omit<T, 'data'> & { data: TData }>;

export type SetErrorType<T extends BuilderTypeTemplate, TError> = Prettify<Omit<T, 'error'> & { error: TError }>;

export type AppendVarsType<
  T extends BuilderTypeTemplate,
  TVars,
  TResetVars extends boolean = false,
  TKeepQueryKey extends boolean = false,
> = Prettify<
  Omit<T, 'vars' | 'queryKey'> & {
    vars: Prettify<(TResetVars extends true ? unknown : T['vars']) & TVars>;
  } & (TKeepQueryKey extends true
      ? {
          queryKey: T['queryKey'];
        }
      : {
          queryKey: [Prettify<(TResetVars extends true ? unknown : T['vars']) & TVars>];
        })
>;

export type SetAllTypes<
  T extends BuilderTypeTemplate,
  TData,
  TError,
  TVars,
  TResetVars extends boolean = false,
> = Prettify<
  Omit<T, 'data' | 'error' | 'vars'> & {
    data: TData;
    error: TError;
    vars: (TResetVars extends true ? unknown : T['vars']) & TVars;
  }
>;
