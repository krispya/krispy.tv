/** @jsxImportSource react */

import React from 'react';
import { createRequire } from 'node:module';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  BlockContent,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  Paragraph,
  Root,
  RootContent,
  Strong,
  Text,
} from 'mdast';
import remarkFrontmatter from 'remark-frontmatter';
import { remark } from 'remark';
import { render } from 'takumi-js';
import { parse as parseYaml } from 'yaml';

const require = createRequire(import.meta.url);
const INTER_FONT = require.resolve('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
const PLAYFAIR_FONT =
  require.resolve('@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2');
const FIRA_CODE_FONT =
  require.resolve('@fontsource-variable/fira-code/files/fira-code-latin-wght-normal.woff2');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// US Letter at 96dpi
const PAPER_W = 816;
const PAPER_H = 1056;
const PADDING = 48;

const PRIMARY_700 = 'oklch(0.525_0.223_3.958)';
const PRIMARY_200 = 'oklch(0.899_0.061_343.231)';

type Frontmatter = {
  title: string;
  date: string;
  summary: string;
  tags?: string[];
};

type Author = {
  name: string;
  site: string;
};

type ImageInfo = { src: string; width: number; height: number };

function parseFrontmatter(source: string): Frontmatter {
  const match = /^---\r?\n([\s\S]+?)\r?\n---/.exec(source);
  if (!match) throw new Error('No frontmatter found');
  return parseYaml(match[1]) as Frontmatter;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
    new Date(`${dateStr}T00:00:00`)
  );
}

// Resolve a relative image path from an MDX file to an absolute file path.
function resolveImagePath(imgSrc: string, articlesDir: string): string {
  const resolved = path.resolve(articlesDir, imgSrc);
  return resolved.replace(path.join(ROOT, 'content', 'images'), path.join(ROOT, 'public', 'images'));
}

