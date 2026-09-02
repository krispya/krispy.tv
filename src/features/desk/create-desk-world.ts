import { createWorld, type Entity } from 'koota';
import { color } from '../../color.js';
import { articles as articlesCatalog } from '../article/index.js';
import { books as booksCatalog } from '../book/index.js';
import { polaroids as polaroidsCatalog } from '../polaroid/index.js';
import { actions, type DeskThrowTarget } from './actions.js';
import { ActiveSlug, Camera, Pointer, Scene, Time, Viewport } from './traits/index.js';
import { syncViewportToWindow } from './utils/camera.js';
import {
  DEFAULT_BOOK_COVER_THICKNESS_INCHES,
  DEFAULT_BOOK_PAGE_THICKNESS_INCHES,
  inchesToDeskMeters,
  inchesToDeskPixels,
} from './utils/dimensions.js';

export type PendingThrow = {
  entity: Entity;
  centered?: boolean;
  target?: DeskThrowTarget;
};

const POLAROID_THROW_TARGETS: Partial<Record<string, DeskThrowTarget>> = {
  me: 'top-right',
};

/** One book always caroms off the left wall; the rest cluster at the center. */
const BOOK_THROW_TARGETS: Partial<Record<string, DeskThrowTarget>> = {
  bloodchild: 'left-wall',
};

function getPolaroidCaptionConfig(caption: (typeof polaroidsCatalog)[number]['caption']) {
  if (!caption) return {};

  if (caption.kind === 'image') {
    return { captionImageSrc: caption.imageSrc, captionImageAlt: caption.alt };
  }

  return { caption: caption.text };
}

export function createDeskWorld() {
  const world = createWorld(Time, Pointer, Viewport, Camera, ActiveSlug, Scene);
  const { spawnBook, spawnDesk, spawnHeadphones, spawnMousePad, spawnPaper, spawnPolaroid } =
    actions(world);
  const pendingThrows: PendingThrow[] = [];

  // Size the visible desk before spawning so corner-anchored items land against
  // the real viewport edges instead of the default camera's.
  syncViewportToWindow(world);

  spawnDesk();

  const articles = articlesCatalog.map((article) => ({
    id: article.slug,
    openable: true,
    lineColor: article.style === 'typewriter' ? color.line.typewriter : color.line.ink,
  }));

  const blanks = Array.from({ length: 3 }, (_, i) => ({
    id: `blank-page-${i + 1}`,
    openable: false,
    sketchable: true,
    lineColor: color.line.blankPaper,
  }));

  const items: { id: string; openable: boolean; sketchable?: boolean; lineColor?: string }[] = [
    ...blanks,
    articles[0],
  ];

  items.forEach(({ id, openable, sketchable, lineColor }, index) => {
    const centered = index === 0;
    const paper = spawnPaper({ id, openable, sketchable, centered, lineColor });

    // Scatter pages across the whole desk so they don't bunch up on entry.
    pendingThrows.push({ entity: paper, centered, target: 'spread' });
  });

  for (const contentBook of booksCatalog) {
    const book = spawnBook({
      id: contentBook.slug,
      title: contentBook.title,
      author: contentBook.author,
      color: contentBook.color,
      coverImage: contentBook.coverImageSrc,
      backCoverImage: contentBook.backCoverImageSrc,
      spineImage: contentBook.spineImageSrc,
      width: inchesToDeskPixels(contentBook.dimensions.width),
      height: inchesToDeskPixels(contentBook.dimensions.height),
      pageCount: contentBook.pageCount,
      pageThickness: inchesToDeskMeters(DEFAULT_BOOK_PAGE_THICKNESS_INCHES),
      coverThickness: inchesToDeskMeters(DEFAULT_BOOK_COVER_THICKNESS_INCHES),
      stickyNote: contentBook.stickyNote && {
        ...contentBook.stickyNote,
        image: contentBook.stickyNoteImageSrc,
      },
      foldedPaper: contentBook.foldedPaper,
    });

    pendingThrows.push({ entity: book, target: BOOK_THROW_TARGETS[contentBook.slug] ?? 'center' });
  }

  for (const polaroid of polaroidsCatalog) {
    const entity = spawnPolaroid({
      id: polaroid.slug,
      imageSrc: polaroid.imageSrc,
      ...getPolaroidCaptionConfig(polaroid.caption),
    });

    pendingThrows.push({ entity, target: POLAROID_THROW_TARGETS[polaroid.slug] });
  }

  spawnHeadphones({ width: 500, rotation: -34 });
  spawnMousePad({ rotation: 4 });

  return { pendingThrows, world };
}
