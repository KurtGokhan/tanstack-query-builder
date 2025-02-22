import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BuilderMutationCache } from 'react-query-builder';

const client = new QueryClient({
  mutationCache: new BuilderMutationCache(
    {},
    {
      getQueryClient: (): QueryClient => client,
      syncChannel: new BroadcastChannel('react-query-builder'),
    },
  ),
});

const app = (
  <QueryClientProvider client={client}>
    <App />
  </QueryClientProvider>
);

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(app);
