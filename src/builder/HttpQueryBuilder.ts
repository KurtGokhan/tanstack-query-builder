import { ExtractPathParams } from '../http/types';
import { Prettify, WithOptional } from '../types/utils';
import { HttpMutationBuilder } from './HttpMutationBuilder';
import { QueryBuilder, QueryBuilderConfig } from './QueryBuilder';
import { HttpBaseHeaders, HttpBaseParams, HttpBaseSearch, HttpBuilderTypeTemplate } from './types';
import { PrettifyWithVars } from './types';
import { createHttpQueryFn, mergeHttpVars } from './utils';

export class HttpQueryBuilder<T extends HttpBuilderTypeTemplate = HttpBuilderTypeTemplate> extends QueryBuilder<T> {
  constructor(config?: WithOptional<QueryBuilderConfig<T>, 'queryFn'>) {
    const mergeVars = config?.mergeVars || mergeHttpVars;
    const queryFn = config?.queryFn || createHttpQueryFn<T>(mergeVars);
    super({ mergeVars, queryFn, ...config });
  }

  withBody<TBody>(body?: TBody): HttpQueryBuilder<PrettifyWithVars<T, { body: TBody }>> {
    if (!body) return this as any;
    return this.withVars({ body }) as any;
  }

  withHeaders<THeaders extends HttpBaseHeaders>(
    headers?: THeaders,
  ): HttpQueryBuilder<PrettifyWithVars<T, { headers: THeaders }>> {
    if (!headers) return this as any;
    return this.withVars({ headers }) as any;
  }

  withParams<TParams extends HttpBaseParams>(
    params?: TParams,
  ): HttpQueryBuilder<PrettifyWithVars<T, { params: TParams }>> {
    if (!params) return this as any;
    return this.withVars({ params }) as any;
  }

  withSearch<TSearch extends HttpBaseSearch>(
    search?: TSearch,
  ): HttpQueryBuilder<PrettifyWithVars<T, { search: TSearch }>> {
    if (!search) return this as any;
    return this.withVars({ search }) as any;
  }

  withPath<const TPath extends string>(
    path: TPath,
  ): ExtractPathParams<TPath> extends void
    ? this
    : HttpQueryBuilder<PrettifyWithVars<T, { params: ExtractPathParams<TPath> }>> {
    return this.withVars({ path }) as any;
  }

  withBaseUrl(baseUrl: string): this {
    return this.withVars({ baseUrl }) as any;
  }

  declare withData: <TData>() => HttpQueryBuilder<Prettify<T & { data: TData }>>;
  declare withError: <TError>() => HttpQueryBuilder<Prettify<T & { error: TError }>>;
  declare withVars: <TVars = T['vars']>(vars?: TVars) => HttpQueryBuilder<PrettifyWithVars<T, Partial<TVars>>>;
  declare asMutationBuilder: () => HttpMutationBuilder<T>;
}
