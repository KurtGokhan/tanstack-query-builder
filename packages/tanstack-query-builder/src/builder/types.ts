import type { QueryClient, QueryFunctionContext, QueryKey, UseQueryResult } from '@tanstack/react-query';
import type { HttpRequestOptions } from '../http/types';
import type { HasFlag, Prettify } from '../type-utils';
import type { BuilderOptions, BuilderPaginationOptions } from './options';

export type BuilderConfig<TVars, TData, TError, TKey extends unknown[]> = {
  queryFn: BuilderQueryFn<TVars, TData, TError, TKey>;
  queryKeySanitizer?: BuilderKeySanitizerFn<TKey>;
  vars?: Partial<TVars>;
  mergeVars?: BuilderMergeVarsFn<TVars>;
  queryClient?: QueryClient;
  syncChannel?: BroadcastChannel;
  preprocessorFn?: (vars: TVars) => TKey[0];
  options?: BuilderOptions<TVars, TData, TError, TKey>;
  paginationOptions?: BuilderPaginationOptions<TVars, TData, TError, TKey>;
};

export type HttpBaseHeaders = Record<string, string | string[]>;
export type HttpBaseParams = Record<string | number, unknown>;
export type HttpBaseSearch = Record<string | number, unknown>;

export type HttpBuilderBaseVars = Omit<HttpRequestOptions, 'body' | 'headers' | 'params' | 'search' | 'meta'>;

type WhenRequired<T, TReq> = T extends undefined
  ? Partial<TReq>
  : unknown extends T
    ? Partial<TReq>
    : T extends null
      ? Partial<TReq>
      : Partial<T> extends T
        ? Partial<TReq>
        : TReq;

export type HttpBuilderVars<TParam = unknown, TSearch = unknown, TBody = unknown, THeaders = unknown, TMeta = unknown> = Prettify<
  HttpBuilderBaseVars &
    WhenRequired<TParam, { params: TParam }> &
    WhenRequired<TSearch, { search: TSearch }> &
    WhenRequired<TBody, { body: TBody }> &
    WhenRequired<THeaders, { headers: THeaders }> &
    WhenRequired<TMeta, { meta: TMeta }>
>;

export type BuilderMergeVarsFn<TVars> = (vars1: TVars | Partial<TVars>, vars2: TVars | Partial<TVars>) => TVars | Partial<TVars>;

type QueriesResultItemType<TVars, TData, TError, TKey> = UseQueryResult<TData, TError>;
type QueriesResultMapType<TVars, TData, TError, TKey> = Record<PropertyKey, QueriesResultItemType<TVars, TData, TError, TKey>>;
export type BuilderQueriesResult<TVars, TData, TError, TKey> = QueriesResultItemType<TVars, TData, TError, TKey>[] & {
  queryMap: QueriesResultMapType<TVars, TData, TError, TKey>;
};

export type BuilderQueryContext<TQueryKey extends unknown[]> = QueryFunctionContext<TQueryKey, never> & {
  originalQueryKey: unknown[];
  operationType: 'query' | 'mutation' | 'infiniteQuery' | 'queries';
};

export type BuilderQueryFn<TVars, TData, TError, TKey extends unknown[]> = (context: BuilderQueryContext<TKey>) => TData | Promise<TData>;

export type BuilderKeySanitizerFn<TKey extends unknown[]> = (key: TKey) => QueryKey;

export type HasClient<TFlags extends BuilderFlags, TTruthy = true> = HasFlag<TFlags, 'withClient', TTruthy>;
export type HasPagination<TFlags extends BuilderFlags, TTruthy = true> = HasFlag<TFlags, 'withPagination', TTruthy>;

export type BuilderFlags = '' | 'withClient' | 'withPagination';
