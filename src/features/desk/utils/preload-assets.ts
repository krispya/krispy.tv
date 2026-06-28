import { books } from '../../book/index.js';
import { polaroids } from '../../polaroid/index.js';
import { getStickyNoteLineSrc, STICKY_NOTE_LINE_COUNT } from '../presentation/sticky-note-lines.js';
import { decodeImage } from './warmup.js';

let cache: Promise<void> | undefined;

function isImageSrc(src: string | undefined): src is string {
  return Boolean(src);
}

/**
 * Fetches and decodes every desk image. Module-level promise cache so React's
 * `use()` receives a stable promise identity across renders, and repeat desk
 * visits resolve instantly.
 */
export function preloadDeskAssets(): Promise<void> {
  const stickyNoteLineImages = Array.from({ length: STICKY_NOTE_LINE_COUNT }, (_, index) =>
    getStickyNoteLineSrc(index + 1)
  );

  cache ??= Promise.allSettled(
    [
      ...books.map((book) => book.coverImageSrc),
      ...books.map((book) => book.backCoverImageSrc),
      ...books.map((book) => book.spineImageSrc),
      ...polaroids.map((polaroid) => polaroid.imageSrc),
      ...polaroids.map((polaroid) =>
        polaroid.caption?.kind === 'image' ? polaroid.caption.imageSrc : undefined
      ),
      ...stickyNoteLineImages,
    ]
      .filter(isImageSrc)
      .map(decodeImage)
  ).then(() => undefined);

  return cache;
}
