import BrowserOnly from '@docusaurus/BrowserOnly';
import StackBlitzSDK, { EmbedOptions } from '@stackblitz/sdk';
import { useCallback } from 'react';
import React from 'react';

interface Props {
  embedId: 'string';
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

function getStackblitzEl(projectId: string) {
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
    view: 'preview',
    height: '100%',
    openFile: 'src/App.tsx',
  };

  const isGithub = projectId.startsWith('KurtGokhan');
  if (isGithub) StackBlitzSDK.embedGithubProject(el, projectId, opts);
  else StackBlitzSDK.embedProjectId(el, projectId, opts);

  cache[projectId] = elParent;
  return elParent;
}

export function Stackblitz(props: Props) {
  return <BrowserOnly>{() => <StackblitzCore {...props} />}</BrowserOnly>;
}

function StackblitzCore({ embedId }: Props) {
  const el = getStackblitzEl(embedId);

  const ref = useCallback((node) => node?.appendChild(el), [el]);

  return <div ref={ref} key={embedId} style={{ height: 600 }} />;
}
