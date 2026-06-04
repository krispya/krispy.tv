import {
  getPolaroidGlossGradientId,
  getPolaroidGlossPaths,
  POLAROID_GLOSS_OPACITY_BOTTOM,
  POLAROID_GLOSS_OPACITY_TOP,
} from '../presentation/polaroid.js';

export function PolaroidGlossOverlay({ id, size }: { id: string; size: number }) {
  const paths = getPolaroidGlossPaths(size, id);
  const gradientId = getPolaroidGlossGradientId(id);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={POLAROID_GLOSS_OPACITY_TOP} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={POLAROID_GLOSS_OPACITY_BOTTOM} />
        </linearGradient>
      </defs>
      {paths.map((path, index) => (
        <path key={index} d={path.d} fill={`url(#${gradientId})`} />
      ))}
    </svg>
  );
}
