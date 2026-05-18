import { createWorld } from 'koota';
import { WorldProvider } from 'koota/react';
import { useMemo, type CSSProperties } from 'react';
import { useLocation } from 'wouter';
import { routes } from '../../routes.js';
import { articles as articlesCatalog } from '../article/index.js';
import { Frameloop } from './frameloop.js';
import { getArticleSheetStyle } from './renderers/article-renderer.js';
import { DeskItemRenderer } from './renderers/desk-item-renderer.js';
import { Startup } from './startup.js';
import { Pointer, Time, Viewport } from './traits.js';

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
  // All your data
  const world = createWorld(Time, Pointer, Viewport);
  const [, navigate] = useLocation();

  const articles = articlesCatalog.map((article) => ({
    id: article.slug,
    ariaLabel: `Open ${article.title}`,
    style: getArticleSheetStyle(article),
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

  const handleOpenArticle = (slug: string) => {
    navigate(routes.article.href({ slug }));
  };

  return (
    <WorldProvider world={world}>
      <Frameloop />
      <Startup items={items} />
      <DeskScene items={items} onItemOpen={handleOpenArticle} />
    </WorldProvider>
  );
}

function DeskScene({
  items,
  onItemOpen,
}: {
  items: DeskStageItem[];
  onItemOpen?: (id: string) => void;
}) {
  const itemConfigById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  return (
    <section className="relative h-screen min-h-[560px] overflow-hidden bg-[radial-gradient(circle_at_18%_20%,rgba(244,244,239,0.42),transparent_28%),linear-gradient(135deg,#879080,#b8b2a5_58%,#6f7b75)]">
      <DeskItemRenderer itemConfigById={itemConfigById} onOpen={onItemOpen} />
    </section>
  );
}
