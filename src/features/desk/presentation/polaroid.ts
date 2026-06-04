export type CelGlossStripe = {
  leftPercent: number;
  widthPercent: number;
};

export type PolaroidGlossPath = {
  d: string;
};

/** Gloss strength at the top of the photo (0–1). */
export const POLAROID_GLOSS_OPACITY_TOP = 0.75;
/** Gloss strength at the bottom of the photo (0–1). */
export const POLAROID_GLOSS_OPACITY_BOTTOM = 0.35;

const GLOSS_OVERSCAN_TOP = 0.18;
const GLOSS_OVERSCAN_HEIGHT = 1.66;
/** Corner position jitter — keep low so bands stay readable. */
const GLOSS_CORNER_WOBBLE_PX = 5;
/** Mid-edge quadratic bow — subtle curve instead of straight segments. */
const GLOSS_EDGE_BOW_PX = 9;

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function seededUnit(seed: number, channel: number) {
  const value = Math.sin(seed * 12.9898 + channel * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function jitter(seed: number, channel: number, amplitude: number) {
  return (seededUnit(seed, channel) - 0.5) * 2 * amplitude;
}

function rotatePoint(x: number, y: number, cx: number, cy: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const dx = x - cx;
  const dy = y - cy;

  return {
    x: cx + dx * cosine - dy * sine,
    y: cy + dx * sine + dy * cosine,
  };
}

type Point = { x: number; y: number };

function buildStripeQuad(
  size: number,
  stripe: CelGlossStripe,
  rotationDeg: number,
  seed: number
): Point[] {
  const center = size / 2;
  const left = (stripe.leftPercent / 100) * size;
  const width = (stripe.widthPercent / 100) * size;
  const top = -GLOSS_OVERSCAN_TOP * size;
  const height = GLOSS_OVERSCAN_HEIGHT * size;

  const corners = [
    { x: left, y: top },
    { x: left + width, y: top },
    { x: left + width, y: top + height },
    { x: left, y: top + height },
  ];

  return corners.map((point, cornerIndex) => {
    const rotated = rotatePoint(point.x, point.y, center, center, rotationDeg);
    return {
      x: rotated.x + jitter(seed, cornerIndex * 2, GLOSS_CORNER_WOBBLE_PX),
      y: rotated.y + jitter(seed, cornerIndex * 2 + 1, GLOSS_CORNER_WOBBLE_PX),
    };
  });
}

function quadToCurvedPath(points: Point[], seed: number) {
  const vertexCount = points.length;
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 0; index < vertexCount; index++) {
    const start = points[index];
    const end = points[(index + 1) % vertexCount];
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const length = Math.hypot(deltaX, deltaY) || 1;
    const bow = jitter(seed, 20 + index, GLOSS_EDGE_BOW_PX);
    const controlX = midX + (-deltaY / length) * bow;
    const controlY = midY + (deltaX / length) * bow;

    path += ` Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  }

  return `${path} Z`;
}

/** Diagonal gloss bands as wobbly quads (seed-stable per polaroid). */
export function getPolaroidCelGlossStripes(id: string): {
  rotationDeg: number;
  stripes: CelGlossStripe[];
} {
  const flip = hashString(id) % 2;

  return {
    rotationDeg: flip ? 30 : 28,
    stripes: [
      { leftPercent: 5, widthPercent: 22 },
      { leftPercent: 32, widthPercent: 3 },
    ],
  };
}

export function getPolaroidGlossGradientId(id: string) {
  return `polaroid-gloss-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

export function getPolaroidGlossPaths(size: number, id: string): PolaroidGlossPath[] {
  const { rotationDeg, stripes } = getPolaroidCelGlossStripes(id);

  return stripes.map((stripe, index) => {
    const seed = hashString(`${id}:gloss:${index}`);
    const quad = buildStripeQuad(size, stripe, rotationDeg, seed);

    return {
      d: quadToCurvedPath(quad, seed),
    };
  });
}
