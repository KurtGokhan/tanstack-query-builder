import { RequestError } from '../http/errors';
import { ExtractPathParams, HttpMethod } from '../http/types';
import { WithOptional } from '../types/utils';
import { MutationBuilder } from './MutationBuilder';
import { MutationBuilderConfig } from './MutationBuilderFrozen';
import { HttpBaseHeaders, HttpBaseParams, HttpBaseSearch, HttpBuilderVars } from './types';
import { createHttpQueryFn, createHttpQueryHashFn } from './utils';
import { createHttpMergeVarsFn } from './utils';

export class HttpMutationBuilder<
  TParam = unknown,
  TSearch = unknown,
  TBody = unknown,
  THeader = unknown,
  TMeta = unknown,
  TData = unknown,
  TError = RequestError,
  TTags extends Record<string, unknown> = Record<string, unknown>,
  TKey extends [HttpBuilderVars] = [HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>],
> extends MutationBuilder<HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>, TData, TError, TKey, TTags> {
  constructor(
    config?: WithOptional<MutationBuilderConfig<HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>, TData, TError, TKey>, 'queryFn'>,
  ) {
    const mergeVars = config?.mergeVars || createHttpMergeVarsFn();
    const queryFn = config?.queryFn || createHttpQueryFn(mergeVars);
    const queryKeyHashFn = config?.queryKeyHashFn || createHttpQueryHashFn();

    super({
      mergeVars,
      queryFn,
      queryKeyHashFn,
      ...config,
      vars: {
        method: 'post',
        ...config?.vars!,
      },
    });
  }

  withBody<TBody$>(body?: TBody$): HttpMutationBuilder<TParam, TSearch, TBody$, THeader, TMeta, TData, TError, TTags> {
    if (!body) return this as any;
    return this.withVars({ body }) as any;
  }

  withHeaders<THeaders$ extends HttpBaseHeaders>(
    headers?: THeaders$,
  ): HttpMutationBuilder<TParam, TSearch, TBody, THeaders$, TMeta, TData, TError, TTags> {
    if (!headers) return this as any;
    return this.withVars({ headers }) as any;
  }

  withParams<TParams$ extends HttpBaseParams>(
    params?: TParams$,
  ): HttpMutationBuilder<TParams$, TSearch, TBody, THeader, TMeta, TData, TError, TTags> {
    if (!params) return this as any;
    return this.withVars({ params }) as any;
  }

  withSearch<TSearch$ extends HttpBaseSearch>(
    search?: TSearch$,
  ): HttpMutationBuilder<TParam, TSearch$, TBody, THeader, TMeta, TData, TError, TTags> {
    if (!search) return this as any;
    return this.withVars({ search }) as any;
  }

  withMeta<TMeta$>(meta?: TMeta$): HttpMutationBuilder<TParam, TSearch, TBody, THeader, TMeta$, TData, TError, TTags> {
    if (!meta) return this as any;
    return this.withVars({ meta }) as any;
  }

  withPath<const TPath$ extends string>(
    path: TPath$,
  ): ExtractPathParams<TPath$> extends void
    ? this
    : HttpMutationBuilder<ExtractPathParams<TPath$>, TSearch, TBody, THeader, TMeta, TData, TError, TTags> {
    return this.withVars({ path }) as any;
  }

  withBaseUrl(baseUrl: string): this {
    return this.withVars({ baseUrl }) as any;
  }

  withMethod(method: HttpMethod): this {
    return this.withVars({ method }) as any;
  }

  declare withData: <TData$>() => HttpMutationBuilder<TParam, TSearch, TBody, THeader, TMeta, TData$, TError, TTags, TKey>;
  declare withError: <TError$>() => HttpMutationBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError$, TTags, TKey>;

  withTagTypes<TTag extends string, T = unknown>(): HttpMutationBuilder<
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
  withTagTypes<TTags$ extends Record<string, unknown>>(): HttpMutationBuilder<
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
