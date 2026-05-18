import { createElement, Suspense, use, type ComponentType } from 'react';
import { Link } from 'wouter';
import author from '@content/author.json';
import { getArticle } from './catalog.js';
import { formatArticleDate } from './utils/format-article-date.js';
import type { Article } from './types.js';
import { routes } from '../../routes.js';

const articleComponentPromises = new Map<string, Promise<unknown>>();

export function Article({ slug }: { slug: string }) {
  const article = getArticle(slug);

  if (!article) return <ArticleNotFound />;

  return (
    <article className="mx-auto min-h-screen max-w-3xl px-4 py-16 sm:py-20">
      <Link
        className="text-primary-700 decoration-primary-200 hover:text-primary-800 hover:decoration-primary-400 mb-8 inline-flex text-sm font-medium underline"
        href={routes.home.href()}
      >
        Back to desk
      </Link>
      <header className="border-b border-gray-200 pb-8">
        <time className="mb-2 block text-sm text-gray-500" dateTime={article.date}>
          {formatArticleDate(article.date)}
        </time>
        <h1 className="mb-4 text-5xl leading-none font-bold text-gray-950 sm:text-6xl">
          {article.title}
        </h1>
        <p className="max-w-2xl text-lg text-gray-600">{article.summary}</p>
        <p className="mt-4 text-base text-gray-600">
          By{' '}
          <a
            className="text-primary-700 decoration-primary-200 hover:text-primary-800 hover:decoration-primary-400 underline"
            href={author.site}
            rel="noreferrer"
          >
            {author.name}
          </a>
        </p>
      </header>
      <div className="prose prose-gray mt-8 max-w-none">
        <Suspense fallback={<p className="text-sm text-gray-500">Loading article...</p>}>
          <ArticleContent article={article} />
        </Suspense>
      </div>
    </article>
  );
}

function ArticleContent({ article }: { article: Article }) {
  const Component = use(loadArticleComponent(article)) as ComponentType;

  return createElement(Component);
}

function loadArticleComponent(article: Article) {
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
