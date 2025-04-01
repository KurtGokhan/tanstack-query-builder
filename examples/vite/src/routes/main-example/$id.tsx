import { createFileRoute } from '@tanstack/react-router';
import { ArticlePage } from 'src/examples/main/article';

export const Route = createFileRoute('/main-example/$id')({
  component: ArticlePage,
});
