export type BookDimensions = {
  width: number;
  height: number;
  unit: 'in';
};

export type BookContent = {
  title: string;
  author: string;
  coverImage: string;
  pageCount: number;
  dimensions: BookDimensions;
  order?: number;
};

export type Book = BookContent & {
  slug: string;
  coverImageSrc: string;
};
