import { ExtractPathParams } from '../http/types';
import { WithOptional } from '../types/utils';
import { HttpMutationBuilder } from './HttpMutationBuilder';
import { MutationBuilder } from './MutationBuilder';
import { QueryBuilder, QueryBuilderConfig } from './QueryBuilder';
import { MiddlewareFn } from './createMiddlewareFunction';
import {
  HttpBaseHeaders,
  HttpBaseParams,
  HttpBaseSearch,
  HttpBuilderTypeTemplate,
  SetAllTypes,
  SetDataType,
  SetErrorType,
} from './types';
import { AppendVarsType } from './types';
import { createHttpQueryFn, mergeHttpVars } from './utils';

export class HttpQueryBuilder<T extends HttpBuilderTypeTemplate = HttpBuilderTypeTemplate> extends QueryBuilder<T> {
  constructor(config?: WithOptional<QueryBuilderConfig<T>, 'queryFn'>) {
    const mergeVars = config?.mergeVars || mergeHttpVars;
    const queryFn = config?.queryFn || createHttpQueryFn<T>(mergeVars);
    super({ mergeVars, queryFn, ...config });
  }

  withBody<TBody>(body?: TBody): HttpQueryBuilder<AppendVarsType<T, { body: TBody }>> {
    if (!body) return this as any;
    return this.withVars({ body }) as any;
  }

  withHeaders<THeaders extends HttpBaseHeaders>(
    headers?: THeaders,
  ): HttpQueryBuilder<AppendVarsType<T, { headers: THeaders }>> {
    if (!headers) return this as any;
    return this.withVars({ headers }) as any;
  }

  withParams<TParams extends HttpBaseParams>(
    params?: TParams,
  ): HttpQueryBuilder<AppendVarsType<T, { params: TParams }>> {
    if (!params) return this as any;
    return this.withVars({ params }) as any;
  }

  withSearch<TSearch extends HttpBaseSearch>(
    search?: TSearch,
  ): HttpQueryBuilder<AppendVarsType<T, { search: TSearch }>> {
    if (!search) return this as any;
    return this.withVars({ search }) as any;
  }

  withPath<const TPath extends string>(
    path: TPath,
  ): ExtractPathParams<TPath> extends void
    ? this
    : HttpQueryBuilder<AppendVarsType<T, { params: ExtractPathParams<TPath> }>> {
    return this.withVars({ path }) as any;
  }

  withBaseUrl(baseUrl: string): this {
    return this.withVars({ baseUrl }) as any;
  }

  declare withData: <TData>() => HttpQueryBuilder<SetDataType<T, TData>>;
  declare withError: <TError>() => HttpQueryBuilder<SetErrorType<T, TError>>;
  declare withVars: <TVars = T['vars'], const TReset extends boolean = false>(
    vars?: TVars,
    reset?: TReset,
  ) => HttpQueryBuilder<AppendVarsType<T, Partial<TVars>, TReset>>;

  declare withMiddleware: <TVars = T['vars'], TData = T['data'], TError = T['error']>(
    middleware: MiddlewareFn<TVars, TData, TError, T>,
  ) => HttpQueryBuilder<SetAllTypes<T, TData, TError, TVars, true>>;

  declare asMutationBuilder: () => HttpMutationBuilder<T>;
  protected override MutationBuilderConstructor: typeof MutationBuilder = HttpMutationBuilder as typeof MutationBuilder;
}
