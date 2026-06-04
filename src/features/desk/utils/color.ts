export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Shift a hex color's channels. Positive lightens, negative darkens. */
export function shade(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;

  const channels = [0, 2, 4].map((start) => {
    const value = Number.parseInt(clean.slice(start, start + 2), 16);
    return Math.min(255, Math.max(0, value + amount));
  });

  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}
