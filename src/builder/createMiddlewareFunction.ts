import { QueryFunction, QueryFunctionContext } from '@tanstack/react-query';
import { MutationBuilderConfig } from './MutationBuilder';
import { QueryBuilderConfig } from './QueryBuilder';
import { BuilderQueryFn, BuilderTypeTemplate } from './types';

export type MiddlewareFn<TVars, TData, TError, TOriginalTemplate extends BuilderTypeTemplate> = (
  context: MiddlewareContext<TVars>,
  next: MiddlewareNextFn<TOriginalTemplate>,
  throwError: (error: TError) => never,
  config: QueryBuilderConfig<TOriginalTemplate> | MutationBuilderConfig<TOriginalTemplate>,
) => TData | Promise<TData>;

export type MiddlewareContext<TVars> = QueryFunctionContext<[TVars]> & {
  vars: TVars;
};

export type MiddlewareNextFn<T extends BuilderTypeTemplate> = (
  context: Omit<MiddlewareContext<T['vars']>, 'queryKey'>,
) => Promise<T['data']>;

const createMiddlewareContext = <TVars>(context: QueryFunctionContext<[TVars]>): MiddlewareContext<TVars> => {
  return {
    ...context,
    vars: context.queryKey[0],
  };
};

const throwError = (error: any): never => {
  throw error;
};

export const createMiddlewareFunction = <TVars, TData, TError, TOriginalTemplate extends BuilderTypeTemplate>(
  originalFn: BuilderQueryFn<TOriginalTemplate>,
  middleware: MiddlewareFn<TVars, TData, TError, TOriginalTemplate>,
  config: QueryBuilderConfig<TOriginalTemplate> | MutationBuilderConfig<TOriginalTemplate>,
): QueryFunction<TData, [TVars]> => {
  return async (context) =>
    middleware(
      createMiddlewareContext<TVars>(context),
      async (ctx) => originalFn({ ...context, queryKey: [ctx.vars] }),
      throwError,
      config,
    );
};
