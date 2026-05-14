/// <reference types="vite/client" />

declare module '*.mdx' {
  import type { ComponentType } from 'react';

  export const frontmatter: {
    title: string;
    date: string;
    summary: string;
  };

  const MDXComponent: ComponentType;
  export default MDXComponent;
}
