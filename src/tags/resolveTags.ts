import type { Query, QueryClient } from '@tanstack/react-query';
import type { QueryTag, QueryTagObject, QueryTagOption } from './types';

export type ResolveTagsParams<
  TVars = void,
  TData = unknown,
  TErr = unknown,
  TTag extends QueryTagObject = QueryTagObject,
> = {
  tags?: QueryTagOption<TVars, TData, TErr, TTag> | QueryTagOption<TVars, TData, TErr, TTag>[] | null;
  vars: TVars;
  data?: TData;
  error?: unknown;
};

function normalizeTag<TTag extends QueryTagObject = QueryTagObject>(tag: TTag | QueryTag): TTag {
  return typeof tag === 'string' ? ({ type: tag, invalidate: 'both' } as unknown as TTag) : (tag as TTag);
}

/**
 * Resolve a tags array or function to an array of tags based on passed data, error, and vars.
 */
export function resolveTags<TVars = void, TTag extends QueryTagObject = QueryTagObject>({
  client,
  tags,
  vars,
  data,
  error,
}: ResolveTagsParams<TVars, unknown, unknown, TTag> & { client: QueryClient }) {
  const resolvedTags =
    typeof tags === 'function'
      ? (tags({ vars, error, client, data }) as TTag[])
      : // If there is an error, tags passed as array will be ignored. User should pass tags as function to handle error case if needed.
        error != null
        ? []
        : Array.isArray(tags)
          ? (tags as TTag[])
          : tags
            ? ([tags] as TTag[])
            : [];

  return resolvedTags.map(normalizeTag) || [];
}

/**
 * Returns the list of tags for a query based on the query's tags option and the query's current state.
 */
export function resolveQueryTags({ query, client }: { client: QueryClient; query: Query<any, any, any, any> }) {
  return resolveTags({
    tags: query.meta?.tags,
    client,
    vars: query.queryKey[0],
    data: query.state.data,
    error: query.state.error,
  });
}
