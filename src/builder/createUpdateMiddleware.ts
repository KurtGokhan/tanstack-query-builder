import { operateOnTags } from '../tags/operateOnTags';
import { resolveTags } from '../tags/resolveTags';
import { QueryTagContext, QueryTagOption, QueryUpdateTagObject } from '../tags/types';
import { UpdateTagsUndoer, undoUpdateTags, updateTags } from '../tags/updateTags';
import { MiddlewareFn } from './createMiddlewareFunction';

type CreateUpdateMiddleware = <TVars, TData, TError, TKey extends unknown[], TTags extends Record<string, unknown>>(
  tags: QueryTagOption<TVars, TData, TError, QueryUpdateTagObject<TVars, TData, TError, TTags>>[],
) => MiddlewareFn<TVars, TData, TError, TKey>;

export const createUpdateMiddleware: CreateUpdateMiddleware = (tags) =>
  async function updateMiddleware(ctx, next, throwError, config) {
    type TagObj = QueryUpdateTagObject<any, any, any, any>;
    type TagCtx = QueryTagContext<any>;

    let undos: UpdateTagsUndoer[] | null = null;
    const invalidates: TagObj[] = [];
    const optCtx: TagCtx = { client: ctx.client, vars: ctx.vars, data: undefined };

    try {
      const optUpdates = resolveTags<any, TagObj>({ tags, ...optCtx }).filter((u) => u.optimistic);
      undos = updateTags({
        queryClient: ctx.client,
        tags: optUpdates.filter((x) => x.updater),
        ctx: optCtx,
        optimistic: true,
      });
      invalidates.push(...optUpdates);

      const optToInvalidate = optUpdates.filter((tag) => ['pre', 'both'].includes(tag.invalidate || 'both'));
      operateOnTags({ queryClient: ctx.client, tags: optToInvalidate }, { refetchType: 'none' });

      const data = await next(ctx);

      const pesCtx: TagCtx = { ...optCtx, data };
      const pesUpdates = resolveTags<any, TagObj>({ tags, ...pesCtx }).filter((u) => !u.optimistic);
      updateTags({ queryClient: ctx.client, tags: pesUpdates.filter((x) => x.updater), ctx: pesCtx });
      invalidates.push(...pesUpdates);

      return data;
    } catch (error) {
      if (undos?.length) undoUpdateTags(undos, ctx.client);

      const pesCtx: TagCtx = { ...optCtx, error };
      const pesUpdates = resolveTags<any, TagObj>({ tags, ...pesCtx }).filter((u) => !u.optimistic);
      invalidates.push(...pesUpdates);

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
