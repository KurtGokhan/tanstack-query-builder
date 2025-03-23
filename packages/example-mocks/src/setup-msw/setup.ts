import { setupWorker } from 'msw/browser';

import type { RequestHandler } from 'msw';

export function setupMSW(...handlers: Array<RequestHandler>) {
  return setupWorker(...handlers);
}
