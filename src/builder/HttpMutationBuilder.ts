import { ExtractPathParams } from '../http/types';
import { WithOptional } from '../types/utils';
import { HttpQueryBuilder } from './HttpQueryBuilder';
import { MutationBuilder, MutationBuilderConfig } from './MutationBuilder';
import { QueryBuilder } from './QueryBuilder';
import {
  HttpBaseHeaders,
  HttpBaseParams,
  HttpBaseSearch,
  HttpBuilderTypeTemplate,
  SetDataType,
  SetErrorType,
} from './types';
import { AppendVarsType } from './types';
import { createHttpQueryFn, mergeHttpVars } from './utils';

export class HttpMutationBuilder<
  T extends HttpBuilderTypeTemplate = HttpBuilderTypeTemplate,
> extends MutationBuilder<T> {
  constructor(config?: WithOptional<MutationBuilderConfig<T>, 'queryFn'>) {
    const mergeVars = config?.mergeVars || mergeHttpVars;
    const queryFn = config?.queryFn || createHttpQueryFn<T>(mergeVars);
    super({
      mergeVars,
      queryFn,
      ...config,
      vars: {
        method: 'post',
        ...config?.vars,
      },
    });
  }

  withBody<TBody>(body?: TBody): HttpMutationBuilder<AppendVarsType<T, { body: TBody }>> {
    if (!body) return this as any;
    return this.withVars({ body }) as any;
  }

  withHeaders<THeaders extends HttpBaseHeaders>(
    headers?: THeaders,
  ): HttpMutationBuilder<AppendVarsType<T, { headers: THeaders }>> {
    if (!headers) return this as any;
    return this.withVars({ headers }) as any;
  }

  withParams<TParams extends HttpBaseParams>(
    params?: TParams,
  ): HttpMutationBuilder<AppendVarsType<T, { params: TParams }>> {
    if (!params) return this as any;
    return this.withVars({ params }) as any;
  }

  withSearch<TSearch extends HttpBaseSearch>(
    search?: TSearch,
  ): HttpMutationBuilder<AppendVarsType<T, { search: TSearch }>> {
    if (!search) return this as any;
    return this.withVars({ search }) as any;
  }

  withPath<const TPath extends string>(
    path: TPath,
  ): ExtractPathParams<TPath> extends void
    ? this
    : HttpMutationBuilder<AppendVarsType<T, { params: ExtractPathParams<TPath> }>> {
    return this.withVars({ path }) as any;
  }

  withBaseUrl(baseUrl: string): this {
    return this.withVars({ baseUrl }) as any;
  }

  declare withData: <TData>() => HttpMutationBuilder<SetDataType<T, TData>>;
  declare withError: <TError>() => HttpMutationBuilder<SetErrorType<T, TError>>;
  declare withVars: <TVars = T['vars'], const TReset extends boolean = false>(
    vars?: TVars,
    reset?: TReset,
  ) => HttpMutationBuilder<AppendVarsType<T, Partial<TVars>, TReset>>;
  declare asQueryBuilder: () => HttpQueryBuilder<T>;
  protected override QueryBuilderConstructor: typeof QueryBuilder = HttpQueryBuilder as typeof QueryBuilder;
}
