import { dot, scale, type Vector2 } from './math.js';

export type OrientedBox = {
  position: Vector2;
  rotation: { z: number };
  box: { width: number; height: number };
};

export type OBBCollision = {
  normal: Vector2;
  overlap: number;
};

export function getOBBCollision(a: OrientedBox, b: OrientedBox): OBBCollision | null {
  const aAxes = getAxes(a.rotation.z);
  const bAxes = getAxes(b.rotation.z);
  const centerDelta = {
    x: a.position.x - b.position.x,
    y: a.position.y - b.position.y,
  };
  let minOverlap = Infinity;
  let minNormal: Vector2 | null = null;

  for (const axis of [aAxes.x, aAxes.y, bAxes.x, bAxes.y]) {
    const aRadius = getProjectedRadius(a, aAxes, axis);
    const bRadius = getProjectedRadius(b, bAxes, axis);
    const distance = dot(centerDelta, axis);
    const overlap = aRadius + bRadius - Math.abs(distance);

    if (overlap <= 0) return null;

    if (overlap < minOverlap) {
      minOverlap = overlap;
      minNormal = distance >= 0 ? axis : scale(axis, -1);
    }
  }

  if (!minNormal) return null;

  return { normal: minNormal, overlap: minOverlap };
}

function getAxes(rotationZ: number): { x: Vector2; y: Vector2 } {
  const radians = (rotationZ * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: { x: cos, y: sin },
    y: { x: -sin, y: cos },
  };
}

function getProjectedRadius(body: OrientedBox, axes: { x: Vector2; y: Vector2 }, axis: Vector2) {
  return (
    (body.box.width / 2) * Math.abs(dot(axes.x, axis)) +
    (body.box.height / 2) * Math.abs(dot(axes.y, axis))
  );
}
