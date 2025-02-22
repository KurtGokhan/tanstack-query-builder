import { mergeHttpVars } from '../create/utils';
import { ExtractPathParams } from '../http/types';
import { WithOptional } from '../types/utils';
import { QueryBuilder, QueryBuilderConfig } from './QueryBuilder';
import { HttpBaseHeaders, HttpBaseParams, HttpBaseSearch, HttpBuilderTypeTemplate } from './types';
import { PrettifyWithVars } from './types';

export class HttpQueryBuilder<T extends HttpBuilderTypeTemplate = HttpBuilderTypeTemplate> extends QueryBuilder<T> {
  constructor(config?: WithOptional<QueryBuilderConfig<T>, 'queryFn'>) {
    super({
      mergeVars: mergeHttpVars,
      queryFn: async () => {
        throw new Error('queryFn is not defined');
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

  withUrl<const TUrl extends string>(
    url: TUrl,
  ): HttpQueryBuilder<PrettifyWithVars<T, { params: ExtractPathParams<TUrl> }>> {
    return this.withVars({ url }) as any;
  }

  withConfig(config: Partial<QueryBuilderConfig<T>>): HttpQueryBuilder<T> {
    return new HttpQueryBuilder<T>({ ...this.config, ...config });
  }
}
