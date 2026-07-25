export const routes = {
  about: {
    path: '/about',
    href: () => '/about',
  },
  desk: {
    path: '/',
    href: () => '/',
  },
  article: {
    path: '/article/:slug',
    href: ({ slug }: { slug: string }) => `/article/${encodeURIComponent(slug)}`,
  },
  sketch: {
    path: '/sketch/:id',
    href: ({ id }: { id: string }) => `/sketch/${encodeURIComponent(id)}`,
  },
} as const;
