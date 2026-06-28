export type ArticleStyle = 'standard' | 'typewriter';

export type ArticleFrontmatter = {
  title: string;
  date: string;
  summary: string;
  style?: ArticleStyle;
  tags: string[];
};

export type Article = ArticleFrontmatter & {
  slug: string;
  loadComponent: () => Promise<unknown>;
};
