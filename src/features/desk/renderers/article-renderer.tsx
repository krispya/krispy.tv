import type { Entity } from 'koota';
import { useQuery, useTrait } from 'koota/react';
import { lazy, Suspense } from 'react';
import { IsOffScreen, IsOpen, Paper } from '../traits/index.js';

const Article = lazy(() =>
  import('../../article/article.js').then((module) => ({ default: module.Article }))
);

export function ArticleRenderer() {
  const entities = useQuery(IsOpen, IsOffScreen, Paper);
  return entities.map((entity) => <ArticleView key={entity.id()} entity={entity} />);
}

function ArticleView({ entity }: { entity: Entity }) {
  const paper = useTrait(entity, Paper);

  if (!paper) return null;

  return (
    <Suspense fallback={null}>
      <Article slug={paper.id} />
    </Suspense>
  );
}
