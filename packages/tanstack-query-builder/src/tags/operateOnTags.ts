import {
  type InvalidateOptions,
  type InvalidateQueryFilters,
  type Query,
  type QueryClient,
  type QueryFilters,
} from '@tanstack/react-query';
import { resolveTags } from './resolveTags';
import type { QueryTag, QueryTagStaticOption } from './types';

/**
 * Based on the behavior described in https://redux-toolkit.js.org/rtk-query/usage/automated-refetching#tag-invalidation-behavior
 */
function tagMatchesTag(queryTag: QueryTag, comparedTag: QueryTag) {
  const qType = typeof queryTag === 'object' ? queryTag?.type : queryTag;
  const cType = typeof comparedTag === 'object' ? comparedTag?.type : comparedTag;

  if (qType != null && cType === '*') return true;
  if (qType !== cType) return false;

  const cId = typeof comparedTag === 'object' ? comparedTag?.id : undefined;
  if (cId == null) return true;

  const qId = typeof queryTag === 'object' ? queryTag?.id : undefined;
  return cId === qId;
}

export function queryMatchesTag(queryClient: QueryClient, query: Query, tag: QueryTag) {
  const hash = query.queryHash;
  const tagCaches = (queryClient as any)?.tagCache?.[hash] as Record<string, QueryTag[]>;
  if (!tagCaches) return false;
  const tagsInMeta = Object.values(tagCaches)?.flatMap((t) => t || []);
  if (tagsInMeta?.length) return tagsInMeta.some((t: QueryTag) => tagMatchesTag(t, tag));
  return false;
}

export type TagOperation = 'invalidate' | 'refetch' | 'reset' | 'cancel' | 'remove';

/**
 * Operates on queries on a query client that match the given tags.
 * The tag matching behavior works similar to RTK Query's tag matching behavior.
 * More info: https://redux-toolkit.js.org/rtk-query/usage/automated-refetching#tag-invalidation-behavior
 */
export function operateOnTags(
  {
    tags,
    queryClient,
    operation = 'invalidate',
  }: {
    tags: QueryTagStaticOption;
    queryClient: QueryClient;
    operation?: TagOperation;
  },
  filters?: InvalidateQueryFilters,
  options?: InvalidateOptions,
) {
  const resolvedTags = resolveTags({ tags, client: queryClient, vars: undefined });
  if (!resolvedTags?.length) return Promise.resolve();

  const filtersObj: QueryFilters = {
    ...(operation === 'refetch' && { type: 'active' }),
    ...filters,
    predicate: (query) =>
      resolvedTags.some((tag) => queryMatchesTag(queryClient, query, tag)) && (!filters?.predicate || filters.predicate(query)),
  };

  if (operation === 'refetch') return queryClient.refetchQueries(filtersObj, options);
  if (operation === 'reset') return queryClient.resetQueries(filtersObj, options);
  if (operation === 'cancel') return queryClient.cancelQueries(filtersObj);
  if (operation === 'remove') {
    queryClient.removeQueries(filtersObj);
    return Promise.resolve();
  }
  return queryClient.invalidateQueries(filtersObj, { cancelRefetch: false, ...options });
}
