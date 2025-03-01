import { QueryTagOption, QueryUpdateTagObject } from '../tags/types';
import { MutationBuilderFrozen } from './MutationBuilderFrozen';
import { MiddlewareFn, createMiddlewareFunction } from './createMiddlewareFunction';
import { createUpdateMiddleware } from './createUpdateMiddleware';
import { mergeVars } from './utils';

export class MutationBuilder<
  TVars,
  TData,
  TError,
  TKey extends unknown[],
  TTags extends Record<string, unknown>,
> extends MutationBuilderFrozen<TVars, TData, TError, TKey, TTags> {
  withVars<TVars$ = TVars, const TReset extends boolean = false>(
    vars?: TVars$,
    resetVars = false as TReset,
  ): MutationBuilder<TVars$, TData, TError, TKey, TTags> {
    if (!vars) return this as any;

    return this.withConfig({
      vars: resetVars ? vars : mergeVars([this.config.vars, vars], this.config.mergeVars),
    }) as any;
  }

  withData<TData$>(): MutationBuilder<TVars, TData$, TError, TKey, TTags> {
    return this as any;
  }

  withError<TError$>(): MutationBuilder<TVars, TData, TError$, TKey, TTags> {
    return this as any;
  }

  withConfig(config: Partial<typeof this._config>): this {
    const ctor = this.constructor as typeof MutationBuilder;
    const newConfig = this.mergeConfigs(this.config, config);
    return new ctor(newConfig) as this;
  }

  withMiddleware<TVars$ = TVars, TData$ = TData, TError$ = TError>(
    middleware: MiddlewareFn<TVars$, TData$, TError$, TKey>,
  ): MutationBuilder<TVars$, TData$, TError$, TKey, TTags> {
    const newBuilder = this as unknown as MutationBuilder<TVars$, TData$, TError$, TKey, TTags>;

    return newBuilder.withConfig({
      queryFn: createMiddlewareFunction(this.config.queryFn, middleware, newBuilder.config),
    });
  }

  withUpdates(...tags: QueryTagOption<TVars, TData, TError, QueryUpdateTagObject<TVars, TData, TError, TTags>>[]): this {
    return this.withMiddleware(createUpdateMiddleware<TVars, TData, TError, TKey, TTags>(tags)) as unknown as this;
  }

  freeze(): MutationBuilderFrozen<TVars, TData, TError, TKey, TTags> {
    return this;
  }
}
