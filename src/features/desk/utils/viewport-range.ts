export function getViewportRange(size: number, viewportSize: number, wallBuffer: number) {
  const halfSize = size / 2;
  const min = halfSize - wallBuffer;
  const max = viewportSize - halfSize + wallBuffer;

  if (min <= max) return { min, max };

  const midpoint = viewportSize / 2;
  return { min: midpoint, max: midpoint };
}
