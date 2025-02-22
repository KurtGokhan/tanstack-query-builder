import { UseQueryResult } from '@tanstack/react-query';
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

export type HttpBuilderBaseVars = {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
  delay?: number;
  timeout?: number;
  abortable?: boolean;
};

export interface HttpBuilderTypeTemplate extends BuilderTypeTemplate {
  data: unknown;
  error: unknown;
  vars: HttpBuilderBaseVars & {
    body?: unknown;
    headers?: unknown;
    params?: unknown;
    search?: unknown;
  };
}

export type BuilderMergeVarsFn<TVars> = (vars1: TVars, vars2: TVars | Partial<TVars>) => TVars;

export type PathParam = string | number | null | undefined;

export type ExtractPathParams<TPath> = Prettify<ExtractPathParamsInternal<TPath>>;

type ExtractPathParamsInternal<TPath> = TPath extends string
  ? string extends TPath
    ? unknown
    : TPath extends `${'http' | 'https'}://${infer TRest}`
      ? ExtractPathParamsInternal<TRest>
      : TPath extends `${string}:${infer TParam}/${infer TRest}`
        ? { [key in TParam]?: PathParam } & ExtractPathParamsInternal<TRest>
        : TPath extends `${string}:${infer TParam}`
          ? { [key in TParam]?: PathParam }
          : unknown
  : unknown;

type QueriesResultItemType<T extends BuilderTypeTemplate> = UseQueryResult<T['data'], T['error']>;
type QueriesResultMapType<T extends BuilderTypeTemplate> = Record<PropertyKey, QueriesResultItemType<T>>;
export type BuilderQueriesResult<T extends BuilderTypeTemplate> = QueriesResultItemType<T>[] & {
  queryMap: QueriesResultMapType<T>;
};
