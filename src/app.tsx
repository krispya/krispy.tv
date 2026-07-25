import { lazy } from 'react';
import { Router, Route, Switch } from './features/router';
import { LoadingScreen, RouteLoading } from './features/loading';
import { routes } from './routes.js';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const About = lazy(() =>
  import('./features/about/about.js').then((module) => ({ default: module.About }))
);

const Desk = lazy(() =>
  import('./features/desk/desk.js').then((module) => ({ default: module.Desk }))
);

const ArticleRoute = lazy(() =>
  import('./features/article/article-route.js').then((module) => ({
    default: module.ArticleRoute,
  }))
);

const SketchRoute = lazy(() =>
  import('./features/sketch/sketch-route.js').then((module) => ({
    default: module.SketchRoute,
  }))
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
          <Route path={routes.desk.path} cache fallback={null}>
            <Desk />
            <LoadingScreen />
          </Route>

          <Route path={routes.about.path} fallback={<RouteLoading />}>
            <About />
          </Route>

          <Route path={routes.article.path} fallback={<RouteLoading />}>
            {({ slug }) => <ArticleRoute slug={slug} />}
          </Route>

          <Route path={routes.sketch.path} fallback={<RouteLoading />}>
            {({ id }) => <SketchRoute id={id} />}
          </Route>

          <Route fallback={<RouteLoading />}>
            <ArticleNotFound />
          </Route>
        </Switch>
      </main>
    </Router>
  );
}
