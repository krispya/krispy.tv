import type { Book, BookContent } from './types.js';

const bookModules = import.meta.glob<BookContent>('@content/books/*.json', {
  eager: true,
  import: 'default',
});

function slugFromPath(path: string) {
  const filename = path.split('/').pop();
  if (!filename) throw new Error(`Could not parse slug from book path: ${path}`);

  return filename.replace(/\.json$/, '');
}

function toImageSrc(image: string) {
  const path = image.startsWith('/') ? image.slice(1) : image;
  return `${import.meta.env.BASE_URL}${path}`;
}

function toGeneratedCoverImage(image: string) {
  const path = image.startsWith('/') ? image.slice(1) : image;
  const parts = path.split('/');
  const filename = parts.pop();
  if (!filename) throw new Error(`Could not parse cover image path: ${image}`);

  const basename = filename.replace(/\.[^.]+$/, '');
  return [...parts, 'generated', `${basename}.webp`].join('/');
}

export const books: Book[] = Object.entries(bookModules)
  .map(([path, book]) => ({
    ...book,
    slug: slugFromPath(path),
    coverImageSrc: toImageSrc(toGeneratedCoverImage(book.coverImage)),
  }))
  .sort(
    (first, second) =>
      (first.order ?? 0) - (second.order ?? 0) || first.slug.localeCompare(second.slug)
  );

export function getBook(slug: string) {
  return books.find((book) => book.slug === slug);
}
