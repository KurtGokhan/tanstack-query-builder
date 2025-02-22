import { QueryClient } from '@tanstack/react-query';
import { BuilderMutationCache } from 'react-query-builder';

export const queryClient = new QueryClient({
  mutationCache: new BuilderMutationCache(
    {},
    {
      getQueryClient: (): QueryClient => queryClient,
      syncChannel: new BroadcastChannel('react-query-builder'),
    },
  ),
});
