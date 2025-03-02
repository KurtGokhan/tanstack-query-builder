import type { InvalidateOptions, InvalidateQueryFilters, QueryClient } from '@tanstack/react-query';
import type { KeysOfValue, StringLiteral } from '../type-utils';
import type { TagOperation } from './operateOnTags';

export type TagMap = Record<string, unknown>;

export type QueryTagId = StringLiteral | number | null | undefined;

export type QueryTagObject<TMap extends TagMap = TagMap> = {
  type: keyof TMap & string;
  id?: QueryTagId;
};

export type QueryTag<TTag extends QueryTagObject = QueryTagObject<any>> = '*' | TTag['type'] | TTag;

export type QueryTagContext<TVars = void, TData = unknown, TErr = unknown> = {
  client: QueryClient;
  vars: TVars;
  data: TData;
  error?: TErr;
};

export type QueryTagCallback<TVars = void, TData = unknown, TErr = unknown, TTag = QueryTag> = (
  ctx: QueryTagContext<TVars, TData, TErr>,
) => TTag | readonly TTag[];

export type QueryTagStaticOption<TTag extends QueryTagObject<any> = QueryTagObject<any>> = '*' | QueryTag<TTag> | readonly QueryTag<TTag>[];

export type QueryTagOption<TVars = unknown, TData = unknown, TErr = unknown, TTag extends QueryTagObject<any> = QueryTagObject<any>> =
  | QueryTagStaticOption<TTag>
  | QueryTagCallback<TVars, TData, TErr, TTag>;

export type QueryUpdaterFn<TVars = unknown, TData = unknown, TErr = unknown, TTarget = unknown> = (
  ctx: QueryTagContext<TVars, TData, TErr>,
  target: TTarget,
) => TTarget;

export type QueryUpdater<TVars = unknown, TData = unknown, TErr = unknown, TTarget = unknown> =
  | QueryUpdaterFn<TVars, TData, TErr, TTarget>
  | PredefinedUpdater<TVars, TData, TErr, TTarget>;

export type PredefinedUpdater<TVars = unknown, TData = unknown, TErr = unknown, TTarget = unknown> =
  | `clear-${UpdaterSelector<TVars>}`
  | `merge-${UpdaterSelector<TVars>}`
  | `replace-${UpdaterSelector<TVars>}`
  | `${'create' | 'update' | 'upsert' | 'delete' | 'switch'}-${UpdaterSelector<TVars>}-by-${KeyOfTarget<TTarget>}`;

type UpdaterSelector<TVars> = 'data' | 'vars' | Extract<KeysOfValue<TVars, Record<string, unknown> | undefined>, string>;
type KeyOfTarget<TTarget> = KeyOfItem<TTarget> & string & {};
type KeyOfItem<TTarget> = TTarget extends readonly (infer TItem)[]
  ? keyof TItem
  : TTarget extends Record<string, infer TItem>
    ? TItem extends Record<string, any>
      ? keyof TItem
      : never
    : never;

export type QueryUpdateTagObject<TVars = unknown, TData = unknown, TErr = unknown, TMap extends TagMap = TagMap> = {
  id?: QueryTagId;

  optimistic?: boolean;

  /**
   * When to invalidate the query.
   * - `pre`: Invalidates the query before the mutation, but doesn't refetch it. Doesn't have an effect on pessimistic updates.
   * - `post`: Invalidates the query after the mutation is settled, and refetches it.
   * - `none`: Doesn't invalidate the query. User can manually invalidate or choose not to invalidate.
   * - `both`: The default. Applies both `pre` and `post` behavior.
   */
  invalidate?: 'pre' | 'post' | 'none' | 'both';
} & {
  [K in keyof TMap]: K extends string
    ? {
        type: K;
        updater?: QueryUpdater<TVars, TData, TErr, TMap[K]>;
      }
    : never;
}[keyof TMap];

export type QueryUpdateTag<TVars = unknown, TData = unknown, TErr = unknown, TMap extends TagMap = TagMap> = QueryTag<
  QueryUpdateTagObject<TVars, TData, TErr, TMap>
>;

export type QueryTagCache = Record<string | number, Record<string, QueryTagObject[]>>;

export type TagOperationOptions<TMap extends TagMap = TagMap> = {
  tags?: QueryTagStaticOption<QueryTagObject<TMap>>;
  operation?: TagOperation;
  filters?: InvalidateQueryFilters;
  options?: InvalidateOptions;
};
