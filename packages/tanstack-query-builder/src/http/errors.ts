import type { HttpRequestOptions } from './request-types';

type RequestErrorInit = Pick<RequestError, 'options' | 'request' | 'response' | 'body' | 'cause'>;

export class RequestError extends Error {
  readonly options?: HttpRequestOptions;
  readonly request?: Request;
  readonly response?: Response;
  readonly body?: any;
  readonly cause?: Error;

  constructor(message: string, init?: RequestErrorInit) {
    super(message, { cause: init?.cause });
    Object.assign(this, init);
  }
}
RequestError.prototype.name = 'RequestError';

export class TimeoutError extends RequestError {
  static getStandardMessage(timeout?: number) {
    return timeout != null ? `Request timed out after ${timeout} milliseconds` : 'Request timed out';
  }

  constructor(timeout?: number, init?: RequestErrorInit) {
    super(TimeoutError.getStandardMessage(timeout), init);
  }
}
TimeoutError.prototype.name = 'TimeoutError';

export class AbortError extends RequestError {
  static readonly standardMessage = 'Request was aborted';

  constructor(init?: RequestErrorInit) {
    super(AbortError.standardMessage, init);
  }
}
AbortError.prototype.name = 'AbortError';
