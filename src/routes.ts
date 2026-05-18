export const routes = {
  home: {
    path: '/',
    href: () => '/',
  },
  about: {
    path: '/about',
    href: () => '/about',
  },
  blogPost: {
    path: '/blog/:slug',
    href: ({ slug }: { slug: string }) => `/blog/${encodeURIComponent(slug)}`,
  },
} as const;

export type RouteSnapshot =
  | { name: 'home'; path: string; slug: '' }
  | { name: 'about'; path: string; slug: '' }
  | { name: 'blogPost'; path: string; slug: string }
  | { name: 'notFound'; path: string; slug: '' };

export function parseRoute(path: string): RouteSnapshot {
  if (path === routes.home.path) {
    return { name: 'home', path, slug: '' };
  }

  if (path === routes.about.path) {
    return { name: 'about', path, slug: '' };
  }

  const blogMatch = /^\/blog\/([^/]+)$/.exec(path);

  if (blogMatch) {
    return { name: 'blogPost', path, slug: decodeURIComponent(blogMatch[1]) };
  }

  return { name: 'notFound', path, slug: '' };
}
