import { lazy, Suspense } from 'react';
import { Route, Router, Switch } from 'wouter';
import { DebugProvider } from './features/debug/index.js';
import { LoadingScreen } from './features/loading/index.js';
import { routes } from './routes.js';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const Desk = lazy(() => {
  // Start image fetch + decode in parallel with the main desk chunk.
  void import('./features/desk/utils/preload-assets.js').then((module) => module.preloadDeskAssets());

  return import('./features/desk/desk.js').then((module) => ({ default: module.Desk }));
});

const About = lazy(() =>
  import('./features/about/about.js').then((module) => ({ default: module.About }))
);

const ArticleNotFound = lazy(() =>
  import('./features/article/article.js').then((module) => ({
    default: module.ArticleNotFound,
  }))
);

export function App() {
  const debugEnabled = getDebugEnabled();

  return (
    <DebugProvider enabled={debugEnabled}>
      <Router base={base}>
        <main className="min-h-screen">
          <Switch>
            <Route path={routes.about.path}>
              <Suspense fallback={<RoutePending />}>
                <About />
              </Suspense>
            </Route>

            <Route path={routes.deskGroup.path}>
              {/* The loading screen covers the whole waterfall: chunk load, asset
                  decode (Desk suspends) and GPU warmup. No fallback handoff. */}
              <Suspense fallback={null}>
                <Desk />
              </Suspense>
              <LoadingScreen />
            </Route>

            <Route>
              <Suspense fallback={<RoutePending />}>
                <ArticleNotFound />
              </Suspense>
            </Route>
          </Switch>
        </main>
      </Router>
    </DebugProvider>
  );
}

function getDebugEnabled() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  if (!params.has('debug')) return false;

  const value = params.get('debug')?.toLowerCase() ?? '';
  return value === '' || !['0', 'false', 'off'].includes(value);
}

function RoutePending() {
  return <p className="px-4 py-16 text-sm text-gray-500">Loading...</p>;
}
