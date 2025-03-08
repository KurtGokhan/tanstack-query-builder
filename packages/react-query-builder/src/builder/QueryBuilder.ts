import { QueryClient } from '@tanstack/react-query';
import { operateOnTags } from '../tags/operateOnTags';
import type { QueryTagObject, QueryTagOption, QueryUpdateTagObject } from '../tags/types';
import { QueryBuilderFrozen } from './QueryBuilderFrozen';
import { type MiddlewareFn, createMiddlewareFunction } from './createMiddlewareFunction';
import { type PreprocessorFn, createPreprocessorFunction, identityPreprocessor } from './createPreprocessorFunction';
import { createTagMiddleware } from './createTagMiddleware';
import { createUpdateMiddleware } from './createUpdateMiddleware';
import { BuilderPaginationOptions } from './options';
import type { BuilderConfig, BuilderFlags } from './types';
import { mergeVars } from './utils';

export class QueryBuilder<
  TVars,
  TData,
  TError,
  TKey extends unknown[],
  TTags extends Record<string, unknown>,
  TFlags extends BuilderFlags = '',
> extends QueryBuilderFrozen<TVars, TData, TError, TKey, TTags, TFlags> {
  withVars<TVars$ = TVars, const TReset extends boolean = false>(
    vars?: TVars$,
    resetVars = false as TReset,
  ): QueryBuilder<TVars$, TData, TError, TKey, TTags, TFlags> {
    if (!vars) return this as any;

    return this.withConfig({
      vars: resetVars ? vars : mergeVars([this.config.vars, vars], this.config.mergeVars),
    }) as any;
  }

  withData<TData$>(): QueryBuilder<TVars, TData$, TError, TKey, TTags, TFlags> {
    return this as any;
  }

  withError<TError$>(): QueryBuilder<TVars, TData, TError$, TKey, TTags, TFlags> {
    return this as any;
  }

  withConfig(config: Partial<typeof this.config>): this {
    const ctor = this.constructor as typeof QueryBuilder;
    const newConfig = this.mergeConfigs(this.config, config);
    return new ctor(newConfig) as this;
  }

  withPreprocessor(preprocessor: PreprocessorFn<TVars, TVars>): this;
  withPreprocessor<TVars$ = TVars>(preprocessor: PreprocessorFn<TVars$, TVars>): QueryBuilder<TVars$, TData, TError, TKey, TTags, TFlags>;

  withPreprocessor<TVars$ = TVars>(preprocessor: PreprocessorFn<TVars$, TVars>): QueryBuilder<TVars$, TData, TError, TKey, TTags, TFlags> {
    const newBuilder = this as unknown as QueryBuilder<TVars$, TData, TError, TKey, TTags, TFlags>;

    return newBuilder.withConfig({
      preprocessorFn: createPreprocessorFunction(preprocessor, this.config.preprocessorFn || identityPreprocessor),
    });
  }

  withMiddleware(middleware: MiddlewareFn<TVars, TData, TError, TKey>): this;
  withMiddleware<TVars$ = TVars, TData$ = TData, TError$ = TError>(
    middleware: MiddlewareFn<TVars$, TData$, TError$, TKey>,
  ): QueryBuilder<TVars$, TData$, TError$, TKey, TTags, TFlags>;

  withMiddleware<TVars$ = TVars, TData$ = TData, TError$ = TError>(
    middleware: MiddlewareFn<TVars$, TData$, TError$, TKey>,
    config?: Partial<BuilderConfig<TVars$, TData$, TError$, TKey>>,
  ): QueryBuilder<TVars$, TData$, TError$, TKey, TTags, TFlags> {
    const newBuilder = this as unknown as QueryBuilder<TVars$, TData$, TError$, TKey, TTags, TFlags>;

    return newBuilder.withConfig({
      ...config,
      queryFn: createMiddlewareFunction(this.config.queryFn, middleware, newBuilder.config),
    });
  }

  static tagCacheId = 0;

  withTags(...tags: QueryTagOption<TVars, TData, TError, QueryTagObject<TTags>>[]): this {
    return this.withMiddleware(createTagMiddleware(tags.flat(), QueryBuilder.tagCacheId++)) as unknown as this;
  }

  withUpdates(...tags: QueryTagOption<TVars, TData, TError, QueryUpdateTagObject<TVars, TData, TError, TTags>>[]): this {
    return this.withMiddleware(createUpdateMiddleware<TVars, TData, TError, TKey, TTags>(tags)) as unknown as this;
  }

  withTagTypes<TTag extends string, T = unknown>(): QueryBuilder<TVars, TData, TError, TKey, TTags & Record<TTag, T>, TFlags>;
  withTagTypes<TTags$ extends Record<string, unknown>>(): QueryBuilder<TVars, TData, TError, TKey, TTags$, TFlags>;
  withTagTypes(): this {
    return this as any;
  }

  withClient(
    queryClient: QueryClient,
    { syncTagsWithOtherTabs = true }: { syncTagsWithOtherTabs?: boolean } = {},
  ): QueryBuilder<TVars, TData, TError, TKey, TTags, TFlags | 'withClient'> {
    let syncChannel: BroadcastChannel | undefined = undefined;

    if (syncTagsWithOtherTabs) {
      syncChannel = new BroadcastChannel('react-query-builder-tags');
      syncChannel.addEventListener('message', (event) => {
        const { type, data } = event.data;
        if (type === 'invalidate') operateOnTags({ queryClient, tags: data });
      });
    }

    return this.withConfig({ queryClient, syncChannel }) as any;
  }

  withPagination(
    paginationOptions: BuilderPaginationOptions<TVars, TData, TError, TKey>,
  ): QueryBuilder<TVars, TData, TError, TKey, TTags, TFlags | 'withPagination'> {
    return this.withConfig({ paginationOptions }) as any;
  }

  freeze(): QueryBuilderFrozen<TVars, TData, TError, TKey, TTags, TFlags> {
    return this;
  }
}
