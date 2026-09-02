export type BookDimensions = {
  width: number;
  height: number;
  unit: 'in';
};

export type BookStickyNote = {
  /** Words on the note. Read out as the accessible label, and rendered when there is no `image`. */
  text?: string;
  /** Handwritten note art, a transparent mask tinted with the ink color. Public path. */
  image?: string;
  color?: string;
  rotation?: number;
};

/** A folded sheet tucked between the pages, peeking past the fore-edge. */
export type BookFoldedPaper = {
  color?: string;
  /** 0 = just under the front cover, 1 = just above the back cover. */
  pageFraction?: number;
  /** Pixels the sheet pokes out past the fore-edge. */
  overhang?: number;
  /** Degrees. */
  rotation?: number;
  /** Paragraphs written on the unfolded sheet. */
  text?: string[];
};

export type BookCoverImages = {
  front: string;
  back?: string;
  spine?: string;
};

export type BookContent = {
  title: string;
  author: string;
  coverImages: BookCoverImages;
  color?: string;
  pageCount: number;
  dimensions: BookDimensions;
  stickyNote?: BookStickyNote;
  foldedPaper?: BookFoldedPaper;
  order?: number;
};

export type Book = BookContent & {
  slug: string;
  coverImageSrc: string;
  backCoverImageSrc?: string;
  spineImageSrc?: string;
  stickyNoteImageSrc?: string;
};
