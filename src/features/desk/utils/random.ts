export function randomInRange(min: number, max: number) {
  if (max <= min) return (min + max) / 2;

  return min + (max - min) * Math.random();
}
