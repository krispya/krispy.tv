import { createElement, Suspense, use, type ComponentType } from 'react';
import { Link } from 'wouter';
import author from '@content/author.json';
import { getArticle } from './catalog.js';
import { formatArticleDate } from './utils/format-article-date.js';
import type { Article as ArticleType } from './types.js';
import { routes } from '../../routes.js';

const articleComponentPromises = new Map<string, Promise<unknown>>();

export function Article({ slug }: { slug: string }) {
  const article = getArticle(slug);

  if (!article) return <ArticleNotFound />;

  return (
    <div className="fixed inset-0 z-2000 flex items-end justify-center">
      {/* Close button — floats top-right outside the paper */}
      <Link
        href={routes.home.href()}
        className="fixed top-4 right-4 z-2001 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg backdrop-blur hover:bg-white hover:text-gray-950"
        aria-label="Back to desk"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </Link>

      {/* Paper modal — full width with margins, flush to bottom */}
      <article className="relative mt-6 mr-6 ml-6 flex max-h-[calc(100vh-24px)] w-full flex-col overflow-y-auto rounded-t-lg border border-b-0 border-stone-200 bg-[#fffdf7]">
        <div className="mx-auto w-full max-w-3xl px-6 pt-12 pb-16 sm:px-10">
          <header className="mb-10 text-center">
            <h1 className="mb-6 font-serif text-5xl leading-none font-black tracking-tighter text-gray-950 uppercase sm:text-7xl">
              {article.title}
            </h1>
            <p className="mx-auto mb-8 max-w-2xl font-serif text-xl text-gray-700 italic">
              {article.summary}
            </p>
            <div className="flex items-center justify-between border-y-2 border-gray-950 py-3 text-left">
              <time
                className="text-sm font-bold tracking-widest text-gray-900 uppercase"
                dateTime={article.date}
              >
                {formatArticleDate(article.date)}
              </time>
              <span className="text-sm font-bold tracking-widest text-gray-900 uppercase">
                By{' '}
                <a
                  className="text-primary-700 decoration-primary-200 hover:text-primary-800 hover:decoration-primary-400 underline"
                  href={author.site}
                  rel="noreferrer"
                >
                  {author.name}
                </a>
              </span>
            </div>
          </header>
          <div className="prose prose-lg prose-gray prose-p:first-of-type:first-letter:float-left prose-p:first-of-type:first-letter:mr-3 prose-p:first-of-type:first-letter:text-7xl prose-p:first-of-type:first-letter:font-black prose-p:first-of-type:first-letter:mt-[-0.05em] prose-headings:font-serif prose-headings:font-black prose-headings:uppercase mt-10 max-w-none font-sans leading-relaxed tracking-wide">
            <Suspense fallback={<p className="text-sm text-gray-500">Loading article...</p>}>
              <ArticleContent article={article} />
            </Suspense>
          </div>
        </div>
      </article>
    </div>
  );
}

function ArticleContent({ article }: { article: ArticleType }) {
  const Component = use(loadArticleComponent(article)) as ComponentType;

  return createElement(Component);
}

function loadArticleComponent(article: ArticleType) {
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
