import { ExtractPathParams } from '../http/types';
import { WithOptional } from '../types/utils';
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
      mutationFn: async () => {
        throw new Error('mutationFn is not defined');
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
    ? HttpMutationBuilder<T>
    : HttpMutationBuilder<PrettifyWithVars<T, { params: ExtractPathParams<TPath> }>> {
    return this.withVars({ path }) as any;
  }

  withBaseUrl(baseUrl: string): HttpMutationBuilder<T> {
    return this.withVars({ baseUrl }) as any;
  }

  withConfig(config: Partial<MutationBuilderConfig<T>>): HttpMutationBuilder<T> {
    return new HttpMutationBuilder<T>({ ...this.config, ...config });
  }
}
