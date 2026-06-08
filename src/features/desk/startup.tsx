import { useActions } from 'koota/react';
import { useEffect } from 'react';
import { articles as articlesCatalog } from '../article/index.js';
import { polaroids as polaroidsCatalog } from '../polaroid/index.js';
import { actions } from './actions.js';

const MIN_PAGE_COUNT = 8;

export function Startup() {
  const {
    destroyPapers,
    destroyPolaroids,
    spawnBook,
    spawnDesk,
    spawnHeadphones,
    spawnPaper,
    spawnPolaroid,
    throwOntoDesk: throwPaperOntoDesk,
  } = useActions(actions);

  useEffect(() => {
    const desk = spawnDesk();
    const headphones = spawnHeadphones({ width: 440, rotation: -34 });

    const articles = articlesCatalog.map((article) => ({
      id: article.slug,
      openable: true,
    }));

    const blankCount = Math.max(0, MIN_PAGE_COUNT - articles.length);
    const blanks = Array.from({ length: blankCount }, (_, i) => ({
      id: `blank-page-${i + 1}`,
      openable: false,
    }));

    const items: { id: string; openable: boolean }[] = [...articles, ...blanks];

    items.forEach(({ id, openable }, index) => {
      const centered = index === 0;
      const stackIndex = items.length - index - 1;
      const paper = spawnPaper({ id, openable, stackIndex, centered });

      throwPaperOntoDesk(paper, { centered });
    });

    const book = spawnBook({
      id: 'desk-css-book',
      title: 'Book',
      pageCount: 260,
      stackIndex: items.length,
    });

    throwPaperOntoDesk(book);

    let polaroidStackIndex = items.length + 1;
    for (const polaroid of polaroidsCatalog) {
      const entity = spawnPolaroid({
        id: polaroid.slug,
        imageSrc: polaroid.imageSrc,
        caption: polaroid.caption,
        stackIndex: polaroidStackIndex,
      });

      throwPaperOntoDesk(entity);
      polaroidStackIndex++;
    }

    return () => {
      destroyPapers();
      destroyPolaroids();
      headphones.destroy();
      book.destroy();
      desk.destroy();
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- mount-only initial spawn
  }, []);

  return null;
}
