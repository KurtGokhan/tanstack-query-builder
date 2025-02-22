import '@tanstack/react-query';
import type { QueryInvalidatesMetadata, QueryTagsMetadata } from './types';

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: QueryTagsMetadata<any, any, any>;
    mutationMeta: QueryInvalidatesMetadata<any, any, any>;
    defaultError: unknown;
  }
}
