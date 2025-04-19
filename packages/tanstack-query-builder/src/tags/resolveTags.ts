import type { QueryClient } from '@tanstack/react-query';
import type { QueryTag, QueryTagContext, QueryTagObject, QueryTagOption } from './types';

export type ResolveTagsParams<TVars = void, TData = unknown, TErr = unknown, TTag extends QueryTagObject = QueryTagObject> = {
  tags?: QueryTagOption<TVars, TData, TErr, TTag, any> | QueryTagOption<TVars, TData, TErr, TTag, any>[] | null;
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
  tags,
  ...ctx
}: ResolveTagsParams<TVars, any, any, TTag> & { client: QueryClient }): TTag[] {
  const resolvedTags =
    typeof tags === 'function'
      ? resolveTags({ tags: tags(ctx as QueryTagContext<TVars, any>), ...ctx })
      : Array.isArray(tags)
        ? tags.flatMap((tag) => resolveTags({ tags: tag, ...ctx }))
        : // If there is an error, tags passed as array will be ignored. User should pass tags as function to handle error case if needed.
          ctx.error != null
          ? []
          : tags
            ? ([tags] as TTag[])
            : [];

  return resolvedTags?.filter(Boolean)?.map(normalizeTag) || [];
}
