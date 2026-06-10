export type BookDimensions = {
  width: number;
  height: number;
  unit: 'in';
};

export type BookStickyNote = {
  text?: string;
  color?: string;
  rotation?: number;
};

export type BookContent = {
  title: string;
  author: string;
  coverImage: string;
  pageCount: number;
  dimensions: BookDimensions;
  stickyNote?: BookStickyNote;
  order?: number;
};

export type Book = BookContent & {
  slug: string;
  coverImageSrc: string;
};
