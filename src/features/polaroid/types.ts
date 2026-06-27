export type PolaroidCaptionFrontmatter =
  | string
  | {
      text?: string;
      image?: string;
      alt?: string;
    };

export type PolaroidCaption =
  | {
      kind: 'text';
      text: string;
    }
  | {
      kind: 'image';
      imageSrc: string;
      alt: string;
    };

export type PolaroidFrontmatter = {
  image: string;
  caption?: PolaroidCaptionFrontmatter;
  order?: number;
  hasBody?: boolean;
};

export type Polaroid = Omit<PolaroidFrontmatter, 'caption'> & {
  slug: string;
  imageSrc: string;
  caption?: PolaroidCaption;
  hasBody: boolean;
  loadComponent: () => Promise<unknown>;
};
