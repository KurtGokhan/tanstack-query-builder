import type { DefaultError, UseMutationOptions } from '@tanstack/react-query';
import { mergeTagOptions } from './mergeTagOptions';

export function mergeMutationOptions<TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown>(
  optsList: (Partial<UseMutationOptions<TData, TError, TVariables, TContext>> | undefined | null)[],
): UseMutationOptions<TData, TError, TVariables, TContext> {
  type TOpt = UseMutationOptions<TData, TError, TVariables, TContext>;
  const filtered = optsList.filter(Boolean) as TOpt[];

  if (!filtered?.length) return {};
  if (filtered.length === 1) return filtered[0];

  const opts = {} as TOpt;

  for (const { meta, ...opt } of filtered) {
    Object.assign(opts, opt);
    opts.meta = {
      ...opts.meta,
      ...meta,
      invalidates: mergeTagOptions([opts.meta?.invalidates, meta?.invalidates]),
    };
  }

  return opts;
}
