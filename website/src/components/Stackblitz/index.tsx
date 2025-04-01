import BrowserOnly from '@docusaurus/BrowserOnly';
import StackBlitzSDK, { EmbedOptions } from '@stackblitz/sdk';
import { useCallback } from 'react';
import React from 'react';

interface Props {
  embedId?: string;
  exampleId?: string;
}

const cache: Record<string, HTMLDivElement> = {};

let elRoot: HTMLDivElement | null = null;

function getRootElement() {
  const elRoot = document.createElement('div');
  elRoot.style.visibility = 'hidden';
  elRoot.style.pointerEvents = 'none';
  elRoot.style.width = '0px';
  elRoot.style.height = '0px';
  elRoot.style.position = 'absolute';

  document.body.appendChild(elRoot);
  return elRoot;
}

function getStackblitzEl(projectId: string, exampleId?: string) {
  const existing = cache[projectId];
  if (existing) return existing;

  elRoot = elRoot || getRootElement();

  const elParent = document.createElement('div');
  elParent.style.display = 'contents';
  elRoot.appendChild(elParent);

  const el = document.createElement('div');
  elParent.appendChild(el);

  const opts: EmbedOptions = {
    forceEmbedLayout: true,
    view: 'default',
    height: '100%',
    openFile: exampleId ? `src/examples/${exampleId}/example.tsx` : undefined,
  };

  const isGithub = projectId.startsWith('KurtGokhan');

  const embedFn = isGithub ? StackBlitzSDK.embedGithubProject : StackBlitzSDK.embedProjectId;
  const embedPromise = embedFn(el, projectId, opts);

  embedPromise.then(
    async (p) => {
      // Set URL fails, probably because the preview is not loaded yet
      // so we need to poll until it is loaded
      const interval = setInterval(async () => {
        try {
          await p.preview.setUrl(`/${exampleId || ''}`);
          clearInterval(interval);
        } catch (e) {}
      }, 300);
    },
    (e) => {
      console.error('Error embedding Stackblitz project', e);
    },
  );

  cache[projectId] = elParent;
  return elParent;
}

export function Stackblitz(props: Props) {
  return <BrowserOnly>{() => <StackblitzCore {...props} />}</BrowserOnly>;
}

function StackblitzCore({ embedId = 'KurtGokhan/tanstack-query-builder/tree/main/examples/vite', exampleId = 'main' }: Props) {
  const el = getStackblitzEl(embedId, exampleId);

  const ref = useCallback((node) => node?.appendChild(el), [el]);

  return <div ref={ref} key={embedId} style={{ height: 600 }} />;
}
