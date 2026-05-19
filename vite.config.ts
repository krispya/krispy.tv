import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import babel from '@rolldown/plugin-babel';
import mdx from '@mdx-js/rollup';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';

const root = path.dirname(fileURLToPath(import.meta.url));
const deskTraitsPath = path.resolve(root, 'src/features/desk/traits.ts');

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/krispy.tv/' : '/',
  resolve: {
    alias: {
      '@content': path.resolve(root, 'content'),
    },
  },
  plugins: [
    {
      name: 'desk-traits-full-reload',
      handleHotUpdate({ file, server }) {
        if (file !== deskTraitsPath) {
          return;
        }

        server.ws.send({ type: 'full-reload', path: '*' });
        return [];
      },
    },
    {
      name: 'github-pages-spa-fallback',
      apply: 'build',
      writeBundle({ dir }) {
        const outputDir = path.resolve(root, dir ?? 'dist');

        fs.copyFileSync(path.join(outputDir, 'index.html'), path.join(outputDir, '404.html'));
      },
    },
    tailwindcss(),
    mdx({
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
}));
