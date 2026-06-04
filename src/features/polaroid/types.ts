export type PolaroidFrontmatter = {
  image: string;
  caption?: string;
  order?: number;
};

export type Polaroid = PolaroidFrontmatter & {
  slug: string;
  imageSrc: string;
};
