import { QueryClient } from '@tanstack/react-query';
import { QueryBuilder } from '../builder/QueryBuilder';
import type { BuilderPaginationOptions } from '../builder/options';
import type { BuilderConfig, BuilderFlags } from '../builder/types';
import type { RequestError } from '../http/errors';
import type { WithOptional } from '../type-utils';
import type { HttpBaseHeaders, HttpBaseParams, HttpBaseSearch, HttpBuilderVars } from './builder-types';
import { createHttpMergeVarsFn, createHttpQueryFn, createHttpQueryKeySanitizer } from './builder-utils';
import type { ExtractPathParams, HttpMethod } from './request-types';

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

  withBody<TBody$>(this: this, body?: TBody$): HttpQueryBuilder<TParam, TSearch, TBody$, THeader, TMeta, TData, TError, TTags, TFlags> {
    if (!body) return this as any;
    return this.withVars({ body }) as any;
  }

  withHeaders<THeaders$ extends HttpBaseHeaders>(
    this: this,
    headers?: THeaders$,
  ): HttpQueryBuilder<TParam, TSearch, TBody, THeaders$, TMeta, TData, TError, TTags, TFlags> {
    if (!headers) return this as any;
    return this.withVars({ headers }) as any;
  }

  withParams<TParams$ extends HttpBaseParams>(
    this: this,
    params?: TParams$,
  ): HttpQueryBuilder<TParams$, TSearch, TBody, THeader, TMeta, TData, TError, TTags, TFlags> {
    if (!params) return this as any;
    return this.withVars({ params }) as any;
  }

  withSearch<TSearch$ extends HttpBaseSearch>(
    this: this,
    search?: TSearch$,
  ): HttpQueryBuilder<TParam, TSearch$, TBody, THeader, TMeta, TData, TError, TTags, TFlags> {
    if (!search) return this as any;
    return this.withVars({ search }) as any;
  }

  withMeta<TMeta$>(this: this, meta?: TMeta$): HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta$, TData, TError, TTags, TFlags> {
    if (!meta) return this as any;
    return this.withVars({ meta }) as any;
  }

  withPath<const TPath$ extends string>(
    this: this,
    path: TPath$,
  ): ExtractPathParams<TPath$> extends void
    ? this
    : HttpQueryBuilder<ExtractPathParams<TPath$>, TSearch, TBody, THeader, TMeta, TData, TError, TTags, TFlags> {
    return this.withVars({ path }) as any;
  }

  withBaseUrl(this: this, baseUrl: string): this {
    return this.withVars({ baseUrl }) as any;
  }

  withMethod(this: this, method: HttpMethod): this {
    return this.withVars({ method }) as any;
  }

  declare withData: <TData$>(this: this) => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData$, TError, TTags, TFlags, TKey>;
  declare withError: <TError$>(this: this) => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError$, TTags, TFlags, TKey>;
  declare withClient: (
    this: this,
    queryClient: QueryClient,
    opts?: { syncTagsWithOtherTabs?: boolean },
  ) => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError, TTags, TFlags | 'withClient', TKey>;

  declare withPagination: (
    this: this,
    paginationOptions: BuilderPaginationOptions<HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>, TData, TError, TKey>,
  ) => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError, TTags, TFlags | 'withPagination', TKey>;

  withTagTypes<TTag extends string, T = unknown>(
    this: this,
  ): HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError, TTags & Record<TTag, T>, TFlags, TKey>;
  withTagTypes<TTags$ extends Record<string, unknown>>(
    this: this,
  ): HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError, TTags$, TFlags, TKey>;
  withTagTypes(this: this): this {
    return this as any;
  }

  declare asBound: (this: this) => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError, TTags, TFlags | 'bound', TKey>;
}
