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

const ArticleNotFound = lazy(() =>
  import('./features/article/article.js').then((module) => ({
    default: module.ArticleNotFound,
  }))
);

export function App() {
  return (
    <Router base={base}>
      <main className="min-h-screen">
        <Switch>
          <Route path={routes.about.path}>
            <Suspense fallback={<RoutePending />}>
              <About />
            </Suspense>
          </Route>

          <Route path={routes.deskGroup.path}>
            <Suspense fallback={<RoutePending />}>
              <Desk />
            </Suspense>
          </Route>

          <Route>
            <Suspense fallback={<RoutePending />}>
              <ArticleNotFound />
            </Suspense>
          </Route>
        </Switch>
      </main>
    </Router>
  );
}

function RoutePending() {
  return <p className="px-4 py-16 text-sm text-gray-500">Loading...</p>;
}
