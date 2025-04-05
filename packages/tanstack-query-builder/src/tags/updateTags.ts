import { type InfiniteData, InfiniteQueryObserver, type QueryClient, QueryObserver, type QueryState } from '@tanstack/react-query';
import { queryMatchesTag } from './operateOnTags';
import type { QueryTagContext, QueryUpdateTag } from './types';
import { getUpdater } from './updaters';

export type UpdateTagsUndoer = {
  hash: string;
  data: unknown;
  newData: unknown;
  subscribe(): void;
  dispose(): void;
  undo(): void;
};

/**
 * Works similar to invalidateTags, but instead of invalidating queries, it updates them with the provided updater or the data resulting from the mutation.
 */
export function updateTags({
  tags,
  queryClient,
  ctx,
}: {
  tags: readonly QueryUpdateTag<any, any, any, any>[];
  queryClient: QueryClient;
  ctx: QueryTagContext<unknown>;
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
    const updaterFn = getUpdater(updater);
    if (!updaterFn) continue;

    /**
     * If the tag has an invalidate property, we will set the fetchStatus to 'fetching' to indicate that the query is being updated.
     * This is useful for optimistic update cases, where the query isn't actually being fetched, but we want to show a loading state anyway.
     */
    const willInvalidate = typeof tag !== 'object' || ['post', 'both'].includes(tag.invalidate || 'both');

    for (const q of list) {
      let isInfinite = false;

      function getNewData() {
        if (!updaterFn) return undefined;

        let newData: unknown;
        if (q.observers[0] && q.observers[0] instanceof InfiniteQueryObserver) {
          isInfinite = true;
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

        return newData;
      }

      const newData = getNewData();

      let observer: QueryObserver<any, any> | InfiniteQueryObserver<any, any> | null = null;

      const updateType = tag.optimistic ? ('optimistic' as const) : ('pessimistic' as const);
      const meta = { updated: updateType };

      let subscribePaused = false;
      const undoObj: UpdateTagsUndoer = {
        hash: q.queryHash,
        data: q.state.data,
        newData,
        subscribe: () => {
          subscribePaused = false;
          observer = isInfinite
            ? new InfiniteQueryObserver(queryClient, { ...(q.options as any), enabled: false })
            : new QueryObserver(queryClient, { queryKey: q.queryKey, enabled: false });
          observer.trackProp('data');

          q.addObserver(observer);
          observer.subscribe((ev) => {
            if (subscribePaused) return;

            const newData = getNewData();
            undoObj.newData = newData;

            subscribePaused = true;
            setDataToExistingQuery(queryClient, undoObj.hash, newData, willInvalidate ? { isInvalidated: true } : undefined, meta);
            subscribePaused = false;
          });
        },
        dispose: () => {
          if (!observer) return;
          q.removeObserver(observer);
          observer.destroy();
          observer = null;
          subscribePaused = true;
        },
        undo: () => {
          undoObj.dispose();
          setDataToExistingQuery(queryClient, undoObj.hash, undoObj.data, undefined, { updated: 'undone' });
        },
      };
      undos.push(undoObj);

      subscribePaused = true;
      setDataToExistingQuery(queryClient, undoObj.hash, newData, willInvalidate ? { isInvalidated: true } : undefined, meta);
      subscribePaused = false;
    }
  }

  return undos;
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
  query?.setData(newData, { manual: true });
  if (state || meta) query?.setState(state || {}, { meta });
}
