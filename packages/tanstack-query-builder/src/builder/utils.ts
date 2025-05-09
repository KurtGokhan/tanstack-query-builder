import {
  type DefaultError,
  type MutationKey,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
  hashKey,
} from '@tanstack/react-query';
import type { BuilderKeySanitizerFn, BuilderMergeVarsFn } from './types';

export function mergeQueryEnabled(
  opts: (UseQueryOptions<any, any, any, any>['enabled'] | undefined | null)[],
): UseQueryOptions<any, any, any, any>['enabled'] {
  if (opts.some((opt) => typeof opt === 'function'))
    return (q) => opts.every((opt) => (typeof opt === 'function' ? opt(q) : opt !== false));
  return opts.every((x) => x !== false);
}

export function mergeMutationOptions<TData = unknown, TError = DefaultError, TVars = unknown>(
  optsList: (Partial<UseMutationOptions<TData, TError, TVars>> | undefined | null)[],
): UseMutationOptions<TData, TError, TVars> {
  type TOpt = UseMutationOptions<TData, TError, TVars>;
  const filtered = optsList.filter(Boolean) as TOpt[];

  if (filtered.length === 1) return filtered[0];

  const opts = {} as TOpt;

  for (const { meta, ...opt } of filtered) {
    Object.assign(opts, opt);
    opts.meta = { ...opts.meta, ...meta };
  }

  opts.meta ??= {};

  return opts;
}

export function mergeVars<T>(list: (Partial<T> | undefined)[], fn?: BuilderMergeVarsFn<T>): T {
  if (list.length === 0) return {} as T;
  if (list.length === 1) return list[0] as T;
  return list.reduce((acc, curr) =>
    curr == null ? acc : acc == null ? curr : fn ? fn(acc as T, curr) : { ...(acc as any), ...curr },
  ) as T;
}

export function areKeysEqual(a: QueryKey | MutationKey, b: QueryKey | MutationKey, hashFn?: BuilderKeySanitizerFn<any>): boolean {
  if (!hashFn) return hashKey(a) === hashKey(b);
  return hashKey(hashFn(a)) === hashKey(hashFn(b));
}

export function getRandomKey() {
  return Math.random().toString(36).substring(7);
}

export function assertThis<T>(t: T): asserts t is T & {} {
  if (t === undefined) throw new Error('Method called on unbound instance. Use `asBound` to bind methods.');
}

export function bindMethods(self: Record<string, any>, methodsToBind: string[]) {
  for (const method of methodsToBind) self[method] = self[method].bind(self);
}
