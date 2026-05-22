import { useActions } from 'koota/react';
import { useEffect } from 'react';
import { articles as articlesCatalog } from '../article/index.js';
import { actions } from './actions.js';
import { randomBlankColor } from './utils/blank-page-colors.js';

const MIN_PAGE_COUNT = 8;

// Extremely subtle paper tints — barely perceptible individually,
// but enough to distinguish adjacent pages.
const PAPER_TINTS = [
  '#fffdf7', // warm cream (default)
  '#fefcf2', // parchment
  '#fdf8f5', // blush
  '#f8fbf7', // sage mist
  '#f7f9fe', // cool fog
  '#fffaf3', // candle
];

export function Startup() {
  const { destroyPapers, spawnDesk, spawnPaper, throwPaperOntoDesk } = useActions(actions);

  useEffect(() => {
    const desk = spawnDesk();

    const articles = articlesCatalog.map((article, i) => ({
      id: article.slug,
      openable: true,
      color: PAPER_TINTS[i % PAPER_TINTS.length],
    }));

    const blankCount = Math.max(0, MIN_PAGE_COUNT - articles.length);
    const usedColors: string[] = [];
    const blanks = Array.from({ length: blankCount }, (_, i) => {
      const color = randomBlankColor(usedColors);
      usedColors.push(color);
      return { id: `blank-page-${i + 1}`, openable: false, color };
    });

    const items: { id: string; openable: boolean; color?: string }[] = [...articles, ...blanks];

    items.forEach(({ id, openable, color }, index) => {
      const centered = index === 0;
      const stackIndex = items.length - index - 1;
      const paper = spawnPaper({ id, openable, color, stackIndex, centered });

      throwPaperOntoDesk(paper, { centered });
    });

    return () => {
      destroyPapers();
      desk.destroy();
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- mount-only initial spawn
  }, []);

  return null;
}
