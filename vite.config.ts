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

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@content': path.resolve(root, 'content'),
    },
  },
  plugins: [
    tailwindcss(),
    mdx({
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
});
