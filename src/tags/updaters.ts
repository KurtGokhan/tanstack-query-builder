import { QueryTagObject, QueryUpdater, QueryUpdaterFn } from './types';

export function getUpdater<TVars = unknown, TData = unknown, TErr = unknown, TTarget = unknown>(
  updater: QueryUpdater<TVars, TData, TErr, TTarget>,
  tag: QueryTagObject,
): QueryUpdaterFn<TVars, TData, TErr, TTarget> | undefined {
  if (typeof updater === 'function') return updater;

  const [_, updaterType, updaterKey, __, byKey] = updater.match(/^(\w+)-(\w+)(-by-(\w+))?$/) || [];

  const getFromCtx = (ctx: any) => {
    if (updaterKey === 'data') return ctx.data;
    if (updaterKey === 'vars') return ctx.vars;
    if (updaterKey === 'body') return ctx.vars?.body;
    if (updaterKey === 'params') return ctx.vars?.params;
    if (updaterKey === 'search') return ctx.vars?.search;
    return undefined;
  };

  if (updaterType === 'clear') {
    return (ctx, target) => undefined as unknown as TTarget;
  }

  if (updaterType === 'merge') {
    return (ctx, target) => ({ ...target, ...getFromCtx(ctx) });
  }

  if (updaterType === 'replace') {
    return (ctx, target) => getFromCtx(ctx) as TTarget;
  }

  if (updaterType === 'create') {
    return (ctx, target): any => {
      if (!target) return target;

      const data = getFromCtx(ctx);
      const dataKey = data[byKey];
      if (!dataKey) return target;

      if (Array.isArray(target)) {
        const foundIndex = target.findIndex((item) => item[byKey] === dataKey);
        if (foundIndex < 0) return [...target, data];
        return target;
      }

      if ((target as any)[byKey]) return target;
      return { ...target, [dataKey]: data };
    };
  }

  if (updaterType === 'update') {
    return (ctx, target): any => {
      if (!target) return target;

      const data = getFromCtx(ctx);
      const dataKey = data[byKey];
      if (!dataKey) return target;

      if (Array.isArray(target)) {
        const foundIndex = target.findIndex((item) => item[byKey] === dataKey);
        if (foundIndex < 0) return target;
        return target.map((item, index) => (index === foundIndex ? data : item));
      }
      if ((target as any)[byKey]) return { ...target, [dataKey]: data };
      return target;
    };
  }

  if (updaterType === 'upsert') {
    return (ctx, target): any => {
      if (!target) return target;

      const data = getFromCtx(ctx);
      const dataKey = data[byKey];
      if (!dataKey) return target;

      if (Array.isArray(target)) {
        const foundIndex = target.findIndex((item) => item[byKey] === dataKey);
        if (foundIndex < 0) return [...target, data];
        return target.map((item, index) => (index === foundIndex ? data : item));
      }
      return { ...target, [dataKey]: data };
    };
  }

  if (updaterType === 'delete') {
    return (ctx, target): any => {
      if (!target || typeof target !== 'object') return target;

      const data = getFromCtx(ctx);
      const dataKey = data[byKey];
      if (!dataKey) return target;

      if (Array.isArray(target)) {
        return target.filter((item) => item[byKey] !== dataKey);
      }
      if (!(byKey in target)) return target;
      const { [String(dataKey)]: _, ...rest } = target as any;
      return rest;
    };
  }

  if (updaterType === 'switch') {
    return (ctx, target): any => {
      if (!target) return target;

      const data = getFromCtx(ctx);
      const dataKey = data[byKey];
      if (!dataKey) return target;

      if (Array.isArray(target)) {
        const foundIndex = target.findIndex((item) => item[byKey] === dataKey);
        if (foundIndex < 0) return target;
        return target.map((item, index) => (index === foundIndex ? data : item));
      }
      if ((target as any)[byKey]) return { ...target, [dataKey]: data };
      return target;
    };
  }

  return undefined;
}
