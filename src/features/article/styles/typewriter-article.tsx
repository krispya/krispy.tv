import type { ReactNode } from 'react';
import type { Article as ArticleRecord } from '../types.js';
import { formatTypewriterArticleDate } from '../utils/format-article-date.js';

export function TypewriterArticle({
  article,
  children,
}: {
  article: ArticleRecord;
  children: ReactNode;
}) {
  return (
    <article className="font-typewriter mx-auto w-full max-w-2xl px-5 pt-18 pb-24 sm:px-10 sm:pt-20 sm:pb-16">
      <header className="mt-2">
        <h1 className="text-xl leading-tight font-semibold tracking-normal text-gray-950 sm:text-xl">
          {article.title}
        </h1>
      </header>
      <div className="prose prose-gray prose-headings:font-typewriter prose-headings:font-semibold prose-headings:tracking-normal prose-headings:normal-case prose-p:my-5 prose-p:leading-7 prose-p:text-gray-800 prose-p:whitespace-pre-line prose-code:font-typewriter prose-pre:font-typewriter font-typewriter mt-8 max-w-none text-[15px] leading-7 tracking-normal">
        {children}

        <br />
        <br />
        <time dateTime={article.date}>{formatTypewriterArticleDate(article.date)}</time>
      </div>
    </article>
  );
}
