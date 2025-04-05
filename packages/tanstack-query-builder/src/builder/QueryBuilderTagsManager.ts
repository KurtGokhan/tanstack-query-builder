import { type MutationFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import { operateOnTags } from '../tags/operateOnTags';
import type { QueryTagContext, QueryUpdateTag, TagOperationOptions } from '../tags/types';
import { updateTags } from '../tags/updateTags';
import type { WithOptional } from '../type-utils';
import type { QueryBuilderFrozen } from './QueryBuilderFrozen';
import { bindMethods } from './utils';

const methodsToBind = ['useOperation', 'operate', 'cancel', 'invalidate', 'refetch', 'remove', 'reset', 'update'];

export class QueryBuilderTagsManager<TVars, TData, TError, TKey extends unknown[], TTags extends Record<string, unknown>> {
  constructor(private builder: QueryBuilderFrozen<TVars, TData, TError, TKey, TTags, any>) {
    if (builder.config.bound) bindMethods(this, methodsToBind);
  }

  /**
   * This hook returns a function that can be used to operate on queries based on tags.
   * It also returns the mutation object that can be used to track the state of the operation.
   */
  useOperation(opts?: TagOperationOptions<TTags> | void) {
    const queryClient = useQueryClient(this.builder.config.queryClient);
    const mutationFn: MutationFunction<unknown, TagOperationOptions<TTags> | void> = (
      { tags = [], operation = 'invalidate', filters, options } = opts || {},
    ) => operateOnTags({ queryClient, tags, operation }, filters, options);

    const mutation = useMutation({ mutationFn });
    const operate = mutation.mutateAsync;

    return [operate, mutation] as const;
  }

  operate({ tags = [], operation = 'invalidate', filters, options }: TagOperationOptions<TTags>) {
    return operateOnTags({ queryClient: this.builder.config.queryClient!, tags, operation }, filters, options);
  }

  cancel(args: Omit<TagOperationOptions<TTags>, 'operation'>) {
    return this.operate({ ...args, operation: 'cancel' });
  }
  invalidate(args: Omit<TagOperationOptions<TTags>, 'operation'>) {
    return this.operate({ ...args, operation: 'invalidate' });
  }
  refetch(args: Omit<TagOperationOptions<TTags>, 'operation'>) {
    return this.operate({ ...args, operation: 'refetch' });
  }
  remove(args: Omit<TagOperationOptions<TTags>, 'operation'>) {
    return this.operate({ ...args, operation: 'remove' });
  }
  reset(args: Omit<TagOperationOptions<TTags>, 'operation'>) {
    return this.operate({ ...args, operation: 'reset' });
  }

  /**
   * This function can be used to update the queries in cache based on given tags.
   */
  update({
    tags = [],
    client = this.builder.config.queryClient,
    ...ctx
  }: {
    tags: readonly QueryUpdateTag<TVars, TData, TError, TTags>[];
  } & WithOptional<QueryTagContext<TVars, TData, TError>, 'client'>) {
    updateTags({ tags, queryClient: client!, ctx: { client: client!, ...ctx } });
  }
}
