import type { Entity } from 'koota';
import { useHas, useQuery, useTarget, useTrait, useTraitEffect } from 'koota/react';
import { lazy, Suspense, useRef, type ReactNode, type Ref } from 'react';
import { Link, useLocation } from 'wouter';
import { routes } from '../../../routes.js';
import { ArticleOf, IsPreloading, Paper, Position } from '../traits/index.js';
import { useDismissibleSheet } from '../utils/use-dismissible-sheet.js';

const Article = lazy(() =>
  import('../../article/article.js').then((module) => ({ default: module.Article }))
);

export function ArticleRenderer() {
  const entities = useQuery(ArticleOf('*'));
  return entities.map((entity) => <ArticleView key={entity.id()} entity={entity} />);
}

function ArticleView({ entity }: { entity: Entity }) {
  const backdropRef = useRef<HTMLAnchorElement>(null);
  const articleRef = useRef<HTMLDivElement>(null);

  const [, navigate] = useLocation();
  const onDismiss = () => navigate(routes.home.href());
  const { sheetRef, handleRef, scrollRef } = useDismissibleSheet({ onDismiss, wheelDismiss: false });

  useTraitEffect(entity, Position, (pos) => {
    if (!pos) return;
    if (backdropRef.current) {
      backdropRef.current.style.opacity = String(1 - pos.y);
    }
    if (articleRef.current) {
      articleRef.current.style.transform = `translateY(${pos.y * 100}%)`;
    }
  });

  const paper = useTarget(entity, ArticleOf);
  const slug = useTrait(paper, Paper)?.id;
  const preloading = useHas(entity, IsPreloading);

  if (!slug) return null;

  return (
    <div
      className="fixed inset-0 z-2000"
      style={{
        pointerEvents: preloading ? 'none' : undefined,
        visibility: preloading ? 'hidden' : undefined,
      }}
      aria-hidden={preloading ? true : undefined}
    >
      <Link
        ref={backdropRef}
        href={routes.home.href()}
        className="absolute inset-0 bg-black/30"
        style={{ opacity: 0, willChange: 'opacity' }}
        aria-label="Close"
      />

      <div
        ref={articleRef}
        className="article-sheet-viewport pointer-events-none absolute inset-x-0 top-0 mx-auto flex max-w-7xl items-end justify-center"
        style={{ transform: 'translateY(100%)', willChange: 'transform' }}
      >
        <div
          ref={sheetRef}
          className="article-sheet bg-surface pointer-events-auto relative mt-4 flex w-full flex-col rounded-t-lg border-stone-200 sm:mt-6 sm:mr-6 sm:ml-6 sm:border sm:border-b-0"
        >
          <CloseButton />
          <DragHandle ref={handleRef} />
          <Suspense fallback={null}>
            <ArticleSheetScroll ref={scrollRef}>
              <Article slug={slug} />
            </ArticleSheetScroll>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

type DivRef = Ref<HTMLDivElement>;

function ArticleSheetScroll({ children, ref }: { children: ReactNode; ref?: DivRef }) {
  return (
    <div
      ref={ref}
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
    >
      {children}
    </div>
  );
}

function DragHandle({ ref }: { ref?: DivRef }) {
  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute top-2 left-1/2 z-30 flex h-10 w-28 -translate-x-1/2 cursor-grab touch-none items-start justify-center pt-2 sm:hidden"
    >
      <div className="h-1 w-10 rounded-full bg-stone-300" />
    </div>
  );
}

function CloseButton() {
  return (
    <Link
      href={routes.home.href()}
      className="pointer-events-auto absolute top-4 right-4 z-2001 hidden h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg backdrop-blur hover:bg-white hover:text-gray-950 sm:flex"
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
  );
}
