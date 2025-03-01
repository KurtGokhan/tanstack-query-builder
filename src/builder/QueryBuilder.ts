import { operateOnTags } from '../tags/operateOnTags';
import { QueryTagObject, QueryTagOption } from '../tags/types';
import { MutationBuilder } from './MutationBuilder';
import { QueryBuilderConfig, QueryBuilderFrozen } from './QueryBuilderFrozen';
import { MiddlewareFn, createMiddlewareFunction } from './createMiddlewareFunction';
import { PreprocessorFn, createPreprocessorFunction, identityPreprocessor } from './createPreprocessorFunction';
import { createTagMiddleware } from './createTagMiddleware';
import { mergeVars } from './utils';

export class QueryBuilder<TVars, TData, TError, TKey extends unknown[], TTags extends Record<string, unknown>> extends QueryBuilderFrozen<
  TVars,
  TData,
  TError,
  TKey,
  TTags
> {
  withVars<TVars$ = TVars, const TReset extends boolean = false>(
    vars?: TVars$,
    resetVars = false as TReset,
  ): QueryBuilder<TVars$, TData, TError, TKey, TTags> {
    if (!vars) return this as any;

    return this.withConfig({
      vars: resetVars ? vars : mergeVars([this.config.vars, vars], this.config.mergeVars),
    }) as any;
  }

  withData<TData$>(): QueryBuilder<TVars, TData$, TError, TKey, TTags> {
    return this as any;
  }

  withError<TError$>(): QueryBuilder<TVars, TData, TError$, TKey, TTags> {
    return this as any;
  }

  withConfig(config: Partial<typeof this._config>): this {
    const ctor = this.constructor as typeof QueryBuilder;
    const newConfig = this.mergeConfigs(this.config, config);
    return new ctor(newConfig) as this;
  }

  withPreprocessor(preprocessor: PreprocessorFn<TVars, TVars>): this;
  withPreprocessor<TVars$ = TVars>(preprocessor: PreprocessorFn<TVars$, TVars>): QueryBuilder<TVars$, TData, TError, TKey, TTags>;

  withPreprocessor<TVars$ = TVars>(preprocessor: PreprocessorFn<TVars$, TVars>): QueryBuilder<TVars$, TData, TError, TKey, TTags> {
    const newBuilder = this as unknown as QueryBuilder<TVars$, TData, TError, TKey, TTags>;

    return newBuilder.withConfig({
      preprocessorFn: createPreprocessorFunction(preprocessor, this.config.preprocessorFn || identityPreprocessor),
    });
  }

  withMiddleware(middleware: MiddlewareFn<TVars, TData, TError, TKey>): this;
  withMiddleware<TVars$ = TVars, TData$ = TData, TError$ = TError>(
    middleware: MiddlewareFn<TVars$, TData$, TError$, TKey>,
  ): QueryBuilder<TVars$, TData$, TError$, TKey, TTags>;

  withMiddleware<TVars$ = TVars, TData$ = TData, TError$ = TError>(
    middleware: MiddlewareFn<TVars$, TData$, TError$, TKey>,
    config?: Partial<QueryBuilderConfig<TVars$, TData$, TError$, TKey>>,
  ): QueryBuilder<TVars$, TData$, TError$, TKey, TTags> {
    const newBuilder = this as unknown as QueryBuilder<TVars$, TData$, TError$, TKey, TTags>;

    return newBuilder.withConfig({
      ...config,
      queryFn: createMiddlewareFunction(this.config.queryFn, middleware, newBuilder.config),
    });
  }

  static tagCacheId = 0;

  withTags(...tags: QueryTagOption<TVars, TData, TError, QueryTagObject<TTags>>[]): this {
    if (this.config.queryClient) {
      this.config.syncChannel?.addEventListener('message', (event) => {
        const { type, data } = event.data;
        if (type === 'invalidate') {
          const queryClient = this.config.queryClient;
          if (queryClient) operateOnTags({ queryClient, tags: data });
        }
      });
    }

    return this.withMiddleware(createTagMiddleware(tags.flat(), QueryBuilder.tagCacheId++)) as unknown as this;
  }

  withTagTypes<TTag extends string, T = unknown>(): QueryBuilder<TVars, TData, TError, TKey, TTags & Record<TTag, T>>;
  withTagTypes<TTags$ extends Record<string, unknown>>(): QueryBuilder<TVars, TData, TError, TKey, TTags$>;
  withTagTypes(): this {
    return this as any;
  }

  freeze(): QueryBuilderFrozen<TVars, TData, TError, TKey> {
    return this;
  }

  protected MutationBuilderConstructor: typeof MutationBuilder = MutationBuilder;

  asMutationBuilder(): MutationBuilder<TVars, TData, TError, TKey, TTags> {
    const { options, ...restConfig } = this.config;
    return new this.MutationBuilderConstructor(restConfig);
  }
}
