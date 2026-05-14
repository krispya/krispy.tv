import type { CSSProperties } from 'react';
import { formatPostDate, type Post } from '../../core/posts/index.js';

type PaperTheme = {
  backgroundColor: string;
  borderColor: string;
  accentColor: string;
  tagBackgroundColor: string;
  tagColor: string;
};

const defaultTheme: PaperTheme = {
  backgroundColor: '#fffdf7',
  borderColor: '#d8d1c4',
  accentColor: '#78716c',
  tagBackgroundColor: '#f5f5f4',
  tagColor: '#57534e',
};

const tagThemes: Record<string, PaperTheme> = {
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

export function getPostPaperStyle(post: Post): CSSProperties {
  const theme = getPostPaperTheme(post);

  return {
    backgroundColor: theme.backgroundColor,
    borderColor: theme.borderColor,
  };
}

export function PostPaper({ post }: { post: Post }) {
  const theme = getPostPaperTheme(post);
  const primaryTag = getPrimaryTag(post);

  return (
    <article className="flex h-full flex-col">
      <header className="border-b border-stone-200 pb-4">
        <time
          className="mb-2 block text-xs font-medium tracking-[0.12em] text-stone-500 uppercase"
          dateTime={post.date}
        >
          {formatPostDate(post.date)}
        </time>
        <h2 className="text-2xl leading-tight font-bold text-stone-950">{post.title}</h2>
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
            className="h-full w-full bg-[linear-gradient(135deg,transparent_44%,var(--paper-accent)_45%,var(--paper-accent)_55%,transparent_56%)]"
            style={{ '--paper-accent': theme.accentColor } as CSSProperties}
          />
        </div>
        <p className="text-sm leading-6 text-stone-700">{post.summary}</p>
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

function getPostPaperTheme(post: Post) {
  return tagThemes[getPrimaryTag(post)] ?? defaultTheme;
}

function getPrimaryTag(post: Post) {
  return post.tags[0] ?? 'notes';
}
