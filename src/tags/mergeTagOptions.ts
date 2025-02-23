import type { QueryTag, QueryTagCallback, QueryTagOption } from './types';

/**
 * Merges options passed from multiple sources to a `tags` or `invalidates` field in a query into a single option.
 */
export function mergeTagOptions<TVars = void, TData = any, TErr = any, TTag extends QueryTag = QueryTag>(
  tagsList: (QueryTagOption<TVars, TData, TErr, TTag> | undefined)[],
): QueryTagOption<TVars, TData, TErr, TTag> | undefined {
  tagsList = tagsList.filter(Boolean) as QueryTagOption<TVars, TData, TErr, TTag>[];

  if (tagsList.length === 0) return undefined;
  if (tagsList.length === 1) return tagsList[0];
  if (tagsList.every((tag) => Array.isArray(tag) || typeof tag !== 'function')) return tagsList.flat() as TTag[];

  const callback: QueryTagCallback<TVars, TData, TErr, TTag> = (...args) =>
    tagsList.flatMap((tag) => {
      if (typeof tag === 'function') return tag(...args);
      if (Array.isArray(tag)) return tag as TTag[];
      if (tag) return [tag] as TTag[];
      return [];
    });

  return callback;
}
