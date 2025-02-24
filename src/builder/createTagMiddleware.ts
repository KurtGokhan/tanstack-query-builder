import { resolveTags } from '../tags/resolveTags';
import { QueryTagObject, QueryTagOption } from '../tags/types';
import { MiddlewareFn } from './createMiddlewareFunction';
import { BuilderTypeTemplate } from './types';

type CreateTagMiddleware = <T extends BuilderTypeTemplate>(
  tags: QueryTagOption[],
  setTags: (tags: QueryTagObject[]) => void,
) => MiddlewareFn<T['vars'], T['data'], T['error'], T>;

export const createTagMiddleware: CreateTagMiddleware = (tags, setTags) =>
  async function tagMiddlware(ctx, next) {
    let resolvedTags: QueryTagObject[] = [];

    try {
      const data = await next(ctx);

      resolvedTags = resolveTags<any>({ tags, client: ctx.client, vars: ctx.vars, data });

      return data;
    } catch (error) {
      resolvedTags = resolveTags<any>({ tags, client: ctx.client, vars: ctx.vars, error });

      throw error;
    } finally {
      setTags(resolvedTags);
    }
  };
