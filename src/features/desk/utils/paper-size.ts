export const PAPER_SIZE = {
  /** Fraction of viewport width. */
  viewportScale: 0.5,
  /** Pixels. */
  minWidth: 220,
  /** Pixels. */
  maxWidth: 380,
  /** Width-to-height aspect ratio (US Letter). */
  aspectRatio: 8.5 / 11,
} as const;

export function getPaperSize(viewportWidth: number) {
  const width = Math.min(
    Math.max(viewportWidth * PAPER_SIZE.viewportScale, PAPER_SIZE.minWidth),
    PAPER_SIZE.maxWidth
  );

  return {
    width,
    height: width / PAPER_SIZE.aspectRatio,
  };
}
