import { Prettify } from '../types/utils';
import { RequestConcurrencyOptions } from './concurrency';

export type HttpRequestHeaders = {
  [header: string]: string | string[];
};

export type HttpRequestParams = {
  [param: string]: null | undefined | string | number | boolean | ReadonlyArray<string | number | boolean>;
};

export type PathParam = string | number | null | undefined;

export type HttpRequestPathParams = {
  [param: string]: PathParam;
};

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface HttpRequestMeta {}

export type HttpRequestOptions<
  TSearch extends HttpRequestParams = HttpRequestParams,
  TBody = unknown,
  TParams extends HttpRequestPathParams = HttpRequestPathParams,
  THeaders extends HttpRequestHeaders = HttpRequestHeaders,
  TPath extends string = string,
> = {
  path?: TPath;
  signal?: AbortSignal;
  responseType?: 'arraybuffer' | 'blob' | 'json' | 'text' | 'response';
  body?: TBody;
  headers?: THeaders;
  search?: TSearch;
  params?: ExtractPathParams<TPath> & TParams;
  method?: HttpMethod;
  credentials?: boolean | RequestInit['credentials'];
  meta?: HttpRequestMeta;

  /**
   * Additional key that will be used to identify the request.
   * When the key changes, the request will be refetched.
   */
  key?: unknown;

  /**
   * Prepended to the URL if it is not an absolute URL.
   */
  baseUrl?: string;

  /**
   * The request will be aborted after the specified number of milliseconds.
   */
  timeout?: number;

  /**
   * If `true` (default), the request will be aborted when the query is cancelled.
   */
  abortable?: boolean;

  /**
   * The request will be delayed by the specified number of milliseconds.
   * Useful for debouncing requests that might be triggered multiple times in a short period of time.
   * Can also be used to simulate slow network.
   */
  delay?: number;

  /**
   * Sets the maximum number of concurrent requests that can be running at the same time for a specific key.
   */
  concurrency?: RequestConcurrencyOptions;
};

export type ExtractPathParams<TPath> = VoidIfEmpty<Prettify<ExtractPathParamsInternal<TPath>>>;

type VoidIfEmpty<T> = keyof T extends never ? void : T;

type ExtractPathParamsInternal<TPath> = TPath extends string
  ? string extends TPath
    ? unknown
    : TPath extends `${'http' | 'https'}://${infer TRest}`
      ? ExtractPathParamsInternal<TRest>
      : TPath extends `${string}:${infer TParam}/${infer TRest}`
        ? { [key in TParam]: PathParam } & ExtractPathParamsInternal<TRest>
        : TPath extends `${string}:${infer TParam}`
          ? { [key in TParam]: PathParam }
          : unknown
  : unknown;
