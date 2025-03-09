import { baseUrl } from 'react-query-builder-example-mocks';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { App } from '../src/App';

beforeEach(async () => {
  await fetch(`${baseUrl}/reset`, { method: 'POST' });
});

test('Renders the app', async () => {
  const { getByText } = render(<App />);
  await expect.element(getByText('Reload')).toBeInTheDocument();
});

test('Loads posts', async () => {
  const { getByText } = render(<App />);
  await expect.element(getByText('Loading...')).toBeInTheDocument();
  await expect.element(getByText('0 - Exploring the Future of AI')).toBeInTheDocument();
});

test('Loads next page when clicked', async () => {
  const { getByText } = render(<App />);
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

test('Deletes posts immediately on clicking delete button', async () => {
  const { getByText } = render(<App />);

  const el = getByText('1 - 10 Tips for Better Time Management');

  await expect.element(el).toBeInTheDocument();
  await getByText('Delete').nth(1).click();

  await expect.element(el).not.toBeInTheDocument();
});

test('Deletes deletes but reverts the deletion after server fails', async () => {
  const { getByText } = render(<App />);

  const el = getByText('0 - Exploring the Future of AI');

  await expect.element(el).toBeInTheDocument();
  await getByText('Delete').nth(0).click();

  await expect.element(el).not.toBeInTheDocument();

  await expect.element(el, { timeout: 4000 }).toBeInTheDocument();
  await expect.element(getByText('Error deleting post')).toBeInTheDocument();
});

test('Posts deleted in other tabs are synced', async () => {
  const { getByText } = render(<App />);

  const el = getByText('1 - 10 Tips for Better Time Management');

  await expect.element(el).toBeInTheDocument();

  // Simulate delete in another tab and send sync message
  await fetch(`${baseUrl}/posts/1`, { method: 'DELETE' });
  new BroadcastChannel('react-query-builder-tags').postMessage({ type: 'invalidate', data: [{ type: 'posts' }] });

  await expect.element(el).not.toBeInTheDocument();
});
