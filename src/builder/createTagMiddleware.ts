import { hashKey } from '@tanstack/react-query';
import { resolveTags } from '../tags/resolveTags';
import { QueryTagCache, QueryTagObject, QueryTagOption } from '../tags/types';
import { MiddlewareFn } from './createMiddlewareFunction';

type CreateTagMiddleware = <TVars, TData, TError, TKey extends unknown[]>(
  tags: QueryTagOption<any, any, any>[],
  cacheId: string | number,
) => MiddlewareFn<TVars, TData, TError, TKey>;

export const createTagMiddleware: CreateTagMiddleware = (tags, cacheId) =>
  async function tagMiddlware(ctx, next, _, config) {
    let resolvedTags: QueryTagObject[] = [];

    try {
      const data = await next(ctx);

      resolvedTags = resolveTags<any>({ tags, client: ctx.client, vars: ctx.vars, data });

      return data;
    } catch (error) {
      resolvedTags = resolveTags<any>({ tags, client: ctx.client, vars: ctx.vars, error });

      throw error;
    } finally {
      const hashFn = config?.queryKeyHashFn ?? hashKey;
      const hash = hashFn(ctx.originalQueryKey as any);
      const tagCache = ((ctx.client as any).tagCache ??= {}) as QueryTagCache;
      const tags = (tagCache[hash] ??= {});
      tags[cacheId] = resolvedTags;
    }
  };
