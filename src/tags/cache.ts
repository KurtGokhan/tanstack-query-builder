import { MutationCache, QueryClient } from '@tanstack/react-query';
import { operateOnTags } from './operateOnTags';
import { resolveTags } from './resolveTags';
import type { QueryTagContext } from './types';
import { type UpdateTagsUndoer, undoUpdateTags, updateTags } from './updateTags';

type BuilderMutationCacheOptions = {
  getQueryClient: () => QueryClient;
  syncChannel?: BroadcastChannel;
};

export class BuilderMutationCache extends MutationCache {
  constructor(config: MutationCache['config'], { getQueryClient, syncChannel }: BuilderMutationCacheOptions) {
    // onMutate does not allow returning a context value in global MutationCache.
    // So we store the undos in our own map based on the mutationId.
    // See: https://tanstack.com/query/latest/docs/reference/MutationCache#global-callbacks
    type MutationContext = { undos?: UpdateTagsUndoer[] };

    const mutationContexts = new Map<number, MutationContext>();

    super({
      onMutate: async (...args) => {
        await config?.onMutate?.(...args);

        const [vars, mutation] = args;
        const queryClient = getQueryClient();

        const data = !vars || typeof vars !== 'object' ? undefined : Reflect.get(vars, 'body');
        const updates = resolveTags({ client: queryClient, tags: mutation.meta?.optimisticUpdates, vars, data });
        const ctx: QueryTagContext<unknown> = { client: queryClient, vars, data };
        const undos = updateTags({ queryClient, tags: updates, ctx, optimistic: true });
        if (undos.length) mutationContexts.set(mutation.mutationId, { undos });

        const tags = updates.filter(
          (tag) => typeof tag !== 'object' || ['pre', 'both'].includes(tag.invalidate || 'both'),
        );

        operateOnTags({ queryClient, tags }, { refetchType: 'none' });
      },
      onSuccess: async (...args) => {
        await config?.onSuccess?.(...args);

        const [data, vars, , mutation] = args;
        const queryClient = getQueryClient();

        const updates = resolveTags({ client: queryClient, tags: mutation.meta?.updates, vars, data });
        updateTags({ queryClient, tags: updates, ctx: { client: queryClient, vars, data } });
      },
      onError: async (...args) => {
        await config?.onError?.(...args);

        const [, , , mutation] = args;
        const queryClient = getQueryClient();

        const { undos } = mutationContexts.get(mutation.mutationId) || {};
        if (undos) undoUpdateTags(undos, queryClient);
      },
      onSettled: async (...args): Promise<void> => {
        await config?.onSettled?.(...args);

        const [data, error, vars, , mutation] = args;
        const queryClient = getQueryClient();

        mutationContexts.delete(mutation.mutationId);

        const optUpdates = resolveTags({ client: queryClient, tags: mutation.meta?.optimisticUpdates, vars, data });
        const optUpdateTags = optUpdates.filter((tag) => ['post', 'both'].includes(tag.invalidate || 'both'));
        operateOnTags({ queryClient, tags: optUpdateTags });

        const pesUpdates = resolveTags({ client: queryClient, tags: mutation.meta?.updates, vars, data });
        const pesUpdateTags = pesUpdates.filter((tag) => ['post', 'both'].includes(tag.invalidate || 'both'));
        operateOnTags({ queryClient, tags: pesUpdateTags });

        const tags = resolveTags({ client: queryClient, tags: mutation.meta?.invalidates, vars, data, error });

        if (syncChannel) {
          const tagsToSync = [...tags, ...optUpdateTags, ...pesUpdateTags].map(({ type, id }) => ({ type, id }));
          syncChannel.postMessage({ type: 'invalidate', data: tagsToSync });
        }

        return operateOnTags({ queryClient, tags });
      },
    });

    syncChannel?.addEventListener('message', (event) => {
      const { type, data } = event.data;
      if (type === 'invalidate') {
        const queryClient = getQueryClient();
        operateOnTags({ queryClient, tags: data });
      }
    });
  }
}
