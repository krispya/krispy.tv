export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function clamp01(value: number) {
  return clamp(value, 0, 1);
}

export function dampedLerp(current: number, target: number, damping: number, delta: number) {
  const alpha = 1 - Math.pow(1 - damping, delta * 60);

  return current + (target - current) * alpha;
}

export function getViewportRange(size: number, viewportSize: number, wallGutter: number) {
  const halfSize = size / 2;
  const min = halfSize - wallGutter;
  const max = viewportSize - halfSize + wallGutter;

  if (min <= max) return { min, max };

  const midpoint = viewportSize / 2;
  return { min: midpoint, max: midpoint };
}

export function randomInRange(min: number, max: number) {
  if (max <= min) return (min + max) / 2;

  return min + (max - min) * Math.random();
}
