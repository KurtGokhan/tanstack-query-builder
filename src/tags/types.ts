import type { QueryClient } from '@tanstack/react-query';
import { StringLiteral } from '../types/utils';
import type { QueryTagType } from './tag-types';

/**
 * ID can be any value. But some values like `LIST` are reserved for special cases.
 */
export type QueryTagId = 'LIST' | StringLiteral | number | null | undefined;

export type QueryTagObject = { type: QueryTagType; id?: QueryTagId };

export type QueryTag = QueryTagType | QueryTagObject;

export type QueryTagContext<TVars = void, TData = unknown, TErr = unknown> = {
  client: QueryClient;
  vars: TVars;
  data: TData;
  error?: TErr;
};

export type QueryTagCallback<TVars = void, TData = unknown, TErr = unknown, TTag = QueryTag> = (
  ctx: QueryTagContext<TVars, TData, TErr>,
) => readonly TTag[];

export type QueryTagOption<TVars = void, TData = unknown, TErr = unknown, TTag extends QueryTag = QueryTag> =
  | TTag
  | readonly TTag[]
  | QueryTagCallback<TVars, TData, TErr, TTag>;

export type QueryUpdater<TVars = unknown, TData = unknown, TErr = unknown, TTarget = unknown> = (
  ctx: QueryTagContext<TVars, TData, TErr>,
  target: TTarget,
) => TTarget;

export type QueryUpdateTagObject<
  TVars = unknown,
  TData = unknown,
  TErr = unknown,
  TTarget = unknown,
> = QueryTagObject & {
  /**
   * Custom updater that receives the query data and relevant context, and returns the new data.
   */
  updater?: QueryUpdater<TVars, TData, TErr, TTarget>;

  /**
   * When to invalidate the query.
   * - `pre`: Invalidates the query before the mutation, but doesn't refetch it. Doesn't have an effect on pessimistic updates.
   * - `post`: Invalidates the query after the mutation is settled, and refetches it.
   * - `none`: Doesn't invalidate the query. User can manually invalidate or choose not to invalidate.
   * - `both`: The default. Applies both `pre` and `post` behavior.
   */
  invalidate?: 'pre' | 'post' | 'none' | 'both';
};

export type QueryUpdateTag<TVars = unknown, TData = unknown, TErr = unknown, TTarget = unknown> =
  | QueryTagType
  | QueryUpdateTagObject<TVars, TData, TErr, TTarget>;

export type QueryTagsMetadata<TVars = void, TData = unknown, TErr = unknown> = {
  /**
   * Provides tags for the query, which can be used by mutations to invalidate or optimistically update the query data.
   */
  tags?: QueryTagOption<TVars, TData, TErr>;
};

export type QueryInvalidatesMetadata<TVars = void, TData = unknown, TErr = unknown> = {
  /**
   * Invalidates queries with the matching tags.
   */
  invalidates?: QueryTagOption<TVars, TData, TErr>;

  /**
   * Updates the matching tags with the data returned by the mutation, or a custom updater.
   * This is called after the mutation has succeeded, so it is not instantaneous.
   */
  updates?: QueryTagOption<TVars, TData, TErr, QueryUpdateTag<TVars, TData, TErr, unknown>>;

  /**
   * Updates the matching tags with the body passed to the mutation, or a custom updater.
   * Unlike `updates`, this doesn't wait for the mutation to succeed, so the data is not available in the updater.
   * If the mutation fails, the data will be rolled back.
   */
  optimisticUpdates?: QueryTagOption<TVars, unknown, TErr, QueryUpdateTag<TVars, unknown, TErr, unknown>>;
};
