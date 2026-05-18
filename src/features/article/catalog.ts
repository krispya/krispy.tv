import type { Article, ArticleFrontmatter } from './types.js';

// Modules loaded from the content directory

const articleFrontmatterModules = import.meta.glob<ArticleFrontmatter>('@content/articles/*.mdx', {
  eager: true,
  import: 'frontmatter',
});

const articleComponentModules = import.meta.glob<unknown>('@content/articles/*.mdx', {
  import: 'default',
});

// Load article based on path name

async function loadArticleModule(path: string) {
  const loadComponent = articleComponentModules[path];
  if (!loadComponent) throw new Error(`Could not find MDX component for ${path}.`);

  return loadComponent();
}

// Util for getting the slug from path

function slugFromPath(path: string) {
  const filename = path.split('/').pop();
  if (!filename) throw new Error(`Could not parse slug from article path: ${path}`);

  return filename.replace(/\.mdx$/, '');
}

// Articles catalog and helper for getting a specific article based on slug

export const articles: Article[] = Object.entries(articleFrontmatterModules)
  .map(([path, frontmatter]) => ({
    ...frontmatter,
    slug: slugFromPath(path),
    loadComponent: () => loadArticleModule(path),
  }))
  .sort((first, second) => Date.parse(second.date) - Date.parse(first.date));

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
