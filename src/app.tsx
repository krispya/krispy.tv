import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { routes } from './routes.js';

const DeskRoot = lazy(() =>
  import('./features/desk/desk.js').then((module) => ({ default: module.Desk }))
);

const AboutPage = lazy(() =>
  import('./features/about/about.js').then((module) => ({ default: module.About }))
);

const ArticlePage = lazy(() =>
  import('./features/article/article.js').then((module) => ({ default: module.Article }))
);

const ArticleNotFound = lazy(() =>
  import('./features/article/article.js').then((module) => ({
    default: module.ArticleNotFound,
  }))
);

export function App() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<RoutePending />}>
        <Switch>
          <Route path={routes.home.path} component={DeskRoot} />
          <Route path={routes.about.path} component={AboutPage} />
          <Route path={routes.article.path}>{(params) => <ArticlePage slug={params.slug} />}</Route>
          <Route component={ArticleNotFound} />
        </Switch>
      </Suspense>
    </main>
  );
}

function RoutePending() {
  return <p className="px-4 py-16 text-sm text-gray-500">Loading...</p>;
}
