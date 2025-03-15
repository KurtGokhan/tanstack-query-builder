import type { BuilderKeySanitizerFn, BuilderMergeVarsFn, BuilderQueryFn } from '../builder/types';
import type { HttpBuilderVars } from './builder-types';
import { httpRequest } from './request';
import { createHttpUrl } from './request-utils';

export function createHttpMergeVarsFn<TVars extends HttpBuilderVars>(): BuilderMergeVarsFn<TVars> {
  const mergeHttpVars: BuilderMergeVarsFn<TVars> = (v1, v2) => {
    return {
      ...v1,
      ...v2,
      ...(v1?.headers || v2?.headers ? { headers: { ...v1?.headers!, ...v2?.headers! } } : {}),
      ...(v1?.params || v2?.params ? { params: { ...v1?.params!, ...v2?.params! } } : {}),
      ...(v1?.search || v2?.search ? { search: { ...v1?.search!, ...v2?.search! } } : {}),
      ...(v1?.meta || v2?.meta ? { meta: { ...v1?.meta!, ...v2?.meta! } } : {}),
    };
  };

  return mergeHttpVars;
}

export function createHttpQueryFn<TVars, TData, TError, TKey extends unknown[]>(
  mergeVarsFn: BuilderMergeVarsFn<TVars>,
): BuilderQueryFn<TVars, TData, TError, TKey> {
  return async ({ queryKey, signal, pageParam }) => {
    const [vars] = queryKey || [];
    const mergedVars = mergeVarsFn(vars as any, pageParam as any);
    return httpRequest<TData>({ ...(mergedVars as any), signal });
  };
}

/**
 * A query key sanitizer function that normalizes the query key
 * and removes irrelevant options which do not affect the query result.
 */
export function createHttpQueryKeySanitizer<TKey extends [HttpBuilderVars]>(): BuilderKeySanitizerFn<TKey> {
  const sanitizer: BuilderKeySanitizerFn<TKey> = function httpQueryKeySanitizer(queryKey) {
    const [vars] = queryKey || [];

    const { baseUrl, params, search, path, method, body, headers, key } = vars;
    const url = createHttpUrl({ path, params, baseUrl, search });

    const res = [url, method, body, headers, key];

    const lastNullIndex = res.findLastIndex((x) => x != null);
    return res.slice(0, lastNullIndex + 1) as TKey;
  };

  return sanitizer;
}
