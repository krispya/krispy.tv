export const PAPER_TRANSFORM_PERSPECTIVE = 1200;

export function getProjectedSize(size: number, z: number) {
  return size * (PAPER_TRANSFORM_PERSPECTIVE / (PAPER_TRANSFORM_PERSPECTIVE - z));
}
