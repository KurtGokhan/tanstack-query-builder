import { MutationFunction, QueryClient, UseMutationOptions, useMutation } from '@tanstack/react-query';
import { CreateQueryMergeVarsFn } from '../create/types';
import { mergeMutationOptions, mergeVars } from '../create/utils';
import { QueryInvalidatesMetadata } from '../tags/types';
import { Prettify } from '../types/utils';
import { BuilderTypeTemplate, PrettifyWithVars } from './types';

export class MutationBuilderFrozen<T extends BuilderTypeTemplate> {
  constructor(protected config: MutationBuilderConfig<T>) {}

  getMutationOptions: (
    opts?: MutationBuilderConfig<T>['options'],
  ) => UseMutationOptions<T['data'], T['error'], T['vars']> = (opts) => {
    return mergeMutationOptions([
      {
        mutationFn: this.config.mutationFn,
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
  withVars<TVars>(vars?: TVars): MutationBuilder<PrettifyWithVars<T, TVars>> {
    if (!vars) return this as any;

    return this.withConfig({
      vars: mergeVars([this.config.vars, vars], this.config.mergeVars),
    }) as any;
  }

  withData<TData>(): MutationBuilder<Prettify<T & { data: TData }>> {
    return this as any;
  }

  withError<TError>(): MutationBuilder<Prettify<T & { error: TError }>> {
    return this as any;
  }

  withConfig(config: Partial<MutationBuilderConfig<T>>): MutationBuilder<T> {
    return new MutationBuilder<T>({ ...this.config, ...config });
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
  mergeVars?: CreateQueryMergeVarsFn<T['vars']>;

  options?: UseMutationOptions<T['data'], T['error'], T['vars']>;
  queryClient?: QueryClient;
};
