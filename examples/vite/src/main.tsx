import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './client';

const app = (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(app);
