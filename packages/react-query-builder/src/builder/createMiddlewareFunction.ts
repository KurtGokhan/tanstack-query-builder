import type { BuilderConfig } from './types';
import type { BuilderQueryContext, BuilderQueryFn } from './types';

export type MiddlewareFn<TVars, TData, TError, TKey extends unknown[]> = (
  context: MiddlewareContext<TKey>,
  next: MiddlewareNextFn<any, any, any, any>,
  config: BuilderConfig<TVars, TData, TError, TKey>,
) => TData | Promise<TData>;

export type MiddlewareContext<TKey extends unknown[]> = BuilderQueryContext<TKey> & {
  vars: TKey[0];
};

export type MiddlewareNextFn<TVars, TData, TError, TKey extends unknown[]> = (
  context: Omit<MiddlewareContext<TKey>, 'queryKey'>,
) => Promise<TData>;

const createMiddlewareContext = <TKey extends unknown[]>(context: BuilderQueryContext<TKey>): MiddlewareContext<TKey> => {
  return {
    ...context,
    vars: context.queryKey[0],
  };
};

export const createMiddlewareFunction = <TVars, TData, TError, TKey extends unknown[]>(
  originalFn: BuilderQueryFn<any, any, any, any>,
  middleware: MiddlewareFn<TVars, TData, TError, TKey>,
  config: BuilderConfig<TVars, TData, TError, TKey>,
): BuilderQueryFn<TVars, TData, TError, TKey> => {
  return async (context) =>
    middleware(createMiddlewareContext<TKey>(context), async (ctx) => originalFn({ ...context, queryKey: [ctx.vars] }), config);
};
