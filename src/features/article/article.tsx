import { createElement, Suspense, use, type ComponentType } from 'react';
import { Link } from 'wouter';
import { getArticle } from './catalog.js';
import { StandardArticle } from './styles/standard-article.js';
import { TypewriterArticle } from './styles/typewriter-article.js';
import type { Article as ArticleRecord } from './types.js';
import { routes } from '../../routes.js';

const articleComponentPromises = new Map<string, Promise<unknown>>();

export function Article({ slug }: { slug: string }) {
  const article = getArticle(slug);

  if (!article) return <ArticleNotFound />;

  const content = (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading article...</p>}>
      <ArticleContent article={article} />
    </Suspense>
  );

  if (article.style === 'typewriter') {
    return <TypewriterArticle article={article}>{content}</TypewriterArticle>;
  }

  return <StandardArticle article={article}>{content}</StandardArticle>;
}

function ArticleContent({ article }: { article: ArticleRecord }) {
  const Component = use(loadArticleComponent(article)) as ComponentType;

  return createElement(Component);
}

function loadArticleComponent(article: ArticleRecord) {
  const cachedPromise = articleComponentPromises.get(article.slug);

  if (cachedPromise) {
    return cachedPromise;
  }

  const promise = article.loadComponent();

  articleComponentPromises.set(article.slug, promise);

  return promise;
}

export function ArticleNotFound() {
  return (
    <section className="mx-auto min-h-screen max-w-3xl px-4 py-20">
      <p className="text-primary-700 mb-3 text-xs font-bold tracking-[0.12em] uppercase">404</p>
      <h1 className="mb-4 text-5xl leading-none font-bold text-gray-950 sm:text-6xl">
        Article not found
      </h1>
      <p className="mb-6 max-w-2xl text-lg text-gray-600">
        This route does not have a matching MDX article.
      </p>
      <Link
        className="text-primary-700 decoration-primary-200 hover:text-primary-800 hover:decoration-primary-400 underline"
        href={routes.home.href()}
      >
        Return to the desk
      </Link>
    </section>
  );
}
