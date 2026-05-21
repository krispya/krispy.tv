import { createWorld } from 'koota';
import { WorldProvider } from 'koota/react';
import { type CSSProperties } from 'react';
import { articles as articlesCatalog } from '../article/index.js';
import { Frameloop } from './frameloop.js';
import { DeskRenderer } from './renderers/desk-renderer.js';
import { PaperRenderer } from './renderers/paper-renderer.js';
import { Startup } from './startup.js';
import { Pointer, Time, Viewport } from './traits/index.js';

export type DeskStageItem = {
  id: string;
  ariaLabel?: string;
  className?: string;
  openable?: boolean;
  style?: CSSProperties;
};

const emptySheets = [
  { id: 'empty-page-1', backgroundColor: '#fffdf7', borderColor: '#d8d1c4' },
  { id: 'empty-page-2', backgroundColor: '#f6f0df', borderColor: '#d4c49c' },
  { id: 'empty-page-3', backgroundColor: '#e9f1f5', borderColor: '#b8c8d0' },
];

export function Desk() {
  const world = createWorld(Time, Pointer, Viewport);

  const articles = articlesCatalog.map((article) => ({
    id: article.slug,
    ariaLabel: `Open ${article.title}`,
  }));

  const empty = emptySheets.map((sheet) => ({
    id: sheet.id,
    ariaLabel: 'Blank sheet of paper',
    openable: false,
    style: {
      backgroundColor: sheet.backgroundColor,
      borderColor: sheet.borderColor,
    },
  }));

  const items = [...articles, ...empty];

  return (
    <WorldProvider world={world}>
      <Frameloop />
      <Startup items={items} />

      <DeskRenderer />
      <PaperRenderer />
    </WorldProvider>
  );
}
