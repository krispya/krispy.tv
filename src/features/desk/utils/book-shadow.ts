type Point = { x: number; y: number };

// Light azimuth: screen-space direction from the light toward the cast (down and right).
// Balanced 45° so the cast extrudes evenly toward the right and bottom.
export const SHADOW_LIGHT_DIR: Point = { x: 0.707, y: 0.707 };
// Shadow length per px of height (≈ 1 / tan(elevation)); lower light casts longer shadows.
export const SHADOW_LIGHT_LENGTH = 0.45;
const SHADOW_CORNER_RADIUS = 3;
const SHADOW_PADDING = 64;

/**
 * Side length of the (square, book-centered) shadow element. It must contain the rotated
 * footprint plus its extrusion, since `clip-path` clips to the element box.
 */
export function getBookShadowSize(width: number, height: number, depthPx: number) {
  const cast = depthPx * SHADOW_LIGHT_LENGTH;
  return Math.hypot(width, height) + 2 * cast + SHADOW_PADDING;
}

/**
 * Builds a `clip-path: path(...)` for the book's cast shadow: the rotated footprint swept by
 * the fixed-light cast vector (so the silhouette rotates with the book while the cast direction
 * stays put), with rounded corners. Coordinates are in the centered element's local space.
 */
export function getBookShadowClip(
  width: number,
  height: number,
  depthPx: number,
  rotationZDeg: number,
  size: number
) {
  const theta = (rotationZDeg * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const hw = width / 2;
  const hh = height / 2;

  const corners: Point[] = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((p) => ({ x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos }));

  const vx = SHADOW_LIGHT_DIR.x * depthPx * SHADOW_LIGHT_LENGTH;
  const vy = SHADOW_LIGHT_DIR.y * depthPx * SHADOW_LIGHT_LENGTH;

  const swept = [...corners, ...corners.map((p) => ({ x: p.x + vx, y: p.y + vy }))];
  const half = size / 2;
  const hull = convexHull(swept).map((p) => ({ x: p.x + half, y: p.y + half }));

  return `path('${roundedPolygonPath(hull, SHADOW_CORNER_RADIUS)}')`;
}

function convexHull(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

function roundedPolygonPath(points: Point[], radius: number): string {
  const n = points.length;
  if (n < 3) {
    return `${points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${fmt(p.x)} ${fmt(p.y)}`).join(' ')} Z`;
  }

  const pIn: Point[] = [];
  const pOut: Point[] = [];
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const toPrev = unit(curr, prev);
    const toNext = unit(curr, next);
    const r = Math.min(radius, dist(curr, prev) / 2, dist(curr, next) / 2);
    pIn[i] = { x: curr.x + toPrev.x * r, y: curr.y + toPrev.y * r };
    pOut[i] = { x: curr.x + toNext.x * r, y: curr.y + toNext.y * r };
  }

  let d = `M ${fmt(pOut[0].x)} ${fmt(pOut[0].y)}`;
  for (let i = 1; i <= n; i++) {
    const idx = i % n;
    d += ` L ${fmt(pIn[idx].x)} ${fmt(pIn[idx].y)}`;
    d += ` Q ${fmt(points[idx].x)} ${fmt(points[idx].y)} ${fmt(pOut[idx].x)} ${fmt(pOut[idx].y)}`;
  }
  return `${d} Z`;
}

function unit(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function fmt(value: number) {
  return value.toFixed(2);
}
