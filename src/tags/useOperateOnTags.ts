import {
  type InvalidateOptions,
  type InvalidateQueryFilters,
  MutationFunction,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { type OperateOnTagsOperation, operateOnTags } from './operateOnTags';
import type { QueryTagStaticOption } from './types';

type OperateMutationOpts = {
  tags?: QueryTagStaticOption;
  operation?: OperateOnTagsOperation;
  filters?: InvalidateQueryFilters;
  options?: InvalidateOptions;
};

/**
 * This hook returns a function that can be used to operate on queries based on tags.
 * It also returns the mutation object that can be used to track the state of the operation.
 * See `operateOnTags` for more information.
 */
export function useOperateOnTags(opts?: OperateMutationOpts | void) {
  const queryClient = useQueryClient();
  const mutationFn: MutationFunction<unknown, OperateMutationOpts | void> = (
    { tags = [], operation = 'invalidate', filters, options } = opts || {},
  ) => operateOnTags({ queryClient, tags, operation }, filters, options);

  const mutation = useMutation({ mutationFn });
  const operate = mutation.mutateAsync;

  return [operate, mutation] as const;
}
