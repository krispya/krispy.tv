export type PolaroidFrontmatter = {
  image: string;
  caption?: string;
  order?: number;
  hasBody?: boolean;
};

export type Polaroid = PolaroidFrontmatter & {
  slug: string;
  imageSrc: string;
  hasBody: boolean;
  loadComponent: () => Promise<unknown>;
};
