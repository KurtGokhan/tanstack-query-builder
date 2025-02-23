import {
  MutationFilters,
  MutationFunction,
  MutationKey,
  MutationObserver,
  MutationState,
  QueryClient,
  UseMutationOptions,
  useIsMutating,
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import { useStableCallback } from '../hooks/useStableCallback';
import { mergeTagOptions } from '../tags/mergeTagOptions';
import { QueryInvalidatesMetadata } from '../tags/types';
import { QueryBuilder } from './QueryBuilder';
import { BuilderMergeVarsFn, BuilderQueryFn, SetDataType, SetErrorType } from './types';
import { AppendVarsType, BuilderTypeTemplate } from './types';
import { areKeysEqual, mergeMutationOptions, mergeVars } from './utils';

function getRandomKey() {
  return Math.random().toString(36).substring(7);
}

export class MutationBuilderFrozen<T extends BuilderTypeTemplate> {
  constructor(
    public config: MutationBuilderConfig<T>,
    public mutationKeyPrefix = getRandomKey(),
  ) {}

  protected mergeConfigs: (
    config: MutationBuilderConfig<T>,
    other: Partial<MutationBuilderConfig<T>>,
  ) => MutationBuilderConfig<T> = (config, other) => {
    return {
      ...config,
      ...other,
      invalidates: mergeTagOptions([config.invalidates, other.invalidates]),
      updates: mergeTagOptions([config.updates, other.updates]),
      optimisticUpdates: mergeTagOptions([config.optimisticUpdates, other.optimisticUpdates]),
      vars: mergeVars([config.vars, other.vars], other.mergeVars || config.mergeVars),
      options: mergeMutationOptions([config.options, other.options]),
    };
  };

  protected mergeVars: (list: [T['vars'], ...Partial<T['vars']>[]]) => T['vars'] = (list) => {
    return mergeVars(list, this.config.mergeVars);
  };

  getMutationFn: (queryClient: QueryClient, meta?: any) => MutationFunction<T['data'], T['vars']> = (
    queryClient,
    meta,
  ) => {
    return async (vars) => {
      return this.config.queryFn({
        queryKey: [this.mergeVars([this.config.vars, vars])],
        meta,
        client: this.config.queryClient || queryClient,
        signal: new AbortController().signal,
      });
    };
  };

  getMutationKey: () => MutationKey = () => {
    return [this.mutationKeyPrefix];
  };

  getMutationOptions: (
    queryClient: QueryClient,
    opts?: MutationBuilderConfig<T>['options'],
  ) => UseMutationOptions<T['data'], T['error'], T['vars']> = (queryClient, opts) => {
    return mergeMutationOptions([
      {
        mutationKey: this.getMutationKey(),
        mutationFn: this.getMutationFn(queryClient, opts?.meta),
        meta: {
          invalidates: this.config.invalidates,
          updates: this.config.updates,
          optimisticUpdates: this.config.optimisticUpdates,
        },
      },
      this.config.options,
      opts,
    ]);
  };

  getMutationFilters: (
    vars?: T['vars'],
    filters?: MutationFilters<T['data'], T['error'], T['vars']>,
  ) => MutationFilters<T['data'], T['error'], T['vars']> = (vars, filters) => {
    return {
      mutationKey: this.getMutationKey(),
      ...filters,
      predicate: (m) => {
        if (filters?.predicate && !filters.predicate(m)) return false;
        if (vars == null) return true;
        if (!m.state.variables) return false;
        return areKeysEqual([m.state.variables], [vars]);
      },
    };
  };

  useMutation: (
    opts?: MutationBuilderConfig<T>['options'],
  ) => ReturnType<typeof useMutation<T['data'], T['error'], T['vars']>> = (opts) => {
    const queryClient = useQueryClient();
    return useMutation(this.getMutationOptions(queryClient, opts), this.config.queryClient);
  };

  useIsMutating: (vars: T['vars'], filters?: MutationFilters<T['data'], T['error'], T['vars']>) => number = (
    vars,
    filters,
  ) => {
    return useIsMutating(this.getMutationFilters(vars, filters), this.config.queryClient);
  };

  useAllMutations: (filters?: MutationFilters<T['data'], T['error'], T['vars']>) => MutationStateHelper<T> = (
    filters,
  ) => {
    const list = useMutationState({ filters: this.getMutationFilters(undefined, filters) }, this.config.queryClient);

    const getMutation: MutationStateHelper<T>['getMutation'] = useStableCallback(
      (vars, predicate?: (mutation: MutationState<T['data'], T['error'], T['vars']>) => boolean) =>
        list.findLast((m) => areKeysEqual([m.variables], [vars]) && (!predicate || predicate(m))),
    );

    return { list, getMutation };
  };

  useMutationState: (
    vars: T['vars'],
    filters?: MutationFilters<T['data'], T['error'], T['vars']>,
  ) => MutationState<T['data'], T['error'], T['vars']> | undefined = (vars, filters) => {
    return useMutationState({ filters: this.getMutationFilters(vars, filters) }, this.config.queryClient)[0];
  };

  readonly getMutation = (
    vars?: T['vars'],
    filters?: MutationFilters<T['data'], T['error'], T['vars']>,
    queryClient?: QueryClient,
  ) => {
    const client = queryClient || this.config.queryClient!;
    return client.getMutationCache().find(this.getMutationFilters(vars, filters));
  };

  readonly isMutating = (
    vars?: T['vars'],
    filters?: MutationFilters<T['data'], T['error'], T['vars']>,
    queryClient?: QueryClient,
  ) => {
    const client = queryClient || this.config.queryClient!;
    return client.isMutating(this.getMutationFilters(vars, filters));
  };

  readonly mutate = async (vars: T['vars'], opts?: MutationBuilderConfig<T>['options'], queryClient?: QueryClient) => {
    const client = queryClient || this.config.queryClient!;
    const options = this.getMutationOptions(client, opts);
    const observer = new MutationObserver<T['data'], T['error'], T['vars']>(client, options);
    return observer.mutate(vars, options).finally(() => observer.reset());
  };
}

export type MutationStateHelper<T extends BuilderTypeTemplate> = {
  list: MutationState<T['data'], T['error'], T['vars']>[];
  getMutation(vars: T['vars']): MutationState<T['data'], T['error'], T['vars']> | undefined;
};

export class MutationBuilder<T extends BuilderTypeTemplate = BuilderTypeTemplate> extends MutationBuilderFrozen<T> {
  withVars<TVars = T['vars'], const TReset extends boolean = false>(
    vars?: TVars,
    resetVars = false as TReset,
  ): MutationBuilder<AppendVarsType<T, Partial<TVars>, TReset>> {
    if (!vars) return this as any;

    return this.withConfig({
      vars: resetVars ? vars : mergeVars([this.config.vars, vars], this.config.mergeVars),
    }) as any;
  }

  withData<TData>(): MutationBuilder<SetDataType<T, TData>> {
    return this as any;
  }

  withError<TError>(): MutationBuilder<SetErrorType<T, TError>> {
    return this as any;
  }

  withConfig(config: Partial<MutationBuilderConfig<T>>): this {
    const ctor = this.constructor as typeof MutationBuilder;
    const newConfig = this.mergeConfigs(this.config, config);
    return new ctor<T>(newConfig) as this;
  }

  freeze(): MutationBuilderFrozen<T> {
    return this;
  }

  protected QueryBuilderConstructor: typeof QueryBuilder = QueryBuilder;

  asQueryBuilder(): QueryBuilder<T> {
    return new this.QueryBuilderConstructor({
      queryFn: this.config.queryFn,
      queryClient: this.config.queryClient,
      mergeVars: this.config.mergeVars,
      vars: this.config.vars,
    });
  }
}

export type MutationBuilderConfig<T extends BuilderTypeTemplate> = QueryInvalidatesMetadata<
  T['vars'],
  T['data'],
  T['error']
> & {
  queryFn: BuilderQueryFn<T>;

  vars?: Partial<T['vars']>;
  mergeVars?: BuilderMergeVarsFn<T['vars']>;

  options?: UseMutationOptions<T['data'], T['error'], T['vars']>;
  queryClient?: QueryClient;
};
