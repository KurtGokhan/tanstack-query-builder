import { operateOnTags } from '../tags/operateOnTags';
import { resolveTags } from '../tags/resolveTags';
import type { QueryTagContext, QueryTagOption, QueryUpdateTagObject } from '../tags/types';
import { type UpdateTagsUndoer, updateTags } from '../tags/updateTags';
import type { MiddlewareFn } from './createMiddlewareFunction';

type CreateUpdateMiddleware = <TVars, TData, TError, TKey extends unknown[], TTags extends Record<string, unknown>>(
  tags: QueryTagOption<TVars, TData, TError, QueryUpdateTagObject<TVars, TData, TError, TTags>>[],
) => MiddlewareFn<TVars, TData, TError, TKey>;

export const createUpdateMiddleware: CreateUpdateMiddleware = (tags) =>
  async function updateMiddleware(ctx, next, config) {
    if (ctx.operationType !== 'mutation') return next(ctx);

    type TagObj = QueryUpdateTagObject<any, any, any, any>;
    type TagCtx = QueryTagContext<any>;

    const undos: UpdateTagsUndoer[] = [];
    const invalidates: TagObj[] = [];
    const preCtx: TagCtx = { client: ctx.client, vars: ctx.vars, data: undefined };

    try {
      const preUpdates = resolveTags({ tags, ...preCtx }).filter((u) => u.optimistic);
      const preUndos = updateTags({
        queryClient: ctx.client,
        tags: preUpdates.filter((x) => x.updater),
        ctx: preCtx,
      });

      invalidates.push(...preUpdates);
      preUndos.forEach((undo) => undo.subscribe());
      undos.push(...preUndos);

      const preInvalidate = preUpdates.filter((tag) => ['pre', 'both'].includes(tag.invalidate || 'both'));
      operateOnTags({ queryClient: ctx.client, tags: preInvalidate }, { refetchType: 'none' });

      const data = await next(ctx);

      const postCtx: TagCtx = { ...preCtx, data };
      const postUpdates = resolveTags({ tags, ...postCtx }).filter((u) => !u.optimistic);
      const postUndos = updateTags({ queryClient: ctx.client, tags: postUpdates.filter((x) => x.updater), ctx: postCtx });

      invalidates.push(...postUpdates);
      postUndos.forEach((undo) => undo.subscribe());
      undos.push(...postUndos);

      return data;
    } catch (error) {
      if (undos?.length) undos.forEach((undo) => undo.undo());

      const postCtx: TagCtx = { ...preCtx, error };
      const postUpdates = resolveTags({ tags, ...postCtx }).filter((u) => !u.optimistic);
      invalidates.push(...postUpdates);

      throw error;
    } finally {
      const finalInvalidates = invalidates.filter((tag) => ['post', 'both'].includes(tag.invalidate || 'both'));

      operateOnTags({ tags: finalInvalidates, queryClient: ctx.client }).finally(() => {
        if (undos?.length) undos.forEach((undo) => undo.dispose());
      });

      if (config.syncChannel) {
        const tagsToSync = finalInvalidates.map(({ type, id }) => ({ type, id }));
        config.syncChannel.postMessage({ type: 'invalidate', data: tagsToSync });
      }
    }
  };
