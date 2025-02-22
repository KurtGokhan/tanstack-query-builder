import {
  type InvalidateOptions,
  type InvalidateQueryFilters,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { type OperateOnTagsOperation, operateOnTags } from './operateOnTags';
import type { QueryTag } from './types';

type OperateMutationOpts = {
  tags?: QueryTag[];
  operation?: OperateOnTagsOperation;
  filters?: InvalidateQueryFilters;
  options?: InvalidateOptions;
};

/**
 * This hook returns a function that can be used to operate on queries based on tags.
 * It also returns the mutation object that can be used to track the state of the operation.
 * See `operateOnTags` for more information.
 */
export function useOperateOnTags(opts?: OperateMutationOpts) {
  const queryClient = useQueryClient();
  const mutationFn = ({ tags = [], operation = 'invalidate', filters, options } = opts || {}) =>
    operateOnTags({ queryClient, tags, operation }, filters, options);

  const mutation = useMutation({ mutationFn });
  const operate = mutation.mutateAsync;

  return [operate, mutation] as const;
}
