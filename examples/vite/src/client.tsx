import { QueryClient } from '@tanstack/react-query';
import { BuilderMutationCache } from 'react-query-builder';

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
  mutationCache: new BuilderMutationCache(
    {},
    {
      getQueryClient: (): QueryClient => queryClient,
      syncChannel: new BroadcastChannel('react-query-builder'),
    },
  ),
});
