import { MutationFunction, QueryClient, UseMutationOptions, useMutation } from '@tanstack/react-query';
import { mergeTagOptions } from '../tags/mergeTagOptions';
import { QueryInvalidatesMetadata } from '../tags/types';
import { Prettify } from '../types/utils';
import { BuilderMergeVarsFn } from './types';
import { BuilderTypeTemplate, PrettifyWithVars } from './types';
import { mergeMutationOptions, mergeVars } from './utils';

export class MutationBuilderFrozen<T extends BuilderTypeTemplate> {
  constructor(protected config: MutationBuilderConfig<T>) {}

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

  getMutationOptions: (
    opts?: MutationBuilderConfig<T>['options'],
  ) => UseMutationOptions<T['data'], T['error'], T['vars']> = (opts) => {
    return mergeMutationOptions([
      {
        mutationFn: (vars) => this.config.mutationFn(this.mergeVars([this.config.vars, vars])),
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

  useMutation: (
    opts?: MutationBuilderConfig<T>['options'],
  ) => ReturnType<typeof useMutation<T['data'], T['error'], T['vars']>> = (opts) => {
    return useMutation(this.getMutationOptions(opts), this.config.queryClient);
  };
}

export class MutationBuilder<T extends BuilderTypeTemplate = BuilderTypeTemplate> extends MutationBuilderFrozen<T> {
  withVars<TVars = T['vars']>(vars?: TVars): MutationBuilder<PrettifyWithVars<T, Partial<TVars>>> {
    if (!vars) return this as any;

    return this.withConfig({
      vars: this.mergeVars([this.config.vars, vars]),
    }) as any;
  }

  withData<TData>(): MutationBuilder<Prettify<T & { data: TData }>> {
    return this as any;
  }

  withError<TError>(): MutationBuilder<Prettify<T & { error: TError }>> {
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
}

export type MutationBuilderConfig<T extends BuilderTypeTemplate> = QueryInvalidatesMetadata<
  T['vars'],
  T['data'],
  T['error']
> & {
  mutationFn: MutationFunction<T['data'], T['vars']>;

  vars?: Partial<T['vars']>;
  mergeVars?: BuilderMergeVarsFn<T['vars']>;

  options?: UseMutationOptions<T['data'], T['error'], T['vars']>;
  queryClient?: QueryClient;
};
