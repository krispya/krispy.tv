export type SeededLayoutConfig = {
  id: string;
  centered?: boolean;
  viewportWidth: number;
  viewportHeight: number;
  itemWidth: number;
  itemHeight: number;
};

export type SeededLayout = {
  x: number;
  y: number;
  rotation: number;
};

export function createSeededLayout(config: SeededLayoutConfig): SeededLayout {
  const seed = hashString(`${config.id}:desk-scatter`);
  const randomRotation = seededRandom(seed + 31);

  if (config.centered) {
    return {
      x: config.viewportWidth / 2,
      y: config.viewportHeight / 2,
      rotation: (randomRotation - 0.5) * 6,
    };
  }

  const randomX = seededRandom(seed);
  const randomY = seededRandom(seed + 17);
  const insetX = Math.min(config.itemWidth * 0.55, config.viewportWidth * 0.28);
  const insetY = Math.min(config.itemHeight * 0.55, config.viewportHeight * 0.26);

  return {
    x: randomInRange(insetX, config.viewportWidth - insetX, randomX),
    y: randomInRange(insetY, config.viewportHeight - insetY, randomY),
    rotation: (randomRotation - 0.5) * 38,
  };
}

function randomInRange(min: number, max: number, random: number) {
  if (max <= min) return (min + max) / 2;

  return min + (max - min) * random;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed: number) {
  let value = seed + 0x6d2b79f5;

  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}
