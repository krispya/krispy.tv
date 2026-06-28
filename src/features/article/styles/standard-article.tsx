import type { ReactNode } from 'react';
import author from '@content/author.json';
import { formatArticleDate } from '../utils/format-article-date.js';
import type { Article as ArticleRecord } from '../types.js';

export function StandardArticle({
  article,
  children,
}: {
  article: ArticleRecord;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 pt-8 pb-24 sm:px-10 sm:pt-12 sm:pb-16">
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
      <div className="prose prose-lg prose-gray prose-p:first-of-type:first-letter:float-left prose-p:first-of-type:first-letter:mr-3 prose-p:first-of-type:first-letter:text-7xl prose-p:first-of-type:first-letter:mt-[-0.05em] prose-p:first-of-type:first-letter:font-black prose-p:whitespace-pre-line prose-headings:font-serif prose-headings:font-black prose-headings:uppercase mt-10 max-w-none font-sans leading-relaxed tracking-wide">
        {children}
      </div>
    </article>
  );
}
