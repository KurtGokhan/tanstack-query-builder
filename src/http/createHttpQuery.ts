import { CreateQueryConfig, CreateQueryResult, CreateQueryTemplate, createQuery } from '../create/createQuery';
import { CreateQueryMergeVarsFn } from '../create/types';
import { ExtractPathParams } from '../http/types';
import { Prettify } from '../types/utils';

export type HttpQueryVarsTemplate = {
  body?: unknown;
  headers?: Record<string, string | string[]>;
  params?: Record<string, unknown>;
  search?: Record<string, unknown>;
};

export type HttpQueryVars = {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
  delay?: number;
  timeout?: number;
  abortable?: boolean;
};

export type CreateHttpQueryTemplate = CreateQueryTemplate & HttpQueryVarsTemplate;

type PickBody<T> = T extends { body: infer U } ? U : void;
type PickHeaders<T> = T extends { headers: infer U } ? U : void;
type PickParams<T, TUrl> = T extends { params: infer U } ? U : ExtractPathParams<TUrl>;
type PickSearch<T> = T extends { search: infer U } ? U : void;

type HttpQueryTemplateToQueryTemplate<T, TUrl> = Omit<T, 'body' | 'headers' | 'params' | 'search' | 'vars'> & {
  vars: Prettify<
    HttpQueryVars &
      (PickBody<T> extends void ? { body?: unknown } : { body: PickBody<T> }) &
      (PickHeaders<T> extends void ? { headers?: Record<string, string | string[]> } : { headers: PickHeaders<T> }) &
      (PickSearch<T> extends void ? { search?: Record<string, unknown> } : { search: PickSearch<T> }) &
      (PickParams<T, TUrl> extends void ? { params?: Record<string, unknown> } : { params: PickParams<T, TUrl> })
  >;
};

const mergeVars: CreateQueryMergeVarsFn<HttpQueryTemplateToQueryTemplate<any, any>['vars']> = (v1, v2) => {
  return {
    ...v1,
    ...v2,
    headers: {
      ...v1?.headers!,
      ...v2?.headers!,
    },
    params: {
      ...v1?.params!,
      ...v2?.params!,
    },
    search: {
      ...v1?.search!,
      ...v2?.search!,
    },
  };
};

export type CreateHttpQueryConfig<T> = CreateQueryConfig<T> & {};

export function createHttpQuery<const T extends CreateHttpQueryTemplate = CreateHttpQueryTemplate>(
  config?: CreateHttpQueryConfig<HttpQueryTemplateToQueryTemplate<T, string>>,
) {
  type TTemplate = HttpQueryTemplateToQueryTemplate<T, string>;

  const created = createQuery<TTemplate>({
    mergeVars: mergeVars as any,
    queryFn: () => ({}) as any,
    ...config,
  });

  return {
    ...created,
    withUrl<const TUrl extends string>(url: TUrl) {
      type TTemplateWithUrl = HttpQueryTemplateToQueryTemplate<T, TUrl>;
      return created.withVars({ url } as any) as unknown as CreateQueryResult<TTemplateWithUrl>;
    },
  };
}
