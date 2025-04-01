import { QueryClient } from '@tanstack/react-query';
import { getMockHandlers } from 'tanstack-query-builder-example-mocks';
import { setupMSW } from 'tanstack-query-builder-example-mocks/setup-msw';

await setupMSW(...getMockHandlers()).start({ onUnhandledRequest: 'bypass', quiet: true, waitUntilReady: true });

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
    mutations: {
      gcTime: 5000,
    },
  },
});
