import { lazy, Suspense } from 'react';
import { Router, useRoute } from 'wouter';
import { routes } from './routes.js';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const Desk = lazy(() =>
  import('./features/desk/desk.js').then((module) => ({ default: module.Desk }))
);

const About = lazy(() =>
  import('./features/about/about.js').then((module) => ({ default: module.About }))
);

const Article = lazy(() =>
  import('./features/article/article.js').then((module) => ({ default: module.Article }))
);

const ArticleNotFound = lazy(() =>
  import('./features/article/article.js').then((module) => ({
    default: module.ArticleNotFound,
  }))
);

export function App() {
  return (
    <Router base={base}>
      <main className="min-h-screen">
        <AppRoutes />
      </main>
    </Router>
  );
}

function AppRoutes() {
  const [isHome] = useRoute(routes.home.path);
  const [isArticle, articleParams] = useRoute(routes.article.path);
  const [isAbout] = useRoute(routes.about.path);

  if (isAbout) {
    return (
      <Suspense fallback={<RoutePending />}>
        <About />
      </Suspense>
    );
  }

  if (isHome || isArticle) {
    return (
      <>
        <Suspense fallback={<RoutePending />}>
          <Desk />
        </Suspense>
        {isArticle && articleParams?.slug && (
          <Suspense fallback={null}>
            <Article slug={articleParams.slug} />
          </Suspense>
        )}
      </>
    );
  }

  return <ArticleNotFound />;
}

function RoutePending() {
  return <p className="px-4 py-16 text-sm text-gray-500">Loading...</p>;
}
