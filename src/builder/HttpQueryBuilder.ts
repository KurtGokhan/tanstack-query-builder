import { RequestError } from '../http/errors';
import { ExtractPathParams, HttpMethod } from '../http/types';
import { WithOptional } from '../type-utils';
import { QueryBuilder } from './QueryBuilder';
import { BuilderConfig } from './types';
import { HttpBaseHeaders, HttpBaseParams, HttpBaseSearch, HttpBuilderVars } from './types';
import { createHttpMergeVarsFn, createHttpQueryFn, createHttpQueryKeySanitizer } from './utils';

export class HttpQueryBuilder<
  TParam = unknown,
  TSearch = unknown,
  TBody = unknown,
  THeader = unknown,
  TMeta = unknown,
  TData = unknown,
  TError = RequestError,
  TTags extends Record<string, unknown> = Record<string, unknown>,
  TKey extends [HttpBuilderVars] = [HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>],
> extends QueryBuilder<HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>, TData, TError, TKey, TTags> {
  constructor(
    config?: WithOptional<BuilderConfig<HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>, TData, TError, TKey>, 'queryFn'>,
  ) {
    const mergeVars = config?.mergeVars || createHttpMergeVarsFn();
    const queryFn = config?.queryFn || createHttpQueryFn(mergeVars);
    const queryKeySanitizer = config?.queryKeySanitizer || createHttpQueryKeySanitizer();
    super({ mergeVars, queryFn, queryKeySanitizer, ...config });
  }

  withBody<TBody$>(body?: TBody$): HttpQueryBuilder<TParam, TSearch, TBody$, THeader, TMeta, TData, TError, TTags> {
    if (!body) return this as any;
    return this.withVars({ body }) as any;
  }

  withHeaders<THeaders$ extends HttpBaseHeaders>(
    headers?: THeaders$,
  ): HttpQueryBuilder<TParam, TSearch, TBody, THeaders$, TMeta, TData, TError, TTags> {
    if (!headers) return this as any;
    return this.withVars({ headers }) as any;
  }

  withParams<TParams$ extends HttpBaseParams>(
    params?: TParams$,
  ): HttpQueryBuilder<TParams$, TSearch, TBody, THeader, TMeta, TData, TError, TTags> {
    if (!params) return this as any;
    return this.withVars({ params }) as any;
  }

  withSearch<TSearch$ extends HttpBaseSearch>(
    search?: TSearch$,
  ): HttpQueryBuilder<TParam, TSearch$, TBody, THeader, TMeta, TData, TError, TTags> {
    if (!search) return this as any;
    return this.withVars({ search }) as any;
  }

  withMeta<TMeta$>(meta?: TMeta$): HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta$, TData, TError, TTags> {
    if (!meta) return this as any;
    return this.withVars({ meta }) as any;
  }

  withPath<const TPath$ extends string>(
    path: TPath$,
  ): ExtractPathParams<TPath$> extends void
    ? this
    : HttpQueryBuilder<ExtractPathParams<TPath$>, TSearch, TBody, THeader, TMeta, TData, TError, TTags> {
    return this.withVars({ path }) as any;
  }

  withBaseUrl(baseUrl: string): this {
    return this.withVars({ baseUrl }) as any;
  }

  withMethod(method: HttpMethod): this {
    return this.withVars({ method }) as any;
  }

  declare withData: <TData$>() => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData$, TError, TTags, TKey>;
  declare withError: <TError$>() => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError$, TTags, TKey>;

  withTagTypes<TTag extends string, T = unknown>(): HttpQueryBuilder<
    TParam,
    TSearch,
    TBody,
    THeader,
    TMeta,
    TData,
    TError,
    TTags & Record<TTag, T>,
    TKey
  >;
  withTagTypes<TTags$ extends Record<string, unknown>>(): HttpQueryBuilder<
    TParam,
    TSearch,
    TBody,
    THeader,
    TMeta,
    TData,
    TError,
    TTags$,
    TKey
  >;
  withTagTypes(): this {
    return this as any;
  }
}