async function loadImage(filePath: string): Promise<ImageInfo> {
  const data = await readFile(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const src = `data:${mime};base64,${data.toString('base64')}`;

  let width = 0;
  let height = 0;

  if (ext === 'png') {
    width = data.readUInt32BE(16);
    height = data.readUInt32BE(20);
  } else if (ext === 'jpg' || ext === 'jpeg') {
    let i = 2;
    while (i < data.length - 8) {
      if (
        data[i] === 0xff &&
        (data[i + 1] === 0xc0 || data[i + 1] === 0xc1 || data[i + 1] === 0xc2)
      ) {
        height = data.readUInt16BE(i + 5);
        width = data.readUInt16BE(i + 7);
        break;
      }
      if (data[i] === 0xff) {
        const segLen = data.readUInt16BE(i + 2);
        i += 2 + segLen;
      } else {
        i++;
      }
    }
  } else if (ext === 'webp') {
    // RIFF header: bytes 12-15 are "VP8 ", "VP8L", or "VP8X"
    const chunk = data.toString('ascii', 12, 16);
    if (chunk === 'VP8 ') {
      // Lossy: dimensions at offset 26-29 (little-endian 16-bit, masked to 14 bits)
      width = data.readUInt16LE(26) & 0x3fff;
      height = data.readUInt16LE(28) & 0x3fff;
    } else if (chunk === 'VP8L') {
      // Lossless: 32-bit signature at offset 21, width/height packed in bits
      const bits = data.readUInt32LE(21);
      width = (bits & 0x3fff) + 1;
      height = ((bits >> 14) & 0x3fff) + 1;
    } else if (chunk === 'VP8X') {
      // Extended: canvas size at offset 24-29 (24-bit LE each)
      width = (data[24] | (data[25] << 8) | (data[26] << 16)) + 1;
      height = (data[27] | (data[28] << 8) | (data[29] << 16)) + 1;
    }
  }

  return { src, width, height };
}

// --- MDX body → React JSX renderer ---

type RenderCtx = {
  imageInfos: Map<string, ImageInfo>;
  contentWidth: number;
};

function renderInline(
  nodes: (Text | Strong | InlineCode | Link | Image | RootContent)[],
  key: string
): React.ReactNode {
  return nodes.map((node, i) => {
    const k = `${key}-${i}`;
    if (node.type === 'text') return <span key={k}>{(node as Text).value}</span>;
    if (node.type === 'strong')
      return (
        <span key={k} tw="font-bold text-gray-900">
          {renderInline((node as Strong).children as never[], k)}
        </span>
      );
    if (node.type === 'inlineCode')
      return (
        <span
          key={k}
          tw="text-sm bg-gray-100 rounded px-1 text-gray-800"
          style={{ fontFamily: 'Fira Code Variable' }}
        >
          {(node as InlineCode).value}
        </span>
      );
    if (node.type === 'link')
      return (
        <span key={k} tw={`text-[${PRIMARY_700}] underline decoration-[${PRIMARY_200}]`}>
          {renderInline((node as Link).children as never[], k)}
        </span>
      );
    if (node.type === 'emphasis')
      return (
        <span key={k} style={{ fontStyle: 'italic' }}>
          {renderInline((node as unknown as Strong).children as never[], k)}
        </span>
      );
    return null;
  });
}

function renderBlock(node: RootContent, ctx: RenderCtx, key: string): React.ReactNode {
  if (node.type === 'heading') {
    const h = node as Heading;
    const tw =
      h.depth === 1
        ? 'mt-8 mb-3 text-3xl font-bold font-serif text-gray-950 uppercase leading-tight'
        : h.depth === 2
          ? 'mt-6 mb-2 text-2xl font-bold font-serif text-gray-950 uppercase leading-tight'
          : 'mt-4 mb-1 text-xl font-bold font-serif text-gray-950 uppercase';
    return (
      <div key={key} tw={tw} style={{ fontFamily: 'Playfair Display Variable' }}>
        {renderInline(h.children as never[], key)}
      </div>
    );
  }

  if (node.type === 'paragraph') {
    const p = node.children;
    // A paragraph with a single image child — render the image full-width.
    if (p.length === 1 && p[0].type === 'image') {
      const img = p[0] as Image;
      const info = ctx.imageInfos.get(img.url);
      if (info) {
        const renderedHeight =
          info.width > 0 ? Math.round((ctx.contentWidth * info.height) / info.width) : 200;
        return (
          <img
            key={key}
            src={info.src}
            tw="my-6 rounded-xl w-full"
            style={{ width: ctx.contentWidth, height: renderedHeight }}
          />
        );
      }
    }

    return (
      <div
        key={key}
        tw="mb-5 text-lg text-gray-800 leading-relaxed"
        style={{ fontFamily: 'Inter Variable' }}
      >
        {renderInline(p as never[], key)}
      </div>
    );
  }

  if (node.type === 'thematicBreak') {
    return (
      <div key={key} tw="my-6" style={{ height: 1, backgroundColor: 'oklch(0.928 0.006 264.531)' }} />
    );
  }

  if (node.type === 'list') {
    const list = node as List;
    return (
      <div key={key} tw="mb-5 flex flex-col pl-5" style={{ fontFamily: 'Inter Variable' }}>
        {list.children.map((item: (typeof list.children)[number], i: number) => (
          <div key={i} tw="flex flex-row gap-2 text-lg text-gray-800 leading-relaxed">
            <span tw="text-gray-400 mt-px">{list.ordered ? `${i + 1}.` : '•'}</span>
            <div tw="flex flex-col">
              {(item.children as BlockContent[]).map((child, j) => {
                // Render paragraph children inline (no mb-5) to keep tight list spacing
                if (child.type === 'paragraph') {
                  return (
                    <span key={j}>
                      {renderInline((child as Paragraph).children as never[], `${key}-${i}-${j}`)}
                    </span>
                  );
                }
                return renderBlock(child as RootContent, ctx, `${key}-${i}-${j}`);
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (node.type === 'code') {
    return (
      <div
        key={key}
        tw="mb-4 bg-gray-100 rounded-md p-4 text-sm text-gray-800"
        style={{ whiteSpace: 'pre' as never, fontFamily: 'Fira Code Variable' }}
      >
        {node.value}
      </div>
    );
  }

  if (node.type === 'blockquote') {
    return (
      <div key={key} tw="mb-4 border-l-4 border-gray-300 pl-4 text-gray-600 italic">
        {(node.children as RootContent[]).map((child, i) => renderBlock(child, ctx, `${key}-${i}`))}
      </div>
    );
  }

  // Skip MDX nodes (imports/exports)
  return null;
}

function renderBody(ast: Root, ctx: RenderCtx): React.ReactNode[] {
  return ast.children
    .filter((n: RootContent) => n.type !== 'yaml')
    .map((node: RootContent, i: number) => renderBlock(node, ctx, `body-${i}`));
}

async function main() {
  const interFont = await readFile(INTER_FONT);
  const playfairFont = await readFile(PLAYFAIR_FONT);
  const firaCodeFont = await readFile(FIRA_CODE_FONT);

  const author: Author = JSON.parse(await readFile(path.join(ROOT, 'content/author.json'), 'utf8'));

  const articlesDir = path.join(ROOT, 'content/articles');
  const files = (await readdir(articlesDir)).filter((f) => f.endsWith('.mdx'));

  const outDir = path.join(ROOT, 'public/images/articles');
  await mkdir(outDir, { recursive: true });

  for (const file of files) {
    const slug = file.replace('.mdx', '');
    const source = await readFile(path.join(articlesDir, file), 'utf8');
    const fm = parseFrontmatter(source);

    const ast = remark().use(remarkFrontmatter, ['yaml']).parse(source) as Root;

    // Preload all images referenced in the AST
    const imageInfos = new Map<string, ImageInfo>();
    for (const node of ast.children) {
      if (node.type === 'paragraph') {
        for (const child of node.children) {
          if (child.type === 'image') {
            const filePath = resolveImagePath(child.url, articlesDir);
            imageInfos.set(child.url, await loadImage(filePath));
          }
        }
      }
    }

    const contentWidth = PAPER_W - PADDING * 2;
    const ctx: RenderCtx = { imageInfos, contentWidth };

    const png = await render(
      <div
        tw="flex flex-col bg-white"
        style={{ width: PAPER_W, height: PAPER_H, padding: PADDING, fontFamily: 'Inter Variable' }}
      >
        {/* Article header — mirrors article.tsx */}
        <div tw="flex flex-col mb-10 items-center justify-center">
          <span
            tw="mb-6 text-center text-7xl font-black uppercase text-gray-950 leading-none"
            style={{ fontFamily: 'Playfair Display Variable', letterSpacing: '-0.05em' }}
          >
            {fm.title}
          </span>
          <span
            tw="mb-8 text-center text-xl text-gray-700 w-full leading-relaxed"
            style={{ fontFamily: 'Playfair Display Variable', fontStyle: 'italic' }}
          >
            {fm.summary}
          </span>
          <div
            tw="flex flex-row justify-between w-full py-3"
            style={{
              borderTop: '2px solid oklch(0.13 0.028 261.692)',
              borderBottom: '2px solid oklch(0.13 0.028 261.692)',
            }}
          >
            <span tw="text-sm font-bold tracking-widest text-gray-900 uppercase">
              {formatDate(fm.date)}
            </span>
            <span tw="text-sm font-bold tracking-widest text-gray-900 uppercase">
              By{' '}
              <span tw={`text-[${PRIMARY_700}] underline decoration-[${PRIMARY_200}]`}>
                {author.name}
              </span>
            </span>
          </div>
        </div>
        {/* Article body */}
        <div tw="flex flex-col">{renderBody(ast, ctx)}</div>
      </div>,
      {
        width: PAPER_W,
        height: PAPER_H,
        fonts: [
          { name: 'Inter Variable', data: interFont },
          { name: 'Playfair Display Variable', data: playfairFont },
          { name: 'Fira Code Variable', data: firaCodeFont },
        ],
      }
    );

    const outPath = path.join(outDir, `${slug}.png`);
    await writeFile(outPath, png);
    console.log(`  ✓ ${outPath}`);
  }

  console.log(`\nGenerated ${files.length} paper texture(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
