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
  TKey extends [HttpBuilderVars] = [HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>],
> extends MutationBuilder<HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>, TData, TError, TKey> {
  protected declare _vars: HttpBuilderVars<TParam, TSearch, TBody, THeader, TMeta>;

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

  withBody<TBody$>(body?: TBody$): HttpMutationBuilder<TParam, TSearch, TBody$, THeader, TMeta, TData, TError> {
    if (!body) return this as any;
    return this.withVars({ body }) as any;
  }

  withHeaders<THeaders$ extends HttpBaseHeaders>(
    headers?: THeaders$,
  ): HttpMutationBuilder<TParam, TSearch, TBody, THeaders$, TMeta, TData, TError> {
    if (!headers) return this as any;
    return this.withVars({ headers }) as any;
  }

  withParams<TParams$ extends HttpBaseParams>(
    params?: TParams$,
  ): HttpMutationBuilder<TParams$, TSearch, TBody, THeader, TMeta, TData, TError> {
    if (!params) return this as any;
    return this.withVars({ params }) as any;
  }

  withSearch<TSearch$ extends HttpBaseSearch>(
    search?: TSearch$,
  ): HttpMutationBuilder<TParam, TSearch$, TBody, THeader, TMeta, TData, TError> {
    if (!search) return this as any;
    return this.withVars({ search }) as any;
  }

  withMeta<TMeta$>(meta?: TMeta$): HttpMutationBuilder<TParam, TSearch, TBody, THeader, TMeta$, TData, TError> {
    if (!meta) return this as any;
    return this.withVars({ meta }) as any;
  }

  withPath<const TPath$ extends string>(
    path: TPath$,
  ): ExtractPathParams<TPath$> extends void
    ? this
    : HttpMutationBuilder<ExtractPathParams<TPath$>, TSearch, TBody, THeader, TMeta, TData, TError> {
    return this.withVars({ path }) as any;
  }

  withBaseUrl(baseUrl: string): this {
    return this.withVars({ baseUrl }) as any;
  }

  withMethod(method: HttpMethod): this {
    return this.withVars({ method }) as any;
  }

  declare withData: <TData$>() => HttpMutationBuilder<TParam, TSearch, TBody, THeader, TMeta, TData$, TError, TKey>;
  declare withError: <TError$>() => HttpMutationBuilder<TParam, TSearch, TBody, THeader, TMeta, TData, TError$, TKey>;
}
