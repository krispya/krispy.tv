export type ArticleFrontmatter = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
};

export type Article = ArticleFrontmatter & {
  slug: string;
  loadComponent: () => Promise<unknown>;
};
