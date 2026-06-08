import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const INPUT_PATH = resolve('public/lines/headphones/heaphones-fill.png');
const OUTPUT_DIR = resolve('public/lines/headphones');
const OUTPUTS = [
  {
    name: 'heaphones-fill-tone-light.png',
    minAlpha: 1,
    maxAlpha: 84,
  },
  {
    name: 'heaphones-fill-tone-mid.png',
    minAlpha: 85,
    maxAlpha: 169,
  },
  {
    name: 'heaphones-fill-tone-dark.png',
    minAlpha: 170,
    maxAlpha: 255,
  },
];

const sourceBase64 = readFileSync(INPUT_PATH).toString('base64');
const tempDir = mkdtempSync(join(tmpdir(), 'headphones-tones-'));
const htmlPath = join(tempDir, 'generate.html');

const html = `<!doctype html>
<meta charset="utf-8">
<script>
const sourceBase64 = ${JSON.stringify(sourceBase64)};
const outputs = ${JSON.stringify(OUTPUTS)};
const image = new Image();

image.addEventListener('load', () => {
  const source = document.createElement('canvas');
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;

  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0);

  const sourcePixels = sourceContext.getImageData(0, 0, source.width, source.height);
  const alphaCounts = { transparent: 0, light: 0, mid: 0, dark: 0 };
  const generated = outputs.map((output) => {
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;

    const context = canvas.getContext('2d');
    const imageData = context.createImageData(canvas.width, canvas.height);

    for (let index = 0; index < sourcePixels.data.length; index += 4) {
      const alpha = sourcePixels.data[index + 3];
      if (alpha === 0) {
        if (output.name === outputs[0].name) alphaCounts.transparent++;
        continue;
      }

      if (output.name === outputs[0].name) {
        if (alpha <= outputs[0].maxAlpha) alphaCounts.light++;
        else if (alpha <= outputs[1].maxAlpha) alphaCounts.mid++;
        else alphaCounts.dark++;
      }

      if (alpha < output.minAlpha || alpha > output.maxAlpha) continue;

      imageData.data[index] = 0;
      imageData.data[index + 1] = 0;
      imageData.data[index + 2] = 0;
      imageData.data[index + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);

    return {
      name: output.name,
      dataUrl: canvas.toDataURL('image/png'),
    };
  });

  const result = {
    source: {
      name: ${JSON.stringify(basename(INPUT_PATH))},
      width: source.width,
      height: source.height,
    },
    alphaCounts,
    generated,
  };

  document.body.dataset.canvasResult = btoa(JSON.stringify(result));
});

image.src = 'data:image/png;base64,' + sourceBase64;
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
  if (!match) {
    throw new Error('Canvas result marker was not found in Chrome output.');
  }

  const result = JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
  for (const output of result.generated) {
    const base64 = output.dataUrl.replace(/^data:image\/png;base64,/, '');
    writeFileSync(join(OUTPUT_DIR, output.name), Buffer.from(base64, 'base64'));
  }

  console.log(
    `Generated ${result.generated.length} tone images from ${result.source.name} (${result.source.width}x${result.source.height}).`
  );
  console.log(`Alpha buckets: ${JSON.stringify(result.alphaCounts)}`);
  for (const output of result.generated) {
    console.log(`- public/lines/headphones/${output.name}`);
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
