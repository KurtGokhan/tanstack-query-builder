import type { QueryClient } from '@tanstack/react-query';
import { StringLiteral } from '../types/utils';
import type { QueryTagType } from './tag-types';

/**
 * ID can be any value. But some values like `LIST` are reserved for special cases.
 */
export type QueryTagId = 'LIST' | StringLiteral | number | null | undefined;

export type QueryTagObject = { type: QueryTagType; id?: QueryTagId };

export type QueryTag<TTag extends QueryTagObject = QueryTagObject> = '*' | QueryTagType | TTag;

export type QueryTagContext<TVars = void, TData = unknown, TErr = unknown> = {
  client: QueryClient;
  vars: TVars;
  data: TData;
  error?: TErr;
};

export type QueryTagCallback<TVars = void, TData = unknown, TErr = unknown, TTag = QueryTag> = (
  ctx: QueryTagContext<TVars, TData, TErr>,
) => TTag | readonly TTag[];

export type QueryTagOption<
  TVars = void,
  TData = unknown,
  TErr = unknown,
  TTag extends QueryTagObject = QueryTagObject,
> = '*' | QueryTag<TTag> | readonly QueryTag<TTag>[] | QueryTagCallback<TVars, TData, TErr, TTag>;

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

  optimistic?: boolean;

  /**
   * When to invalidate the query.
   * - `pre`: Invalidates the query before the mutation, but doesn't refetch it. Doesn't have an effect on pessimistic updates.
   * - `post`: Invalidates the query after the mutation is settled, and refetches it.
   * - `none`: Doesn't invalidate the query. User can manually invalidate or choose not to invalidate.
   * - `both`: The default. Applies both `pre` and `post` behavior.
   */
  invalidate?: 'pre' | 'post' | 'none' | 'both';
};

export type QueryUpdateTag<TVars = unknown, TData = unknown, TErr = unknown, TTarget = unknown> = QueryTag<
  QueryUpdateTagObject<TVars, TData, TErr, TTarget>
>;
