import { createMemoryHistory } from '@tanstack/react-router';
import { queryClient } from 'src/client';
import { AppRouter } from 'src/router';
import { baseUrl } from 'tanstack-query-builder-example-mocks';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import '../src/index.css';
import 'src/examples/main/example';

const history = createMemoryHistory({ initialEntries: ['/main-example'] });
const TestRenderer = () => <AppRouter history={history} />;

beforeEach(async () => {
  await fetch(`${baseUrl}/reset`, { method: 'POST' });
  queryClient.clear();
});

test('Renders the app', async () => {
  const { getByText } = render(<TestRenderer />);
  await expect.element(getByText('Reload')).toBeInTheDocument();
});

test('Loads articles', async () => {
  const { getByText } = render(<TestRenderer />);
  await expect.element(getByText('Loading...')).toBeInTheDocument();
  await expect.element(getByText('0 - Exploring the Future of AI')).toBeInTheDocument();
});

test('Loads next page when clicked', async () => {
  const { getByText } = render(<TestRenderer />);
  const loadBtn = getByText('Load next page');
  await expect.element(loadBtn).toBeInTheDocument();

  await loadBtn.click();
  await expect.element(getByText('6 - How to Start a Successful Blog')).toBeInTheDocument();
  await expect.element(getByText('10 - A Guide to Sustainable Living')).not.toBeInTheDocument();

  await loadBtn.click();
  await expect.element(getByText('10 - A Guide to Sustainable Living')).toBeInTheDocument();

  await loadBtn.click();
  await expect.element(getByText('Load next page')).not.toBeInTheDocument();
});

test('Deletes articles immediately on clicking delete button', async () => {
  const { getByText } = render(<TestRenderer />);

  const el = getByText('1 - 10 Tips for Better Time Management');

  await expect.element(el).toBeInTheDocument();
  await getByText('Delete').nth(1).click();

  await expect.element(el).not.toBeInTheDocument();
});

test('Deletes the article but reverts the deletion after server fails', async () => {
  const { getByText } = render(<TestRenderer />);

  const el = getByText('0 - Exploring the Future of AI');

  await expect.element(el).toBeInTheDocument();
  await getByText('Delete').nth(0).click();

  await expect.element(el).not.toBeInTheDocument();

  await expect.element(el, { timeout: 4000 }).toBeInTheDocument();
  await expect.element(getByText('Error deleting article')).toBeInTheDocument();
});

test('Articles deleted in other tabs are synced', async () => {
  const { getByText } = render(<TestRenderer />);

  const el = getByText('1 - 10 Tips for Better Time Management');

  await expect.element(el).toBeInTheDocument();

  // Simulate delete in another tab and send sync message
  await fetch(`${baseUrl}/articles/1`, { method: 'DELETE' });
  new BroadcastChannel('tanstack-query-builder-tags').postMessage({ type: 'invalidate', data: [{ type: 'articles' }] });

  await expect.element(el).not.toBeInTheDocument();
});
