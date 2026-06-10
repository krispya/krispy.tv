import { useActions } from 'koota/react';
import { useEffect } from 'react';
import { articles as articlesCatalog } from '../article/index.js';
import { books as booksCatalog } from '../book/index.js';
import { polaroids as polaroidsCatalog } from '../polaroid/index.js';
import { actions } from './actions.js';
import {
  DEFAULT_BOOK_COVER_THICKNESS_INCHES,
  DEFAULT_BOOK_PAGE_THICKNESS_INCHES,
  inchesToDeskMeters,
  inchesToDeskPixels,
} from './utils/dimensions.js';

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

    const articles = articlesCatalog.map((article) => ({
      id: article.slug,
      openable: true,
    }));

    const blankCount = Math.max(0, MIN_PAGE_COUNT - articles.length);
    const blanks = Array.from({ length: blankCount }, (_, i) => ({
      id: `blank-page-${i + 1}`,
      openable: false,
    }));

    const items: { id: string; openable: boolean }[] = [...blanks, articles[0]];

    items.forEach(({ id, openable }, index) => {
      const centered = index === 0;
      const paper = spawnPaper({ id, openable, centered });

      throwPaperOntoDesk(paper, { centered });
    });

    const books = booksCatalog.map((contentBook) => {
      const book = spawnBook({
        id: contentBook.slug,
        title: contentBook.title,
        author: contentBook.author,
        color: contentBook.color,
        coverImage: contentBook.coverImageSrc,
        width: inchesToDeskPixels(contentBook.dimensions.width),
        height: inchesToDeskPixels(contentBook.dimensions.height),
        pageCount: contentBook.pageCount,
        pageThickness: inchesToDeskMeters(DEFAULT_BOOK_PAGE_THICKNESS_INCHES),
        coverThickness: inchesToDeskMeters(DEFAULT_BOOK_COVER_THICKNESS_INCHES),
        stickyNote: contentBook.stickyNote,
      });

      throwPaperOntoDesk(book);
      return book;
    });

    for (const polaroid of polaroidsCatalog) {
      const entity = spawnPolaroid({
        id: polaroid.slug,
        imageSrc: polaroid.imageSrc,
        caption: polaroid.caption,
      });

      throwPaperOntoDesk(entity);
    }

    const headphones = spawnHeadphones({ width: 500, rotation: -34 });

    return () => {
      destroyPapers();
      destroyPolaroids();
      headphones.destroy();
      books.forEach((book) => book.destroy());
      desk.destroy();
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- mount-only initial spawn
  }, []);

  return null;
}
