import { QueryClient } from '@tanstack/react-query';
import { operateOnTags } from '../tags/operateOnTags';
import type { InferDataFromQueryTagOption, QueryTagObject, QueryTagOption, QueryUpdateTagObject } from '../tags/types';
import { TODO } from '../type-utils';
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
  /**
   * Declares the type of variables of the query.
   * Optionally, you can pass the first argument to set the default variables,
   * which will be merged with the variables passed to the query.
   */
  withVars<TVars$ = TVars, const TReset extends boolean = false>(
    vars?: TVars$,
    resetVars = false as TReset,
  ): QueryBuilder<TVars$, TData, TError, TKey, TTags, TFlags> {
    if (!vars) return this as any;

    return this.withConfig({
      vars: resetVars ? vars : mergeVars([this.config.vars, vars], this.config.mergeVars),
    }) as any;
  }

  /**
   * Declares the type of returned data of the query.
   */
  withData<TData$>(): QueryBuilder<TVars, TData$, TError, TKey, TTags, TFlags> {
    return this as any;
  }

  /**
   * Declares the type of error of the query.
   */
  withError<TError$>(): QueryBuilder<TVars, TData, TError$, TKey, TTags, TFlags> {
    return this as any;
  }

  /**
   * Creates a new query builder with additional config.
   */
  withConfig(config: Partial<typeof this.config>): this {
    const ctor = this.constructor as typeof QueryBuilder;
    const newConfig = this.mergeConfigs(this.config, config);
    return new ctor(newConfig) as this;
  }

  /**
   * Adds a preprocessor function to the query.
   * The preprocessor function is called before the query function is called.
   */
  withPreprocessor(preprocessor: PreprocessorFn<TVars, TVars>): this;

  /**
   * Adds a preprocessor function to the query with a different type of input variables.
   * The preprocessor function is called before the query function is called.
   */
  withPreprocessor<TVars$ = TVars>(preprocessor: PreprocessorFn<TVars$, TVars>): QueryBuilder<TVars$, TData, TError, TKey, TTags, TFlags>;

  withPreprocessor<TVars$ = TVars>(preprocessor: PreprocessorFn<TVars$, TVars>): QueryBuilder<TVars$, TData, TError, TKey, TTags, TFlags> {
    const newBuilder = this as unknown as QueryBuilder<TVars$, TData, TError, TKey, TTags, TFlags>;

    return newBuilder.withConfig({
      preprocessorFn: createPreprocessorFunction(preprocessor, this.config.preprocessorFn || identityPreprocessor),
    });
  }

  /**
   * Adds a middleware function to the query.
   * The middleware function wraps the query function and
   * can be used to modify the input variables, the output data, or the error.
   */
  withMiddleware(middleware: MiddlewareFn<TVars, TData, TError, TKey>): this;

  /**
   * Adds a middleware function to the query with overloaded types.
   * The middleware function wraps the query function and
   * can be used to modify the input variables, the output data, or the error.
   */
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
    } as TODO);
  }

  static tagCacheId = 0;

  /**
   * Adds a tag to the query.
   * The tag is used to invalidate or update the query when the tag is updated.
   */
  withTags<const TTagOpt extends QueryTagOption<TVars, TData, TError, QueryTagObject<TTags>, TTags>>(
    primaryTag: TTagOpt,
    ...otherTags: QueryTagOption<TVars, TData, TError, QueryTagObject<TTags>, TTags>[]
  ): unknown extends TData ? QueryBuilder<TVars, InferDataFromQueryTagOption<TTagOpt, TTags>, TError, TKey, TTags, TFlags> : this {
    return this.withMiddleware(createTagMiddleware([primaryTag, ...otherTags].flat(), QueryBuilder.tagCacheId++)) as unknown as any;
  }

  /**
   * Adds a declarative update to the mutation.
   * This is used to invalidate or update the queries that were marked with {@link withTags}.
   */
  withUpdates(...tags: QueryTagOption<TVars, TData, TError, QueryUpdateTagObject<TVars, TData, TError, TTags>, TTags>[]): this {
    return this.withMiddleware(createUpdateMiddleware<TVars, TData, TError, TKey, TTags>(tags)) as unknown as this;
  }

  withTagTypes<TTag extends string, T = unknown>(): QueryBuilder<TVars, TData, TError, TKey, TTags & Record<TTag, T>, TFlags>;
  withTagTypes<TTags$ extends Record<string, unknown>>(): QueryBuilder<TVars, TData, TError, TKey, TTags$, TFlags>;

  /**
   * Declares the type of tags of the query.
   * This is used to strongly type the tags which can be helpful when using {@link withUpdates}.
   */
  withTagTypes(): this {
    return this as any;
  }

  /**
   * Sets the query client for this builder.
   * This is required in order to enable {@link client} and {@link tags} interfaces.
   * Imperative operations done through those interfaces will be done with the provided query client.
   * This method also enables the ability to sync tag invalidation with other browser tabs.
   */
  withClient(
    queryClient: QueryClient,
    { syncTagsWithOtherTabs = true }: { syncTagsWithOtherTabs?: boolean } = {},
  ): QueryBuilder<TVars, TData, TError, TKey, TTags, TFlags | 'withClient'> {
    let syncChannel: BroadcastChannel | undefined = undefined;

    if (syncTagsWithOtherTabs && typeof BroadcastChannel !== 'undefined') {
      syncChannel = new BroadcastChannel('tanstack-query-builder-tags');
      syncChannel.addEventListener('message', (event) => {
        const { type, data } = event.data;
        if (type === 'invalidate') operateOnTags({ queryClient, tags: data });
      });
    }

    return this.withConfig({ queryClient, syncChannel }) as any;
  }

  /**
   * Adds pagination to the query. This is required for methods like {@link useInfiniteQuery} to be available.
   */
  withPagination(
    paginationOptions: BuilderPaginationOptions<TVars, TData, TError, TKey>,
  ): QueryBuilder<TVars, TData, TError, TKey, TTags, TFlags | 'withPagination'> {
    return this.withConfig({ paginationOptions } as TODO);
  }

  /**
   * Returns a frozen version of this builder.
   * The frozen version cannot be modified using `with*` methods.
   */
  asFrozen(): QueryBuilderFrozen<TVars, TData, TError, TKey, TTags, TFlags> {
    return this as any;
  }

  /**
   * Binds all query methods to this class instance, so that they can be called after object destructuring.
   */
  asBound(): QueryBuilder<TVars, TData, TError, TKey, TTags, TFlags | 'bound'> {
    return this.withConfig({ bound: true });
  }
}
