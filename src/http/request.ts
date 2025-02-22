import { requestConcurrency } from './concurrency';
import { Deferred } from './deferred';
import { AbortError, RequestError, TimeoutError } from './errors';
import { HttpRequestOptions } from './types';
import { createFinalUrl, inferErrorMessage, resolveCredentials } from './utils';

const CONTENT_TYPE_HEADER = 'content-type';
const CONTENT_LENGTH_HEADER = 'content-length';

function prepareParams(params: Record<string, unknown>): Record<string, string> {
  const newParams: Record<string, string> = {};

  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      let value = params[key];
      if (typeof value === 'undefined') continue;

      if (value instanceof Date) {
        value = value.toISOString();
      }

      if (Array.isArray(value)) {
        newParams[key] = value.join(',');
      } else if (typeof value === 'object') {
        newParams[key] = JSON.stringify(value);
      } else {
        newParams[key] = String(value);
      }
    }
  }

  return newParams;
}

function prepareBody(body: any): BodyInit | null | undefined {
  if (body == null) return undefined;

  if (
    body instanceof ArrayBuffer ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof FormData
  )
    return body;

  if (typeof body === 'object') return JSON.stringify(body);

  return String(body);
}

/**
 * This is a wrapper around the native fetch function that adds some extra features with the `options` parameter.
 * It handles body serialization/deserialization, query params, path params, headers.
 * By default, the return value will be the response body as JSON, unless another responseType is provided.
 * It will throw a RequestError if request is aborted, timed out, failed, or returns a status code other than 2xx.
 *
 * In React, you should use the `useHttpQuery` and its variants instead of this function.
 */
export async function httpRequest<TData = unknown>(options: HttpRequestOptions) {
  const {
    baseUrl,
    path,
    params,
    method = 'get',
    search,
    headers,
    credentials,
    timeout,
    delay = 0,
    abortable = true,
    concurrency,
    responseType,
    body,
    signal,
  } = options;

  const searchParams = prepareParams(search || {});

  const resolvedUrl = createFinalUrl(path || '', params, baseUrl);
  const finalUrl = new URL(resolvedUrl);
  finalUrl.search = new URLSearchParams(searchParams).toString();

  const hasBody = method !== 'get' && body != null;
  const bodySerialized = !hasBody ? undefined : prepareBody(body);

  const resolvedHeaders = new Headers(headers as HeadersInit);

  const resolvedCredentials: RequestInit['credentials'] = resolveCredentials(credentials);

  const request = new Request(finalUrl, {
    method,
    headers: resolvedHeaders,
    ...(hasBody && { body: bodySerialized }),
    mode: 'cors',
    credentials: resolvedCredentials,
    signal: abortable ? signal : undefined,
  });

  if (delay > 0) await Deferred.timeout(delay);
  // Prevent double requests when in React StrictMode
  else await Deferred.timeout(0);

  if (signal?.aborted) return Promise.reject(new AbortError({ request, options }));

  const semaphore = requestConcurrency(concurrency);

  try {
    if (concurrency?.key) await semaphore.ready;
    if (signal?.aborted) return Promise.reject(new AbortError({ request, options }));

    async function handleBody(response: Response) {
      const contentType = response.headers.get(CONTENT_TYPE_HEADER);

      const resolvedContentType = contentType?.includes('json')
        ? 'json'
        : contentType?.includes('octet-stream')
          ? 'blob'
          : undefined;

      const resolvedType = responseType || resolvedContentType || 'json';

      if (response.status === 204) {
        if (resolvedType === 'text') return '';
        if (resolvedType === 'blob') return new Blob();
        if (resolvedType === 'arraybuffer') return new ArrayBuffer(0);
        if (resolvedType === 'response') return response;
        return {};
      }

      if (resolvedType === 'text') return response.text();
      if (resolvedType === 'blob') return response.blob();
      if (resolvedType === 'arraybuffer') return response.arrayBuffer();
      if (resolvedType === 'response') return response;
      if (response.headers.get(CONTENT_LENGTH_HEADER) === '0') return null;
      return response.json();
    }

    async function handleResponse(response: Response) {
      const body = await handleBody(response).catch(() => null);
      if (response.ok) return body as TData;

      const message = inferErrorMessage(body);
      return Promise.reject(new RequestError(message, { options, request, response, body }));
    }

    function handleError(error: Error) {
      if (error instanceof RequestError) return Promise.reject(error);
      if (error instanceof DOMException && error.name === 'AbortError')
        return Promise.reject(new AbortError({ request, options, cause: error }));

      const message = inferErrorMessage(error);
      return Promise.reject(new RequestError(message, { options, request, cause: error }));
    }

    const fetchPromise = fetch(request).then(handleResponse, handleError);

    const timeoutPromise = Deferred.timeout(timeout).then(() =>
      Promise.reject(new TimeoutError(timeout, { options, request })),
    );

    return await Promise.race([fetchPromise, timeoutPromise]);
  } finally {
    semaphore.dispose();
  }
}
