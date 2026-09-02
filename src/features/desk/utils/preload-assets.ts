import { books } from '../../book/index.js';
import { polaroids } from '../../polaroid/index.js';
import { DESK_GEOMETRIC_GRUNGE_IMAGE, getDeskPublicAssetUrl } from '../presentation/background.js';
import { getStickyNoteLineSrc, STICKY_NOTE_LINE_COUNT } from '../presentation/sticky-note-lines.js';
import { decodeImage } from './warmup.js';

let cache: Promise<void> | undefined;

function isImageSrc(src: string | undefined): src is string {
  return Boolean(src);
}

function getDeskImageSources() {
  const stickyNoteLineImages = Array.from({ length: STICKY_NOTE_LINE_COUNT }, (_, index) =>
    getStickyNoteLineSrc(index + 1)
  );

  return [
    ...books.map((book) => book.coverImageSrc),
    ...books.map((book) => book.backCoverImageSrc),
    ...books.map((book) => book.spineImageSrc),
    ...books.map((book) => book.stickyNoteImageSrc),
    ...polaroids.map((polaroid) => polaroid.imageSrc),
    ...polaroids.map((polaroid) =>
      polaroid.caption?.kind === 'image' ? polaroid.caption.imageSrc : undefined
    ),
    getDeskPublicAssetUrl(DESK_GEOMETRIC_GRUNGE_IMAGE),
    ...stickyNoteLineImages,
  ].filter(isImageSrc);
}

async function decodeDeskAssets() {
  await Promise.allSettled(getDeskImageSources().map(decodeImage));
}

/**
 * Fetches and decodes every desk image. Module-level promise cache so React's
 * `use()` receives a stable promise identity across renders, and repeat desk
 * visits resolve instantly.
 */
export function preloadDeskAssets(): Promise<void> {
  cache ??= decodeDeskAssets();

  return cache;
}
