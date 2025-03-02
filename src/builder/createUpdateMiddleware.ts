import { operateOnTags } from '../tags/operateOnTags';
import { resolveTags } from '../tags/resolveTags';
import type { QueryTagContext, QueryTagOption, QueryUpdateTagObject } from '../tags/types';
import { type UpdateTagsUndoer, undoUpdateTags, updateTags } from '../tags/updateTags';
import type { MiddlewareFn } from './createMiddlewareFunction';

type CreateUpdateMiddleware = <TVars, TData, TError, TKey extends unknown[], TTags extends Record<string, unknown>>(
  tags: QueryTagOption<TVars, TData, TError, QueryUpdateTagObject<TVars, TData, TError, TTags>>[],
) => MiddlewareFn<TVars, TData, TError, TKey>;

export const createUpdateMiddleware: CreateUpdateMiddleware = (tags) =>
  async function updateMiddleware(ctx, next, config) {
    if (ctx.operationType !== 'mutation') return next(ctx);

    type TagObj = QueryUpdateTagObject<any, any, any, any>;
    type TagCtx = QueryTagContext<any>;

    let undos: UpdateTagsUndoer[] | null = null;
    const invalidates: TagObj[] = [];
    const preCtx: TagCtx = { client: ctx.client, vars: ctx.vars, data: undefined };

    try {
      const preUpdates = resolveTags({ tags, ...preCtx }).filter((u) => u.optimistic);
      undos = updateTags({
        queryClient: ctx.client,
        tags: preUpdates.filter((x) => x.updater),
        ctx: preCtx,
        optimistic: true,
      });
      invalidates.push(...preUpdates);

      const optToInvalidate = preUpdates.filter((tag) => ['pre', 'both'].includes(tag.invalidate || 'both'));
      operateOnTags({ queryClient: ctx.client, tags: optToInvalidate }, { refetchType: 'none' });

      const data = await next(ctx);

      const postCtx: TagCtx = { ...preCtx, data };
      const postUpdates = resolveTags({ tags, ...postCtx }).filter((u) => !u.optimistic);
      updateTags({ queryClient: ctx.client, tags: postUpdates.filter((x) => x.updater), ctx: postCtx });
      invalidates.push(...postUpdates);

      return data;
    } catch (error) {
      if (undos?.length) undoUpdateTags(undos, ctx.client);

      const postCtx: TagCtx = { ...preCtx, error };
      const postUpdates = resolveTags({ tags, ...postCtx }).filter((u) => !u.optimistic);
      invalidates.push(...postUpdates);

      throw error;
    } finally {
      const tagsToInvalidate = invalidates.filter((tag) => ['post', 'both'].includes(tag.invalidate || 'both'));

      operateOnTags({ tags: tagsToInvalidate, queryClient: ctx.client });

      if (config.syncChannel) {
        const tagsToSync = tagsToInvalidate.map(({ type, id }) => ({ type, id }));
        config.syncChannel.postMessage({ type: 'invalidate', data: tagsToSync });
      }
    }
  };
