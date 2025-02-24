import { hashKey } from '@tanstack/react-query';
import { BuilderMutationCache } from '../tags/cache';
import { resolveTags } from '../tags/resolveTags';
import { QueryTagObject, QueryTagOption } from '../tags/types';
import { MiddlewareFn } from './middlewares';
import { BuilderTypeTemplate } from './types';

type CreateTagMiddleware = <T extends BuilderTypeTemplate>(
  tags: QueryTagOption[],
) => MiddlewareFn<T['vars'], T['data'], T['error'], T>;

export const createTagMiddleware: CreateTagMiddleware = (tags) =>
  async function tagMiddlware(ctx, next) {
    const mutationCache = ctx.client.getMutationCache();
    if (!(mutationCache instanceof BuilderMutationCache)) return next(ctx);

    let resolvedTags: QueryTagObject[] = [];

    try {
      const data = await next(ctx);

      resolvedTags = resolveTags<any>({ tags, client: ctx.client, vars: ctx.vars, data });

      return data;
    } catch (error) {
      resolvedTags = resolveTags<any>({ tags, client: ctx.client, vars: ctx.vars, error });

      throw error;
    } finally {
      if (resolvedTags.length) {
        const hash = hashKey(ctx.queryKey);

        mutationCache.tagsCache.push(
          ...resolvedTags.map((tag) => ({
            hash,
            tag,
          })),
        );
      }
    }
  };
