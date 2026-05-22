export const routes = {
  home: {
    path: '/',
    href: () => '/',
  },
  about: {
    path: '/about',
    href: () => '/about',
  },
  article: {
    path: '/article/:slug',
    href: ({ slug }: { slug: string }) => `/article/${encodeURIComponent(slug)}`,
  },
  deskGroup: {
    path: /^\/(?:$|article\/[^/]+$)/,
  },
} as const;

export type RouteSnapshot =
  | { name: 'home'; path: string; slug: '' }
  | { name: 'about'; path: string; slug: '' }
  | { name: 'article'; path: string; slug: string }
  | { name: 'notFound'; path: string; slug: '' };

export function parseRoute(path: string): RouteSnapshot {
  if (path === routes.home.path) {
    return { name: 'home', path, slug: '' };
  }

  if (path === routes.about.path) {
    return { name: 'about', path, slug: '' };
  }

  const articleMatch = /^\/article\/([^/]+)$/.exec(path);

  if (articleMatch) {
    return { name: 'article', path, slug: decodeURIComponent(articleMatch[1]) };
  }

  return { name: 'notFound', path, slug: '' };
}
