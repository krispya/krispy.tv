import { books } from '../../book/index.js';
import { polaroids } from '../../polaroid/index.js';
import { decodeImage } from './warmup.js';

let cache: Promise<void> | undefined;

/**
 * Fetches and decodes every desk image. Module-level promise cache so React's
 * `use()` receives a stable promise identity across renders, and repeat desk
 * visits resolve instantly.
 */
export function preloadDeskAssets(): Promise<void> {
  cache ??= Promise.allSettled(
    [...books.map((book) => book.coverImageSrc), ...polaroids.map((polaroid) => polaroid.imageSrc)]
      .filter(Boolean)
      .map(decodeImage)
  ).then(() => undefined);

  return cache;
}
