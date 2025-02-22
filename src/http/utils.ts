import { RequestError } from './errors';
import { HttpRequestOptions, HttpRequestPathParams } from './types';

export function createFinalUrl(path: string, pathParams: HttpRequestPathParams = {}, baseUrl?: string) {
  let finalUrl = path;

  for (const [key, value] of Object.entries(pathParams)) {
    if (typeof value !== 'undefined') {
      finalUrl = finalUrl.replace(`:${key}`, encodeURIComponent(value?.toString() || ''));
    }
  }

  if (baseUrl && !finalUrl.startsWith('http')) {
    finalUrl = `${baseUrl || ''}${finalUrl}`;
  }

  return finalUrl;
}

export function resolveCredentials(credentials: HttpRequestOptions['credentials']): RequestInit['credentials'] & {} {
  return credentials === true
    ? 'include'
    : credentials === false
      ? 'omit'
      : typeof credentials === 'string'
        ? credentials
        : 'omit';
}

const possibleErrorProps = [
  'error',
  'errors',
  'message',
  'errorMessage',
  'error_message',
  'detailedError',
  'Error',
  'Errors',
  'Message',
  'ErrorMessage',
  'DetailedError',
] as const;

export function inferErrorMessage(error: unknown): string {
  if (error instanceof RequestError) return error.message;
  if (error instanceof AggregateError) return inferErrorMessage(error.errors);
  if (error instanceof Error) return error.message;

  if (typeof error === 'string') return error;

  if (Array.isArray(error)) {
    if (error.length === 0) return '';
    const messages = error.map(inferErrorMessage).filter(Boolean);
    return messages.join('\n');
  }

  if (typeof error === 'object' && error) {
    const errorProp = possibleErrorProps.find((key) => key in error);

    if (errorProp && errorProp in error) return inferErrorMessage(error[errorProp as keyof typeof error]);
  }

  return '';
}
