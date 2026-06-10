import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conformImageToPalette, getImageMimeType, loadPalette } from './palette-conform.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BOOKS_DIR = path.join(ROOT, 'content/books');
const PUBLIC_DIR = path.join(ROOT, 'public');
const COLOR_SOURCE_PATH = path.join(ROOT, 'src/color.ts');
const GENERATED_DIR_NAME = 'generated';
const OUTPUT_EXTENSION = '.webp';
const OUTPUT_QUALITY = 0.94;
const MAX_OUTPUT_DIMENSION = 1000;

type BookContent = {
  coverImage: string;
};

type BookCoverJob = {
  title: string;
  inputPath: string;
  outputPath: string;
  outputPublicPath: string;
};

function normalizePublicPath(publicPath: string) {
  return publicPath.startsWith('/') ? publicPath.slice(1) : publicPath;
}

function getGeneratedCoverPublicPath(coverImage: string) {
  const normalizedPath = normalizePublicPath(coverImage);
  const directory = path.posix.dirname(normalizedPath);
  const extension = path.posix.extname(normalizedPath);
  const basename = path.posix.basename(normalizedPath, extension);

  return path.posix.join(directory, GENERATED_DIR_NAME, `${basename}${OUTPUT_EXTENSION}`);
}

function getBookCoverJobs() {
  const files = readdirSync(BOOKS_DIR).filter((file) => file.endsWith('.json'));

  return files.map<BookCoverJob>((file) => {
    const book = JSON.parse(readFileSync(path.join(BOOKS_DIR, file), 'utf8')) as BookContent;
    const coverImage = normalizePublicPath(book.coverImage);
    const outputPublicPath = getGeneratedCoverPublicPath(book.coverImage);

    return {
      title: file.replace(/\.json$/, ''),
      inputPath: path.join(PUBLIC_DIR, coverImage),
      outputPath: path.join(PUBLIC_DIR, outputPublicPath),
      outputPublicPath,
    };
  });
}

const palette = loadPalette(COLOR_SOURCE_PATH);
const jobs = getBookCoverJobs();

for (const job of jobs) {
  const result = conformImageToPalette({
    source: readFileSync(job.inputPath),
    sourceMimeType: getImageMimeType(job.inputPath),
    palette,
    outputMimeType: 'image/webp',
    outputQuality: OUTPUT_QUALITY,
    maxOutputDimension: MAX_OUTPUT_DIMENSION,
    name: job.title,
  });

  mkdirSync(path.dirname(job.outputPath), { recursive: true });
  writeFileSync(job.outputPath, result.data);

  console.log(
    `  ✓ ${job.outputPublicPath} (${result.width}x${result.height}, shift ${result.averageShift.toFixed(
      4
    )})`
  );
}

console.log(`\nGenerated ${jobs.length} book cover(s).`);
