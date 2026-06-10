import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export type PaletteConformResult = {
  data: Buffer;
  width: number;
  height: number;
  averageShift: number;
};

type PaletteConformOptions = {
  source: Buffer;
  sourceMimeType: string;
  palette: string[];
  outputMimeType: 'image/png' | 'image/webp';
  outputQuality?: number;
  maxOutputDimension?: number;
  name: string;
};

export function loadPalette(colorSourcePath: string) {
  const colorSource = readFileSync(colorSourcePath, 'utf8');
  const paletteMatch = /export const palette = \{([\s\S]+?)\} as const;/.exec(colorSource);
  if (!paletteMatch) throw new Error(`Could not find palette in ${colorSourcePath}.`);

  const colors = paletteMatch[1].match(/#[0-9a-fA-F]{6}/g);
  if (!colors?.length) throw new Error(`Could not find palette colors in ${colorSourcePath}.`);

  return colors;
}

export function getImageMimeType(filePath: string) {
  const extension = path.extname(filePath).slice(1).toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';

  throw new Error(`Unsupported image extension: ${filePath}`);
}

function toKebabCase(value: string) {
  return value
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function conformImageToPalette({
  source,
  sourceMimeType,
  palette,
  outputMimeType,
  outputQuality = 0.94,
  maxOutputDimension,
  name,
}: PaletteConformOptions): PaletteConformResult {
  const sourceBase64 = source.toString('base64');
  const tempDir = mkdtempSync(path.join(tmpdir(), 'palette-conform-'));
  const htmlPath = path.join(tempDir, `${toKebabCase(name)}.html`);

  const html = `<!doctype html>
<meta charset="utf-8">
<script>
const sourceBase64 = ${JSON.stringify(sourceBase64)};
const sourceMimeType = ${JSON.stringify(sourceMimeType)};
const palette = ${JSON.stringify(palette)};
const outputMimeType = ${JSON.stringify(outputMimeType)};
const outputQuality = ${JSON.stringify(outputQuality)};
const maxOutputDimension = ${JSON.stringify(maxOutputDimension ?? null)};
const image = new Image();

function srgbChannelToLinear(value) {
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function linearChannelToSrgb(value) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

function srgbToOklab(red, green, blue) {
  const r = srgbChannelToLinear(red);
  const g = srgbChannelToLinear(green);
  const b = srgbChannelToLinear(blue);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToSrgb(lab) {
  const l = lab.l + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m = lab.l - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s = lab.l - 0.0894841775 * lab.a - 1.291485548 * lab.b;

  const l3 = l * l * l;
  const m3 = m * m * m;
  const s3 = s * s * s;

  return {
    red: linearChannelToSrgb(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    green: linearChannelToSrgb(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    blue: linearChannelToSrgb(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  };
}

function hexToOklab(hex) {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16) / 255;
  const green = parseInt(value.slice(2, 4), 16) / 255;
  const blue = parseInt(value.slice(4, 6), 16) / 255;

  return srgbToOklab(red, green, blue);
}

function smoothstep(edge0, edge1, value) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function mix(from, to, amount) {
  return from + (to - from) * amount;
}

function findNearestPaletteColor(lab, paletteLabs) {
  let nearest = paletteLabs[0];
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of paletteLabs) {
    const lightnessDistance = (lab.l - candidate.l) * 0.35;
    const aDistance = lab.a - candidate.a;
    const bDistance = lab.b - candidate.b;
    const distance =
      lightnessDistance * lightnessDistance + aDistance * aDistance + bDistance * bDistance;

    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function findDarkestPaletteColor(paletteLabs) {
  return paletteLabs.reduce((darkest, candidate) => (candidate.l < darkest.l ? candidate : darkest));
}

function conformPixel(red, green, blue, paletteLabs) {
  const lab = srgbToOklab(red / 255, green / 255, blue / 255);
  const target = findNearestPaletteColor(lab, paletteLabs);
  const shadowTarget = findDarkestPaletteColor(paletteLabs);
  const chroma = Math.hypot(lab.a, lab.b);
  const chromaWeight = smoothstep(0.02, 0.12, chroma);
  const shadowAmount = 1 - smoothstep(0.08, 0.42, lab.l);
  const highlightProtection = 1 - smoothstep(0.9, 1, lab.l) * 0.55;
  const strength = mix(mix(0.16, 0.48, chromaWeight), 0.56, shadowAmount) * highlightProtection;
  const shadowLightness = Math.max(lab.l, shadowTarget.l * 0.58);
  const lightnessTarget = mix(target.l, shadowLightness, shadowAmount);
  const shadowChromaStrength = mix(strength, 0.94, shadowAmount);
  const conformed = {
    l: mix(
      mix(lab.l, target.l, strength * 0.06),
      lightnessTarget,
      shadowAmount * 0.86
    ),
    a: mix(lab.a, mix(target.a, shadowTarget.a, shadowAmount), shadowChromaStrength),
    b: mix(lab.b, mix(target.b, shadowTarget.b, shadowAmount), shadowChromaStrength),
  };
  const srgb = oklabToSrgb(conformed);

  return {
    red: Math.round(srgb.red * 255),
    green: Math.round(srgb.green * 255),
    blue: Math.round(srgb.blue * 255),
    shift: Math.hypot(conformed.a - lab.a, conformed.b - lab.b),
  };
}

image.addEventListener('load', () => {
  const scale =
    maxOutputDimension === null
      ? 1
      : Math.min(1, maxOutputDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;

  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.imageSmoothingEnabled = true;
  sourceContext.imageSmoothingQuality = 'high';
  sourceContext.drawImage(image, 0, 0, width, height);

  const imageData = sourceContext.getImageData(0, 0, width, height);
  const paletteLabs = palette.map(hexToOklab);
  let totalShift = 0;
  let opaquePixels = 0;

  for (let index = 0; index < imageData.data.length; index += 4) {
    const alpha = imageData.data[index + 3];
    if (alpha === 0) continue;

    const conformed = conformPixel(
      imageData.data[index],
      imageData.data[index + 1],
      imageData.data[index + 2],
      paletteLabs
    );

    imageData.data[index] = conformed.red;
    imageData.data[index + 1] = conformed.green;
    imageData.data[index + 2] = conformed.blue;
    totalShift += conformed.shift;
    opaquePixels++;
  }

  sourceContext.putImageData(imageData, 0, 0);

  const result = {
    width,
    height,
    averageShift: opaquePixels > 0 ? totalShift / opaquePixels : 0,
    dataUrl: source.toDataURL(outputMimeType, outputQuality),
  };

  document.body.dataset.canvasResult = btoa(JSON.stringify(result));
});

image.src = 'data:' + sourceMimeType + ';base64,' + sourceBase64;
</script>`;

  writeFileSync(htmlPath, html);

  try {
    const dom = execFileSync(
      CHROME_PATH,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--virtual-time-budget=10000',
        '--dump-dom',
        `file://${htmlPath}`,
      ],
      { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 }
    );

    const match = dom.match(/data-canvas-result="([^"]+)"/);
    if (!match) throw new Error(`Canvas result marker was not found for ${name}.`);

    const result = JSON.parse(Buffer.from(match[1], 'base64').toString('utf8')) as {
      width: number;
      height: number;
      averageShift: number;
      dataUrl: string;
    };
    const base64 = result.dataUrl.slice(result.dataUrl.indexOf(',') + 1);

    return {
      data: Buffer.from(base64, 'base64'),
      width: result.width,
      height: result.height,
      averageShift: result.averageShift,
    };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}
