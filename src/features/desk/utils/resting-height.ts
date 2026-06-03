import type { Entity } from 'koota';
import { KinematicBody } from '../traits/index.js';

export function getBookDepthMeters(book: {
  coverThickness: number;
  pageCount: number;
  pageThickness: number;
}) {
  return book.coverThickness * 2 + book.pageCount * book.pageThickness;
}

export function getRestingHeight(entity: Entity) {
  return (entity.get(KinematicBody)?.depth ?? 0) / 2;
}
