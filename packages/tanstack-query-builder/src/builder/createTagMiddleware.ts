import { hashKey } from '@tanstack/react-query';
import { resolveTags } from '../tags/resolveTags';
import type { QueryTagCache, QueryTagObject, QueryTagOption } from '../tags/types';
import type { MiddlewareFn } from './createMiddlewareFunction';

type CreateTagMiddleware = <TVars, TData, TError, TKey extends unknown[]>(
  tags: QueryTagOption<any, any, any, any>[],
  cacheId: string | number,
) => MiddlewareFn<TVars, TData, TError, TKey, TData>;

export const createTagMiddleware: CreateTagMiddleware = (tags, cacheId) =>
  async function tagMiddlware(ctx, next, config) {
    if (ctx.operationType === 'mutation') return next(ctx);

    let resolvedTags: QueryTagObject[] = [];

    try {
      const data = await next(ctx);

      resolvedTags = resolveTags<any>({ tags, client: ctx.client, vars: ctx.vars, data });

      return data;
    } catch (error) {
      resolvedTags = resolveTags<any>({ tags, client: ctx.client, vars: ctx.vars, error });

      throw error;
    } finally {
      const sanitized = config?.queryKeySanitizer ? config.queryKeySanitizer(ctx.queryKey) : ctx.queryKey;
      const hash = hashKey(sanitized);
      const tagCache = ((ctx.client as any).tagCache ??= {}) as QueryTagCache;
      const tags = (tagCache[hash] ??= {});
      tags[cacheId] = resolvedTags;
    }
  };
