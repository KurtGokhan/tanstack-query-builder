import { QueryClient } from '@tanstack/react-query';
import type { RequestError } from '../http/errors';
import type { ExtractPathParams, HttpMethod } from '../http/types';
import type { WithOptional } from '../type-utils';
import { QueryBuilder } from './QueryBuilder';
import { createHttpMergeVarsFn, createHttpQueryFn, createHttpQueryKeySanitizer } from './http-utils';
import { BuilderPaginationOptions } from './options';
import type { BuilderConfig, BuilderFlags } from './types';
import type { HttpBaseHeaders, HttpBaseParams, HttpBaseSearch, HttpBuilderVars } from './types';

export class HttpQueryBuilder<
  TParam = unknown,
  TSearch = unknown,
  TBody = unknown,
  THeader = unknown,
  TMeta = unknown,
  TData = unknown,
  TError = RequestError,
  TTags extends Record<string, unknown> = Record<string, unknown>,
  TFlags extends BuilderFlags = '',
  TKey extends [HttpBuilderVars] = [HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>],
> extends QueryBuilder<HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>, TData, TError, TKey, TTags, TFlags> {
  constructor(
    config?: WithOptional<BuilderConfig<HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>, TData, TError, TKey>, 'queryFn'>,
  ) {
    const mergeVars = config?.mergeVars || createHttpMergeVarsFn();
    const queryFn = config?.queryFn || createHttpQueryFn(mergeVars);
    const queryKeySanitizer = config?.queryKeySanitizer || createHttpQueryKeySanitizer();
    super({ mergeVars, queryFn, queryKeySanitizer, ...config });
  }

  withBody<TBody$>(body?: TBody$): HttpQueryBuilder<TParam, TSearch, TBody$, THeader, TMeta, TData, TError, TTags, TFlags> {
    if (!body) return this as any;
    return this.withVars({ body }) as any;
  }

  withHeaders<THeaders$ extends HttpBaseHeaders>(
    headers?: THeaders$,
  ): HttpQueryBuilder<TParam, TSearch, TBody, THeaders$, TMeta, TData, TError, TTags, TFlags> {
    if (!headers) return this as any;
    return this.withVars({ headers }) as any;
  }

  withParams<TParams$ extends HttpBaseParams>(
    params?: TParams$,
  ): HttpQueryBuilder<TParams$, TSearch, TBody, THeader, TMeta, TData, TError, TTags, TFlags> {
    if (!params) return this as any;
    return this.withVars({ params }) as any;
  }

  withSearch<TSearch$ extends HttpBaseSearch>(
    search?: TSearch$,
  ): HttpQueryBuilder<TParam, TSearch$, TBody, THeader, TMeta, TData, TError, TTags, TFlags> {
    if (!search) return this as any;
    return this.withVars({ search }) as any;
  }

  withMeta<TMeta$>(meta?: TMeta$): HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta$, TData, TError, TTags, TFlags> {
    if (!meta) return this as any;
    return this.withVars({ meta }) as any;
  }

  withPath<const TPath$ extends string>(
    path: TPath$,
  ): ExtractPathParams<TPath$> extends void
    ? this
    : HttpQueryBuilder<ExtractPathParams<TPath$>, TSearch, TBody, THeader, TMeta, TData, TError, TTags, TFlags> {
    return this.withVars({ path }) as any;
  }

  withBaseUrl(baseUrl: string): this {
    return this.withVars({ baseUrl }) as any;
  }

  withMethod(method: HttpMethod): this {
    return this.withVars({ method }) as any;
  }

  declare withData: <TData$>() => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData$, TError, TTags, TFlags, TKey>;
  declare withError: <TError$>() => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError$, TTags, TFlags, TKey>;
  declare withClient: (
    queryClient: QueryClient,
    opts?: { syncTagsWithOtherTabs?: boolean },
  ) => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError, TTags, TFlags | 'withClient', TKey>;

  declare withPagination: (
    paginationOptions: BuilderPaginationOptions<HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>, TData, TError, TKey>,
  ) => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError, TTags, TFlags | 'withPagination', TKey>;

  withTagTypes<TTag extends string, T = unknown>(): HttpQueryBuilder<
    TParam,
    TSearch,
    TBody,
    THeader,
    TMeta,
    TData,
    TError,
    TTags & Record<TTag, T>,
    TFlags,
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
    TFlags,
    TKey
  >;
  withTagTypes(): this {
    return this as any;
  }
}
