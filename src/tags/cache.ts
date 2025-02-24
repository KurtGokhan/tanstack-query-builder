import { MutationCache, QueryClient } from '@tanstack/react-query';
import { operateOnTags } from './operateOnTags';
import type { QueryTagObject } from './types';

type BuilderMutationCacheOptions = {
  getQueryClient: () => QueryClient;
  syncChannel?: BroadcastChannel;
};

export class BuilderMutationCache extends MutationCache {
  syncChannel?: BroadcastChannel;
  tagsCache: { hash: string; tag: QueryTagObject }[] = [];

  constructor(config: MutationCache['config'], { getQueryClient, syncChannel }: BuilderMutationCacheOptions) {
    super(config);

    this.syncChannel = syncChannel;

    syncChannel?.addEventListener('message', (event) => {
      const { type, data } = event.data;
      if (type === 'invalidate') {
        const queryClient = getQueryClient();
        operateOnTags({ queryClient, tags: data });
      }
    });
  }
}
