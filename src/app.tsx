import { lazy, Suspense } from 'react';
import { Route, Router, Switch } from 'wouter';
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
        <Suspense fallback={<RoutePending />}>
          <Switch>
            <Route path={routes.home.path} component={Desk} />
            <Route path={routes.about.path} component={About} />
            <Route path={routes.article.path}>{(params) => <Article slug={params.slug} />}</Route>
            <Route component={ArticleNotFound} />
          </Switch>
        </Suspense>
      </main>
    </Router>
  );
}

function RoutePending() {
  return <p className="px-4 py-16 text-sm text-gray-500">Loading...</p>;
}
