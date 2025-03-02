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
