import { QueryFunctionContext, UseQueryResult } from '@tanstack/react-query';
import { RequestError } from '../http/errors';
import { HttpRequestOptions } from '../http/types';
import { Prettify } from '../types/utils';

export type PrettifyWithVars<T extends BuilderTypeTemplate, TVars> = Prettify<
  Omit<T, 'vars'> & { vars: Prettify<T['vars'] & TVars> }
>;

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

export type PathParam = string | number | null | undefined;

type QueriesResultItemType<T extends BuilderTypeTemplate> = UseQueryResult<T['data'], T['error']>;
type QueriesResultMapType<T extends BuilderTypeTemplate> = Record<PropertyKey, QueriesResultItemType<T>>;
export type BuilderQueriesResult<T extends BuilderTypeTemplate> = QueriesResultItemType<T>[] & {
  queryMap: QueriesResultMapType<T>;
};

export type BuilderQueryFn<TData, TVars> = (context: Partial<QueryFunctionContext<[TVars]>>) => TData | Promise<TData>;
