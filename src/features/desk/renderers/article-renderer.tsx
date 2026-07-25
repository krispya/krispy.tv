import type { Entity } from 'koota';
import { useHas, useQuery, useTarget, useTrait, useTraitEffect, useWorld } from 'koota/react';
import { lazy, Suspense, useRef, type ReactNode, type Ref } from 'react';
import { ArticleControls } from '../../article/article-controls.js';
import { ActiveSlug, ArticleMotion, ArticleOf, IsPreloading, Paper } from '../traits/index.js';
import { useDismissibleSheet } from '../utils/use-dismissible-sheet.js';

const Article = lazy(() =>
  import('../../article/article.js').then((module) => ({ default: module.Article }))
);

export function ArticleRenderer() {
  const entities = useQuery(ArticleOf('*'));
  return entities.map((entity) => <ArticleView key={entity.id()} entity={entity} />);
}

function ArticleView({ entity }: { entity: Entity }) {
  const backdropRef = useRef<HTMLButtonElement>(null);
  const articleRef = useRef<HTMLDivElement>(null);
  const world = useWorld();

  const onDismiss = () => world.set(ActiveSlug, { slug: '' });
  const { sheetRef, handleRef, scrollRef } = useDismissibleSheet({ onDismiss, wheelDismiss: false });

  useTraitEffect(entity, ArticleMotion, (motion) => {
    if (!motion) return;
    if (backdropRef.current) {
      backdropRef.current.style.opacity = String(1 - motion.progress);
    }
    if (articleRef.current) {
      articleRef.current.style.transform = `translateY(${motion.progress * 100}%)`;
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
      <button
        type="button"
        ref={backdropRef}
        className="absolute inset-0 bg-black/30"
        style={{ opacity: 0, willChange: 'opacity' }}
        aria-label="Close"
        onClick={onDismiss}
      />

      <div
        ref={articleRef}
        className="article-sheet-viewport pointer-events-none absolute inset-x-0 top-0 mx-auto flex items-end justify-center"
        style={{ transform: 'translateY(100%)', willChange: 'transform' }}
      >
        <div
          ref={sheetRef}
          className="article-sheet bg-article-paper pointer-events-auto relative mt-4 flex w-full max-w-3xl flex-col rounded-t-lg border-stone-200 sm:mt-6 sm:mr-6 sm:ml-6 sm:border sm:border-b-0"
        >
          <ArticleControls onClose={onDismiss} slug={slug} />
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
