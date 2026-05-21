const BLANK_PAGE_COLORS = [
  '#f0d080', // goldenrod
  '#f0b8b8', // rose
  '#b8c8e8', // cornflower
  '#b8d8b8', // sage
  '#c8b8e8', // lavender
  '#f0c0a8', // salmon
  '#a8d8c8', // mint
];

export function randomBlankColor(exclude: string[]): string {
  const available = BLANK_PAGE_COLORS.filter((c) => !exclude.includes(c));
  const pool = available.length > 0 ? available : BLANK_PAGE_COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
}
