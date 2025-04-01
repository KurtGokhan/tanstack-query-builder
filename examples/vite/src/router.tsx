import { RouterProvider, createRouter } from '@tanstack/react-router';
import { ComponentProps } from 'react';
import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

type Props = Partial<ComponentProps<typeof RouterProvider>>;
export const AppRouter = (props: Props) => <RouterProvider router={router} {...props} />;
