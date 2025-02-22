import { httpRequest } from '../http/request';
import { ExtractPathParams } from '../http/types';
import { WithOptional } from '../types/utils';
import { QueryBuilder, QueryBuilderConfig } from './QueryBuilder';
import { HttpBaseHeaders, HttpBaseParams, HttpBaseSearch, HttpBuilderTypeTemplate } from './types';
import { PrettifyWithVars } from './types';
import { mergeHttpVars } from './utils';

export class HttpQueryBuilder<T extends HttpBuilderTypeTemplate = HttpBuilderTypeTemplate> extends QueryBuilder<T> {
  constructor(config?: WithOptional<QueryBuilderConfig<T>, 'queryFn'>) {
    super({
      mergeVars: mergeHttpVars,
      queryFn: async ({ queryKey, signal, meta, pageParam }) => {
        const [vars] = queryKey || [''];
        const search = { ...vars?.search!, ...pageParam! };
        const params = { ...vars?.params! } as any;

        return httpRequest<T['data']>({ ...(vars as any), meta, vars, search, params, signal });
      },
      ...config,
    });
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
    ? HttpQueryBuilder<T>
    : HttpQueryBuilder<PrettifyWithVars<T, { params: ExtractPathParams<TPath> }>> {
    return this.withVars({ path }) as any;
  }

  withBaseUrl(baseUrl: string): HttpQueryBuilder<T> {
    return this.withVars({ baseUrl }) as any;
  }

  withConfig(config: Partial<QueryBuilderConfig<T>>): HttpQueryBuilder<T> {
    return new HttpQueryBuilder<T>({ ...this.config, ...config });
  }
}
