export function dampedLerp(current: number, target: number, damping: number, delta: number) {
  const alpha = 1 - Math.pow(1 - damping, delta * 60);

  return current + (target - current) * alpha;
}
