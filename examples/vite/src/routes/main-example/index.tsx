import { createFileRoute } from '@tanstack/react-router';
import { MainExample } from 'src/examples/main/list';

export const Route = createFileRoute('/main-example/')({
  component: MainExample,
});
