import { type InfiniteData, InfiniteQueryObserver, type QueryClient, type QueryState, useQueryClient } from '@tanstack/react-query';
import { useStableCallback } from '../hooks/useStableCallback';
import type { WithOptional } from '../type-utils';
import { queryMatchesTag } from './operateOnTags';
import type { QueryTagContext, QueryUpdateTag } from './types';
import { getUpdater } from './updaters';

export type UpdateTagsUndoer = { hash: string; data: unknown };

/**
 * Works similar to invalidateTags, but instead of invalidating queries, it updates them with the provided updater or the data resulting from the mutation.
 */
export function updateTags({
  tags,
  queryClient,
  ctx,
  optimistic,
}: {
  tags: readonly QueryUpdateTag<any, any, any, any>[];
  queryClient: QueryClient;
  ctx: QueryTagContext<unknown>;
  optimistic?: boolean;
}): UpdateTagsUndoer[] {
  if (!tags?.length) return [];

  const undos: UpdateTagsUndoer[] = [];

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];

    const list = queryClient.getQueryCache().findAll({
      predicate: (query) => queryMatchesTag(queryClient, query, tag),
      type: 'all',
    });

    const updater = typeof tag === 'object' && tag.updater;
    if (!updater) continue;
    const updaterFn = getUpdater(updater, tag);
    if (!updaterFn) continue;

    /**
     * If the tag has an invalidate property, we will set the fetchStatus to 'fetching' to indicate that the query is being updated.
     * This is useful for optimistic update cases, where the query isn't actually being fetched, but we want to show a loading state anyway.
     */
    const willInvalidate = typeof tag !== 'object' || ['post', 'both'].includes(tag.invalidate || 'both');

    for (const q of list) {
      undos.push({ hash: q.queryHash, data: q.state.data });

      let newData: unknown;
      if (q.observers[0] && q.observers[0] instanceof InfiniteQueryObserver) {
        const data = q.state.data as InfiniteData<unknown>;
        if (data.pages && Array.isArray(data.pages)) {
          newData = {
            ...data,
            pages: data.pages.map((page) => updaterFn(ctx, page)),
          } as InfiniteData<unknown>;
        }
      } else {
        newData = updaterFn(ctx, q.state.data);
      }

      setDataToExistingQuery(queryClient, q.queryHash, newData, willInvalidate ? { isInvalidated: true } : undefined, {
        updated: optimistic ? 'optimistic' : 'pessimistic',
      });
    }
  }

  return undos;
}

export function undoUpdateTags(undos: UpdateTagsUndoer[], queryClient: QueryClient) {
  for (const { hash, data } of undos) {
    setDataToExistingQuery(queryClient, hash, data, {}, { updated: 'undone' });
  }
}

/**
 * The `setQueryData` method of react-query does not take query hash fn into account.
 * It creates duplicate queries even though the query key is the same.
 * So we find the exact query and update it manually.
 */
function setDataToExistingQuery(
  queryClient: QueryClient,
  hash: string,
  newData: unknown,
  state?: Partial<QueryState>,
  meta?: {
    updated?: 'optimistic' | 'pessimistic' | 'undone';
  },
) {
  const query = queryClient.getQueryCache().get(hash);
  query?.setData(newData);
  if (state || meta) query?.setState(state || {}, { meta });
}

/**
 * This hook returns a function that can be used to operate on queries based on tags.
 * It also returns the mutation object that can be used to track the state of the operation.
 * See `operateOnTags` for more information.
 */
export function useUpdateTags(base?: {
  tags?: readonly QueryUpdateTag<any, any, any, any>[];
  ctx?: QueryTagContext<unknown>;
  optimistic?: boolean;
}) {
  const queryClient = useQueryClient();
  const update = useStableCallback(
    ({
      tags = base?.tags || [],
      ctx = base?.ctx || { client: queryClient, vars: undefined, data: undefined },
      optimistic = base?.optimistic,
    }: {
      tags: readonly QueryUpdateTag<any, any, any, any>[];
      ctx: WithOptional<QueryTagContext<unknown>, 'client'>;
      optimistic?: boolean;
    }) => updateTags({ tags, queryClient, ctx: { client: queryClient, ...ctx }, optimistic }),
  );
  return update;
}
