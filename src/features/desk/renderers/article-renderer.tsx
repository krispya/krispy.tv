import type { Entity } from 'koota';
import { useHas, useQuery, useTarget, useTrait, useTraitEffect } from 'koota/react';
import { forwardRef, lazy, Suspense, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { routes } from '../../../routes.js';
import { useDragToDismiss } from '../../article/utils/use-drag-to-dismiss.js';
import { ArticleOf, IsPreloading, Paper, Position } from '../traits/index.js';

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
  const { containerRef, handleRef, scrollRef } = useDragToDismiss(onDismiss);

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
        className="pointer-events-none absolute inset-0 mx-auto flex max-w-7xl items-end justify-center"
        style={{ transform: 'translateY(100%)', willChange: 'transform' }}
      >
        <CloseButton />
        <div
          ref={containerRef}
          className="pointer-events-auto relative mt-4 flex h-[calc(100dvh-18px)] w-full flex-col rounded-t-lg border-stone-200 bg-[#fffdf7] sm:mt-6 sm:mr-6 sm:ml-6 sm:h-[calc(100dvh-24px)] sm:border sm:border-b-0"
        >
          <Suspense fallback={null}>
            <Article ref={scrollRef} slug={slug} topSlot={<DragHandle ref={handleRef} />} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

const DragHandle = forwardRef<HTMLDivElement>(function DragHandle(_, ref) {
  return (
    <div
      ref={ref}
      className="flex h-8 shrink-0 cursor-grab touch-none items-start justify-center pt-3 sm:hidden"
    >
      <div className="h-1 w-10 rounded-full bg-stone-300" />
    </div>
  );
});

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
