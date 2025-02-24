import { BuilderMutationCache } from '../tags/cache';
import { operateOnTags } from '../tags/operateOnTags';
import { resolveTags } from '../tags/resolveTags';
import { QueryTagContext, QueryTagOption, QueryUpdateTagObject } from '../tags/types';
import { UpdateTagsUndoer, undoUpdateTags, updateTags } from '../tags/updateTags';
import { MiddlewareFn } from './createMiddlewareFunction';
import { BuilderTypeTemplate } from './types';

type CreateUpdateMiddleware = <T extends BuilderTypeTemplate>(
  tags: QueryTagOption<T['vars'], T['data'], T['error'], QueryUpdateTagObject<T['vars'], T['data'], T['error'], any>>[],
) => MiddlewareFn<T['vars'], T['data'], T['error'], T>;

export const createUpdateMiddleware: CreateUpdateMiddleware = (tags) =>
  async function updateMiddleware(ctx, next) {
    const cache = ctx.client.getMutationCache();
    if (!(cache instanceof BuilderMutationCache)) return next(ctx);

    let undos: UpdateTagsUndoer[] | null = null;
    const invalidates: QueryUpdateTagObject[] = [];
    const optCtx: QueryTagContext<unknown> = { client: ctx.client, vars: ctx.vars, data: undefined };

    try {
      const optUpdates = resolveTags<any, QueryUpdateTagObject>({ tags, ...optCtx }).filter((u) => u.optimistic);
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

      const pesCtx: QueryTagContext<unknown> = { ...optCtx, data };
      const pesUpdates = resolveTags<any, QueryUpdateTagObject>({ tags, ...pesCtx }).filter((u) => !u.optimistic);
      updateTags({ queryClient: ctx.client, tags: pesUpdates.filter((x) => x.updater), ctx: pesCtx });
      invalidates.push(...pesUpdates);

      return data;
    } catch (error) {
      if (undos?.length) undoUpdateTags(undos, ctx.client);

      const pesCtx: QueryTagContext<unknown> = { ...optCtx, error };
      const pesUpdates = resolveTags<any, QueryUpdateTagObject>({ tags, ...pesCtx }).filter((u) => !u.optimistic);
      invalidates.push(...pesUpdates);

      throw error;
    } finally {
      const tagsToInvalidate = invalidates.filter((tag) => ['post', 'both'].includes(tag.invalidate || 'both'));

      operateOnTags({ tags: tagsToInvalidate, queryClient: ctx.client });

      if (cache.syncChannel) {
        const tagsToSync = tagsToInvalidate.map(({ type, id }) => ({ type, id }));
        cache.syncChannel.postMessage({ type: 'invalidate', data: tagsToSync });
      }
    }
  };
