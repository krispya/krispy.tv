import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import type { CSSProperties } from 'react';
import { formatArticleDate, getArticle, type Article } from '../../article/index.js';
import { DeskItem } from '../traits.js';

type ArticleTheme = {
  backgroundColor: string;
  borderColor: string;
  accentColor: string;
  tagBackgroundColor: string;
  tagColor: string;
};

const defaultTheme: ArticleTheme = {
  backgroundColor: '#fffdf7',
  borderColor: '#d8d1c4',
  accentColor: '#78716c',
  tagBackgroundColor: '#f5f5f4',
  tagColor: '#57534e',
};

const tagThemes: Record<string, ArticleTheme> = {
  mdx: {
    backgroundColor: '#fff7d6',
    borderColor: '#e8c86a',
    accentColor: '#a16207',
    tagBackgroundColor: '#facc15',
    tagColor: '#422006',
  },
  notes: {
    backgroundColor: '#fef3f2',
    borderColor: '#f4a7a0',
    accentColor: '#b42318',
    tagBackgroundColor: '#fee4e2',
    tagColor: '#912018',
  },
  react: {
    backgroundColor: '#e8f6ff',
    borderColor: '#8ac7e8',
    accentColor: '#0369a1',
    tagBackgroundColor: '#bae6fd',
    tagColor: '#075985',
  },
  routing: {
    backgroundColor: '#eff7ea',
    borderColor: '#a7d28d',
    accentColor: '#3f6212',
    tagBackgroundColor: '#d9f99d',
    tagColor: '#365314',
  },
};

export function getArticleSheetStyle(article: Article): CSSProperties {
  const theme = getArticleTheme(article);

  return {
    backgroundColor: theme.backgroundColor,
    borderColor: theme.borderColor,
  };
}

export function ArticleRenderer({ entity }: { entity: Entity }) {
  const item = useTrait(entity, DeskItem);
  const article = item ? getArticle(item.id) : undefined;

  if (!article) return <BlankSheet />;

  return <ArticleView article={article} />;
}

function ArticleView({ article }: { article: Article }) {
  const theme = getArticleTheme(article);
  const primaryTag = getPrimaryTag(article);

  return (
    <article className="flex h-full flex-col">
      <header className="border-b border-stone-200 pb-4">
        <time
          className="mb-2 block text-xs font-medium tracking-[0.12em] text-stone-500 uppercase"
          dateTime={article.date}
        >
          {formatArticleDate(article.date)}
        </time>
        <h2 className="text-2xl leading-tight font-bold text-stone-950">{article.title}</h2>
        <p
          className="mt-3 inline-flex rounded-sm border px-2 py-1 text-xs font-bold tracking-[0.12em] uppercase"
          style={{
            backgroundColor: theme.tagBackgroundColor,
            borderColor: theme.borderColor,
            color: theme.tagColor,
          }}
        >
          {primaryTag}
        </p>
      </header>

      <div className="mt-5 grid grid-cols-[4.5rem_1fr] gap-4">
        <div
          className="aspect-[4/3] border bg-stone-100 shadow-inner"
          style={{ borderColor: theme.borderColor }}
          aria-hidden="true"
        >
          <div
            className="h-full w-full bg-[linear-gradient(135deg,transparent_44%,var(--article-accent)_45%,var(--article-accent)_55%,transparent_56%)]"
            style={{ '--article-accent': theme.accentColor } as CSSProperties}
          />
        </div>
        <p className="text-sm leading-6 text-stone-700">{article.summary}</p>
      </div>

      <div className="mt-6 flex-1 space-y-3" aria-hidden="true">
        <div className="h-px bg-stone-200" />
        <div className="h-px bg-stone-200" />
        <div className="h-px bg-stone-200" />
        <div className="h-px w-4/5 bg-stone-200" />
      </div>

      <p className="mt-6 border-t border-stone-200 pt-4 text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">
        Double click to read
      </p>
    </article>
  );
}

function BlankSheet() {
  return (
    <div className="flex h-full flex-col opacity-70" aria-hidden="true">
      <div className="h-8 border-b border-stone-300/70" />
      <div className="mt-8 space-y-4">
        <div className="h-px bg-stone-300/70" />
        <div className="h-px bg-stone-300/70" />
        <div className="h-px bg-stone-300/70" />
        <div className="h-px w-3/5 bg-stone-300/70" />
      </div>
      <div className="mt-auto h-20 border border-dashed border-stone-300/70" />
    </div>
  );
}

function getArticleTheme(article: Article) {
  return tagThemes[getPrimaryTag(article)] ?? defaultTheme;
}

function getPrimaryTag(article: Article) {
  return article.tags[0] ?? 'notes';
}
