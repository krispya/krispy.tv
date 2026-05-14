import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { routes } from './routes.js';

const DeskScene = lazy(() =>
  import('./features/desk/desk-scene.js').then((module) => ({ default: module.DeskScene }))
);

const BlogPost = lazy(() =>
  import('./features/blog/blog-post.js').then((module) => ({ default: module.BlogPost }))
);

const BlogPostNotFound = lazy(() =>
  import('./features/blog/blog-post.js').then((module) => ({ default: module.BlogPostNotFound }))
);

export function App() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<RoutePending />}>
        <Switch>
          <Route path={routes.home.path} component={DeskScene} />
          <Route path={routes.blogPost.path}>{(params) => <BlogPost slug={params.slug} />}</Route>
          <Route component={BlogPostNotFound} />
        </Switch>
      </Suspense>
    </main>
  );
}

function RoutePending() {
  return <p className="px-4 py-16 text-sm text-gray-500">Loading...</p>;
}
