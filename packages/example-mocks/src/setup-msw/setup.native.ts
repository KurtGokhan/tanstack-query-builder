import { setupServer } from 'msw/native';

import type { RequestHandler } from 'msw';
import type { SetupWorker } from 'msw/browser';

export function setupMSW(...handlers: Array<RequestHandler>): SetupWorker {
  const server = setupServer(...handlers);

  return {
    async start(options) {
      server.listen({
        onUnhandledRequest: options?.onUnhandledRequest || 'error',
      });
      return undefined;
    },
    stop() {
      server.close();
    },
    use(...handlers) {
      server.use(...handlers);
    },
    listHandlers() {
      return server.listHandlers();
    },
    resetHandlers() {
      server.resetHandlers();
    },
    restoreHandlers() {
      return server.restoreHandlers;
    },
    get events() {
      return server.events;
    },
  };
}
