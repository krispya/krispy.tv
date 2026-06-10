import type { Entity } from 'koota';
import { useActions, useTraitEffect, useWorld } from 'koota/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { articles as articlesCatalog } from '../article/index.js';
import { books as booksCatalog } from '../book/index.js';
import { polaroids as polaroidsCatalog } from '../polaroid/index.js';
import { actions } from './actions.js';
import { loadingControl } from '../loading/index.js';
import { Scene } from './traits/index.js';
import {
  DEFAULT_BOOK_COVER_THICKNESS_INCHES,
  DEFAULT_BOOK_PAGE_THICKNESS_INCHES,
  inchesToDeskMeters,
  inchesToDeskPixels,
} from './utils/dimensions.js';
import { waitForStableFrames } from './utils/warmup.js';

const MIN_PAGE_COUNT = 8;
/** Milliseconds. Lets the loading cover fall most of the way before items toss up. */
const TOSS_DELAY_MS = 220;

type PendingThrow = {
  entity: Entity;
  centered?: boolean;
};

export function Startup() {
  const world = useWorld();
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
  const pendingThrowsRef = useRef<PendingThrow[]>([]);

  // Re-cover the desk before paint so remounts never flash the empty scene.
  useLayoutEffect(() => {
    loadingControl.set('pending');
  }, []);

  useEffect(() => {
    const desk = spawnDesk();
    const pendingThrows: PendingThrow[] = [];

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

      pendingThrows.push({ entity: paper, centered });
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

      pendingThrows.push({ entity: book });
      return book;
    });

    for (const polaroid of polaroidsCatalog) {
      const entity = spawnPolaroid({
        id: polaroid.slug,
        imageSrc: polaroid.imageSrc,
        caption: polaroid.caption,
      });

      pendingThrows.push({ entity });
    }

    const headphones = spawnHeadphones({ width: 500, rotation: -34 });

    pendingThrowsRef.current = pendingThrows;

    // Assets are already decoded (the Desk component suspends on them), so the
    // world starts at `warming`: the mounted scene composites behind the boot
    // screen until the frame rate settles.
    let cancelled = false;

    void waitForStableFrames().then(() => {
      if (cancelled) return;
      world.set(Scene, { phase: 'ready' });
    });

    return () => {
      cancelled = true;
      pendingThrowsRef.current = [];
      destroyPapers();
      destroyPolaroids();
      headphones.destroy();
      books.forEach((book) => book.destroy());
      desk.destroy();
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- mount-only initial spawn
  }, []);

  useTraitEffect(world, Scene, (scene) => {
    if (scene?.phase !== 'ready') return;

    loadingControl.set('ready');

    // The unmount cleanup empties the pending list, so a late timer is a no-op.
    setTimeout(() => {
      for (const { entity, centered } of pendingThrowsRef.current.splice(0)) {
        throwPaperOntoDesk(entity, { centered });
      }
    }, TOSS_DELAY_MS);
  });

  return null;
}
