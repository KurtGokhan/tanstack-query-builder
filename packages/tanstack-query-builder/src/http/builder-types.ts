import type { Prettify, WhenRequired } from '../type-utils';
import type { HttpRequestOptions } from './request-types';

export type HttpBaseHeaders = Record<string, string | string[]>;
export type HttpBaseParams = Record<string | number, unknown>;
export type HttpBaseSearch = Record<string | number, unknown>;

export type HttpBuilderBaseVars = Omit<HttpRequestOptions, 'body' | 'headers' | 'params' | 'search' | 'meta'>;

export type HttpBuilderVars<TParam = unknown, TSearch = unknown, TBody = unknown, THeaders = unknown, TMeta = unknown> = Prettify<
  HttpBuilderBaseVars &
    WhenRequired<TParam, { params: TParam }> &
    WhenRequired<TSearch, { search: TSearch }> &
    WhenRequired<TBody, { body: TBody }> &
    WhenRequired<THeaders, { headers: THeaders }> &
    WhenRequired<TMeta, { meta: TMeta }>
>;
