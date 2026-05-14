export type SeededLayoutConfig = {
  id: string;
  index: number;
  total: number;
  viewportWidth: number;
  viewportHeight: number;
  itemWidth: number;
  itemHeight: number;
};

export type SeededLayout = {
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
};

export function createSeededLayout(config: SeededLayoutConfig): SeededLayout {
  const seed = hashString(`${config.id}:${config.index}`);
  const randomA = seededRandom(seed);
  const randomB = seededRandom(seed + 17);
  const randomC = seededRandom(seed + 31);
  const centerOffset = (config.total - 1) / 2;
  const stackOffset = config.index - centerOffset;
  const spreadX = Math.min(config.viewportWidth * 0.18, config.itemWidth * 0.75);
  const spreadY = Math.min(config.viewportHeight * 0.1, config.itemHeight * 0.28);
  const centerX = config.viewportWidth / 2;
  const centerY = config.viewportHeight / 2;

  return {
    x: centerX + stackOffset * spreadX * 0.46 + (randomA - 0.5) * spreadX,
    y: centerY + stackOffset * spreadY * 0.22 + (randomB - 0.5) * spreadY,
    rotation: (randomC - 0.5) * 18,
    zIndex: config.index,
  };
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
