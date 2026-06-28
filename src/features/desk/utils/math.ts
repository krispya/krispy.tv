export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export type Vector2 = { x: number; y: number };

export function dot(a: Vector2, b: Vector2) {
  return a.x * b.x + a.y * b.y;
}

export function scale(vector: Vector2, scalar: number): Vector2 {
  return { x: vector.x * scalar, y: vector.y * scalar };
}

export function perpendicular(vector: Vector2): Vector2 {
  return { x: -vector.y, y: vector.x };
}

export function clamp01(value: number) {
  return clamp(value, 0, 1);
}

export function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

export function easeOutCubic(value: number) {
  const inverse = 1 - clamp01(value);
  return 1 - inverse * inverse * inverse;
}

export function easeInOutCubic(value: number) {
  const t = clamp01(value);
  if (t < 0.5) return 4 * t * t * t;

  const inverse = -2 * t + 2;
  return 1 - (inverse * inverse * inverse) / 2;
}

export function quadraticBezier(start: number, control: number, end: number, amount: number) {
  const t = clamp01(amount);
  const inverse = 1 - t;

  return inverse * inverse * start + 2 * inverse * t * control + t * t * end;
}

export function stepSpring(
  value: number,
  velocity: number,
  target: number,
  stiffness: number,
  damping: number,
  delta: number
) {
  const acceleration = (target - value) * stiffness - velocity * damping;
  const nextVelocity = velocity + acceleration * delta;

  return {
    value: value + nextVelocity * delta,
    velocity: nextVelocity,
  };
}

export function dampedLerp(current: number, target: number, damping: number, delta: number) {
  const alpha = 1 - Math.pow(1 - damping, delta * 60);

  return current + (target - current) * alpha;
}

export function randomInRange(min: number, max: number) {
  if (max <= min) return (min + max) / 2;

  return min + (max - min) * Math.random();
}
