import type { QueryFunction, UseQueryResult } from '@tanstack/react-query';
import type { RequestError } from '../http/errors';
import type { HttpRequestOptions } from '../http/types';
import type { Prettify } from '../types/utils';

export interface BuilderTypeTemplate {
  data: unknown;
  error: unknown;
  vars: unknown;
}

export type HttpBaseHeaders = Record<string, string | string[]>;
export type HttpBaseParams = Record<string | number, unknown>;
export type HttpBaseSearch = Record<string | number, unknown>;

export type HttpBuilderBaseVars = Omit<HttpRequestOptions, 'body' | 'headers' | 'params' | 'search'>;

export interface HttpBuilderTypeTemplate extends BuilderTypeTemplate {
  data: unknown;
  error: RequestError;
  vars: HttpBuilderBaseVars & {
    body?: unknown;
    headers?: unknown;
    params?: unknown;
    search?: unknown;
  };
}

export type BuilderMergeVarsFn<TVars> = (vars1: TVars, vars2: TVars | Partial<TVars>) => TVars;

type QueriesResultItemType<T extends BuilderTypeTemplate> = UseQueryResult<T['data'], T['error']>;
type QueriesResultMapType<T extends BuilderTypeTemplate> = Record<PropertyKey, QueriesResultItemType<T>>;
export type BuilderQueriesResult<T extends BuilderTypeTemplate> = QueriesResultItemType<T>[] & {
  queryMap: QueriesResultMapType<T>;
};

export type BuilderQueryFn<T extends BuilderTypeTemplate> = QueryFunction<T['data'], [T['vars']]>;

export type SetDataType<T extends BuilderTypeTemplate, TData> = Prettify<Omit<T, 'data'> & { data: TData }>;

export type SetErrorType<T extends BuilderTypeTemplate, TError> = Prettify<Omit<T, 'error'> & { error: TError }>;

export type AppendVarsType<T extends BuilderTypeTemplate, TVars, TResetVars extends boolean = false> = Prettify<
  Omit<T, 'vars'> & { vars: Prettify<(TResetVars extends true ? unknown : T['vars']) & TVars> }
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
