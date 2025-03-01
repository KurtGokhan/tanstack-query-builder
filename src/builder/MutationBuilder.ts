import {
  Mutation,
  MutationFilters,
  MutationFunction,
  MutationKey,
  MutationObserver,
  MutationState,
  QueryClient,
  QueryKeyHashFunction,
  UseMutationOptions,
  useIsMutating,
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import { QueryTagOption, QueryUpdateTagObject } from '../tags/types';
import { MiddlewareFn, createMiddlewareFunction } from './createMiddlewareFunction';
import { createUpdateMiddleware } from './createUpdateMiddleware';
import { BuilderConfig } from './types';
import { areKeysEqual, mergeMutationOptions, mergeVars } from './utils';

function getRandomKey() {
  return Math.random().toString(36).substring(7);
}

export class MutationBuilderFrozen<TVars, TData, TError, TKey extends unknown[]> {
  protected declare _config: MutationBuilderConfig<TVars, TData, TError, TKey>;
  protected declare _options: typeof this._config.options;
  protected declare _vars: TVars;

  constructor(
    public config: typeof this._config,
    public mutationKeyPrefix = getRandomKey(),
  ) {}

  protected mergeConfigs: (config: typeof this._config, other: Partial<typeof this._config>) => typeof this._config = (
    config,
    other,
  ) => {
    return {
      ...config,
      ...other,
      vars: mergeVars([config.vars, other.vars], other.mergeVars || config.mergeVars),
      options: mergeMutationOptions([config.options, other.options]),
    };
  };

  protected mergeVars: (list: (Partial<TVars> | undefined)[]) => TVars = (list) => {
    return mergeVars(list, this.config.mergeVars);
  };

  getMutationFn: (queryClient: QueryClient, meta?: any) => MutationFunction<TData, TVars> = (queryClient, meta) => {
    return async (vars) => {
      const queryKey = [this.mergeVars([this.config.vars, vars])] as TKey;
      return this.config.queryFn({
        queryKey,
        meta,
        client: this.config.queryClient || queryClient,
        signal: new AbortController().signal,
        originalQueryKey: queryKey,
      });
    };
  };

  getMutationKey: () => MutationKey = () => {
    return [this.mutationKeyPrefix];
  };

  getMutationOptions: (
    queryClient: QueryClient,
    opts?: typeof this._options,
  ) => UseMutationOptions<TData, TError, TVars> = (queryClient, opts) => {
    return mergeMutationOptions([
      {
        mutationKey: this.getMutationKey(),
        mutationFn: this.getMutationFn(queryClient, opts?.meta),
      },
      this.config.options,
      opts,
    ]);
  };

  getMutationFilters: (
    vars?: TVars,
    filters?: MutationFilters<TData, TError, TVars>,
  ) => MutationFilters<any, any, any> = (vars, filters) => {
    return {
      mutationKey: this.getMutationKey(),
      ...filters,
      predicate: (m) => {
        if (filters?.predicate && !filters.predicate(m)) return false;
        if (vars == null) return true;
        if (!m.state.variables) return false;
        return areKeysEqual(
          [m.state.variables],
          [vars],
          this.config.queryKeyHashFn as QueryKeyHashFunction<readonly unknown[]>,
        );
      },
    };
  };

  useMutation: (opts?: typeof this._options) => ReturnType<typeof useMutation<TData, TError, TVars>> = (opts) => {
    const queryClient = useQueryClient(this.config.queryClient);
    return useMutation(this.getMutationOptions(queryClient, opts), this.config.queryClient);
  };

  useIsMutating: (vars: TVars, filters?: MutationFilters<TData, TError, TVars>) => number = (vars, filters) => {
    return useIsMutating(this.getMutationFilters(vars, filters), this.config.queryClient);
  };

  useMutationState: <TSelect = Mutation<TData, TError, TVars>>(
    vars?: TVars,
    filters?: MutationFilters<TData, TError, TVars>,
    select?: (mt: Mutation<TData, TError, TVars>) => TSelect,
  ) => TSelect[] = (vars, filters, select) => {
    return useMutationState(
      { filters: this.getMutationFilters(vars, filters), select: select as any },
      this.config.queryClient,
    );
  };

  readonly getMutation = (vars?: TVars, filters?: MutationFilters<TData, TError, TVars>, queryClient?: QueryClient) => {
    const client = queryClient || this.config.queryClient!;
    return client.getMutationCache().find(this.getMutationFilters(vars, filters));
  };

  readonly isMutating = (vars?: TVars, filters?: MutationFilters<TData, TError, TVars>, queryClient?: QueryClient) => {
    const client = queryClient || this.config.queryClient!;
    return client.isMutating(this.getMutationFilters(vars, filters));
  };

  readonly mutate = async (vars: TVars, opts?: typeof this._options, queryClient?: QueryClient) => {
    const client = queryClient || this.config.queryClient!;
    const options = this.getMutationOptions(client, opts);
    const observer = new MutationObserver<TData, TError, TVars>(client, options);
    return observer.mutate(vars, options).finally(() => observer.reset());
  };
}

export type MutationStateHelper<TVars, TData, TError, TKey> = {
  list: MutationState<TData, TError, TVars>[];
  getMutation(vars: TVars): MutationState<TData, TError, TVars> | undefined;
};

export class MutationBuilder<TVars, TData, TError, TKey extends unknown[]> extends MutationBuilderFrozen<
  TVars,
  TData,
  TError,
  TKey
> {
  withVars<TVars$ = TVars, const TReset extends boolean = false>(
    vars?: TVars$,
    resetVars = false as TReset,
  ): MutationBuilder<TVars$, TData, TError, TKey> {
    if (!vars) return this as any;

    return this.withConfig({
      vars: resetVars ? vars : mergeVars([this.config.vars, vars], this.config.mergeVars),
    }) as any;
  }

  withData<TData$>(): MutationBuilder<TVars, TData$, TError, TKey> {
    return this as any;
  }

  withError<TError$>(): MutationBuilder<TVars, TData, TError$, TKey> {
    return this as any;
  }

  withConfig(config: Partial<typeof this._config>): this {
    const ctor = this.constructor as typeof MutationBuilder;
    const newConfig = this.mergeConfigs(this.config, config);
    return new ctor(newConfig) as this;
  }

  withMiddleware<TVars$ = TVars, TData$ = TData, TError$ = TError>(
    middleware: MiddlewareFn<TVars$, TData$, TError$, TKey>,
  ): MutationBuilder<TVars$, TData$, TError$, TKey> {
    const newBuilder = this as unknown as MutationBuilder<TVars$, TData$, TError$, TKey>;

    return newBuilder.withConfig({
      queryFn: createMiddlewareFunction(this.config.queryFn, middleware, newBuilder.config),
    });
  }

  withUpdates<TTarget = unknown>(
    ...tags: QueryTagOption<TVars, TData, TError, QueryUpdateTagObject<TVars, TData, TError, TTarget>>[]
  ): this {
    return this.withMiddleware(createUpdateMiddleware<TVars, TData, TError, TKey>(tags)) as unknown as this;
  }

  freeze(): MutationBuilderFrozen<TVars, TData, TError, TKey> {
    return this;
  }
}

export type MutationBuilderConfig<TVars, TData, TError, TKey extends unknown[]> = BuilderConfig<
  TVars,
  TData,
  TError,
  TKey
> & {
  options?: UseMutationOptions<TData, TError, TVars>;
};
