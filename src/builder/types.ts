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

export type HttpQueryBaseVars = {
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
  vars: HttpQueryBaseVars & {
    body?: unknown;
    headers?: unknown;
    params?: unknown;
    search?: unknown;
  };
}
