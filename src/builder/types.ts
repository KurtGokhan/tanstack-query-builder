import type { QueryClient, QueryFunctionContext, QueryKeyHashFunction, UseQueryResult } from '@tanstack/react-query';
import type { HttpRequestOptions } from '../http/types';
import { MakeRequiredIfNecessary, Prettify } from '../types/utils';

export type BuilderConfig<TVars, TData, TError, TKey extends unknown[]> = {
  queryFn: BuilderQueryFn<TVars, TData, TError, TKey>;
  queryKeyHashFn?: QueryKeyHashFunction<TKey>;
  vars?: Partial<TVars>;
  mergeVars?: BuilderMergeVarsFn<TVars>;
  queryClient?: QueryClient;
  syncChannel?: BroadcastChannel;
  preprocessorFn?: (vars: TVars) => TKey[0];
};

export type HttpBaseHeaders = Record<string, string | string[]>;
export type HttpBaseParams = Record<string | number, unknown>;
export type HttpBaseSearch = Record<string | number, unknown>;

export type HttpBuilderBaseVars = Omit<HttpRequestOptions, 'body' | 'headers' | 'params' | 'search' | 'meta'>;

export type HttpBuilderVars<
  TParam = unknown,
  TSearch = unknown,
  TBody = unknown,
  THeaders = unknown,
  TMeta = unknown,
> = Prettify<
  HttpBuilderBaseVars &
    MakeRequiredIfNecessary<{
      body?: TBody;
      headers?: THeaders;
      params?: TParam;
      search?: TSearch;
      meta?: TMeta;
    }>
>;

export type BuilderMergeVarsFn<TVars> = (
  vars1: TVars | Partial<TVars>,
  vars2: TVars | Partial<TVars>,
) => TVars | Partial<TVars>;

type QueriesResultItemType<TVars, TData, TError, TKey> = UseQueryResult<TData, TError>;
type QueriesResultMapType<TVars, TData, TError, TKey> = Record<
  PropertyKey,
  QueriesResultItemType<TVars, TData, TError, TKey>
>;
export type BuilderQueriesResult<TVars, TData, TError, TKey> = QueriesResultItemType<TVars, TData, TError, TKey>[] & {
  queryMap: QueriesResultMapType<TVars, TData, TError, TKey>;
};

export type BuilderQueryContext<TQueryKey extends unknown[]> = QueryFunctionContext<TQueryKey, never> & {
  originalQueryKey: unknown[];
};

export type BuilderQueryFn<TVars, TData, TError, TKey extends unknown[]> = (
  context: BuilderQueryContext<TKey>,
) => TData | Promise<TData>;
