import { articles } from '../../article/index.js';

export const EMPTY_SHEET_IDS = ['empty-page-1', 'empty-page-2', 'empty-page-3'] as const;

export function getDeskItemZIndex(id: string) {
  const emptyIndex = EMPTY_SHEET_IDS.indexOf(id as (typeof EMPTY_SHEET_IDS)[number]);
  if (emptyIndex >= 0) return emptyIndex;

  const articleIndex = articles.findIndex((article) => article.slug === id);
  if (articleIndex >= 0) {
    return EMPTY_SHEET_IDS.length + (articles.length - 1 - articleIndex);
  }

  return EMPTY_SHEET_IDS.length + articles.length;
}
