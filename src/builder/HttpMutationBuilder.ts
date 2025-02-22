import { httpRequest } from '../http/request';
import { ExtractPathParams } from '../http/types';
import { Prettify, WithOptional } from '../types/utils';
import { MutationBuilder, MutationBuilderConfig } from './MutationBuilder';
import { HttpBaseHeaders, HttpBaseParams, HttpBaseSearch, HttpBuilderTypeTemplate } from './types';
import { PrettifyWithVars } from './types';
import { mergeHttpVars } from './utils';

export class HttpMutationBuilder<
  T extends HttpBuilderTypeTemplate = HttpBuilderTypeTemplate,
> extends MutationBuilder<T> {
  constructor(config?: WithOptional<MutationBuilderConfig<T>, 'mutationFn'>) {
    super({
      mergeVars: mergeHttpVars,
      mutationFn: async (vars) => {
        const search = { ...vars?.search! };
        const params = { ...vars?.params! } as any;

        return httpRequest<T['data']>({ ...(vars as any), vars, search, params });
      },
      ...config,
    });
  }

  withBody<TBody>(body?: TBody): HttpMutationBuilder<PrettifyWithVars<T, { body: TBody }>> {
    if (!body) return this as any;
    return this.withVars({ body }) as any;
  }

  withHeaders<THeaders extends HttpBaseHeaders>(
    headers?: THeaders,
  ): HttpMutationBuilder<PrettifyWithVars<T, { headers: THeaders }>> {
    if (!headers) return this as any;
    return this.withVars({ headers }) as any;
  }

  withParams<TParams extends HttpBaseParams>(
    params?: TParams,
  ): HttpMutationBuilder<PrettifyWithVars<T, { params: TParams }>> {
    if (!params) return this as any;
    return this.withVars({ params }) as any;
  }

  withSearch<TSearch extends HttpBaseSearch>(
    search?: TSearch,
  ): HttpMutationBuilder<PrettifyWithVars<T, { search: TSearch }>> {
    if (!search) return this as any;
    return this.withVars({ search }) as any;
  }

  withPath<const TPath extends string>(
    path: TPath,
  ): ExtractPathParams<TPath> extends void
    ? this
    : HttpMutationBuilder<PrettifyWithVars<T, { params: ExtractPathParams<TPath> }>> {
    return this.withVars({ path }) as any;
  }

  withBaseUrl(baseUrl: string): this {
    return this.withVars({ baseUrl }) as any;
  }

  declare withData: <TData>() => HttpMutationBuilder<Prettify<T & { data: TData }>>;
  declare withError: <TError>() => HttpMutationBuilder<Prettify<T & { error: TError }>>;
  declare withVars: <TVars = T['vars']>(vars?: TVars) => HttpMutationBuilder<PrettifyWithVars<T, Partial<TVars>>>;
}
