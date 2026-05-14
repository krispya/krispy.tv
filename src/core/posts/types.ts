export type PostFrontmatter = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
};

export type Post = PostFrontmatter & {
  slug: string;
  loadComponent: () => Promise<unknown>;
};
