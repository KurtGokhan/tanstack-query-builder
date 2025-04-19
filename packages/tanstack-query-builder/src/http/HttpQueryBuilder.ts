import { QueryClient } from '@tanstack/react-query';
import { QueryBuilder } from '../builder/QueryBuilder';
import { PostprocessorFn } from '../builder/createMiddlewareFunction';
import type { BuilderPaginationOptions } from '../builder/options';
import type { BuilderConfig, BuilderFlags } from '../builder/types';
import type { RequestError } from '../http/errors';
import { InferDataFromQueryTagOption, QueryTagObject, QueryTagOption } from '../tags/types';
import type { WithOptional } from '../type-utils';
import type { HttpBaseHeaders, HttpBaseParams, HttpBaseSearch, HttpBuilderVars } from './builder-types';
import { createHttpMergeVarsFn, createHttpQueryFn, createHttpQueryKeySanitizer } from './builder-utils';
import type { ExtractPathParams, HttpMethod } from './request-types';

/**
 * A builder for creating HTTP queries.
 * It allows you to define the path parameters, search parameters, body, headers, and metadata.
 * It also provides methods for setting the base URL, HTTP method, and other options.
 */
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

  /**
   * Defines the type of body of the request.
   * Optionally, you can pass the first argument to set the default body.
   */
  withBody<TBody$>(body?: TBody$): HttpQueryBuilder<TParam, TSearch, TBody$, THeader, TMeta, TData, TError, TTags, TFlags> {
    if (!body) return this as any;
    return this.withVars({ body }) as any;
  }

  /**
   * Defines the type of headers of the request.
   * Optionally, you can pass the first argument to set the default headers.
   */
  withHeaders<THeaders$ extends HttpBaseHeaders>(
    headers?: THeaders$,
  ): HttpQueryBuilder<TParam, TSearch, TBody, THeaders$, TMeta, TData, TError, TTags, TFlags> {
    if (!headers) return this as any;
    return this.withVars({ headers }) as any;
  }

  /**
   * Defines the type of path parameters of the request.
   * Optionally, you can pass the first argument to set the default parameters.
   * Note that when {@link withPath} is used, the path parameters are automatically extracted.
   * This method doesn't have to be used in that case.
   */
  withParams<TParams$ extends HttpBaseParams>(
    params?: TParams$,
  ): HttpQueryBuilder<TParams$, TSearch, TBody, THeader, TMeta, TData, TError, TTags, TFlags> {
    if (!params) return this as any;
    return this.withVars({ params }) as any;
  }

  /**
   * Defines the type of search parameters of the request.
   * Optionally, you can pass the first argument to set the default search parameters.
   */
  withSearch<TSearch$ extends HttpBaseSearch>(
    search?: TSearch$,
  ): HttpQueryBuilder<TParam, TSearch$, TBody, THeader, TMeta, TData, TError, TTags, TFlags> {
    if (!search) return this as any;
    return this.withVars({ search }) as any;
  }

  /**
   * Defines the type of metadata of the request.
   * Optionally, you can pass the first argument to set the default metadata.
   */
  withMeta<TMeta$>(meta?: TMeta$): HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta$, TData, TError, TTags, TFlags> {
    if (!meta) return this as any;
    return this.withVars({ meta }) as any;
  }

  /**
   * Sets the path for the HTTP request.
   * The path can contain path parameters which are defined with the format `/path/:param1/:param2`.
   * The path parameters are automatically extracted and typed strongly as if declared with {@link withParams}.
   */
  withPath<const TPath$ extends string>(
    path: TPath$,
  ): ExtractPathParams<TPath$> extends void
    ? this
    : HttpQueryBuilder<ExtractPathParams<TPath$>, TSearch, TBody, THeader, TMeta, TData, TError, TTags, TFlags> {
    return this.withVars({ path }) as any;
  }

  /**
   * Sets the base URL for the HTTP request.
   * The base URL will be prepended to relative URLs.
   */
  withBaseUrl(baseUrl: string): this {
    return this.withVars({ baseUrl }) as any;
  }

  /**
   * SSets the HTTP method for the request.
   * The method can be one of the following: `get`, `post`, `put`, `patch`, `delete`, `options`, `head`.
   * The default method is `get`.
   */
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

  declare withTags: <
    const TTagOpt extends QueryTagOption<
      HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>,
      TData,
      TError,
      QueryTagObject<TTags>,
      TTags
    >,
  >(
    primaryTag: TTagOpt,
    ...otherTags: QueryTagOption<HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>, TData, TError, QueryTagObject<TTags>, TTags>[]
  ) => unknown extends TData
    ? HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, InferDataFromQueryTagOption<TTagOpt, TTags>, TError, TTags, TFlags, TKey>
    : this;

  declare withPostprocessor: <TData$ = TData>(
    postprocessor: PostprocessorFn<TData, TData$>,
  ) => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData$, TError, TTags, TFlags, TKey>;

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

  declare asBound: () => HttpQueryBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError, TTags, TFlags | 'bound', TKey>;
}
