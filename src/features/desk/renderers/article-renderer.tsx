import type { Entity } from 'koota';
import { useHas, useQuery, useTarget, useTrait, useTraitEffect } from 'koota/react';
import { lazy, Suspense, useRef } from 'react';
import { Link } from 'wouter';
import { routes } from '../../../routes.js';
import { ArticleOf, IsOpen, IsPreloading, Paper, Position } from '../traits/index.js';

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
  const closing = !useHas(paper, IsOpen);
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
      {!closing && (
        <div
          ref={articleRef}
          className="absolute inset-0 mx-auto max-w-7xl"
          style={{ transform: 'translateY(100%)', willChange: 'transform' }}
        >
          <Suspense fallback={null}>
            <Article slug={slug} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
