import type { Polaroid, PolaroidFrontmatter } from './types.js';

const polaroidFrontmatterModules = import.meta.glob<PolaroidFrontmatter>('@content/polaroids/*.mdx', {
  eager: true,
  import: 'frontmatter',
});

const polaroidComponentModules = import.meta.glob<unknown>('@content/polaroids/*.mdx', {
  import: 'default',
});

async function loadPolaroidModule(path: string) {
  const loadComponent = polaroidComponentModules[path];
  if (!loadComponent) throw new Error(`Could not find MDX component for ${path}.`);

  return loadComponent();
}

function slugFromPath(path: string) {
  const filename = path.split('/').pop();
  if (!filename) throw new Error(`Could not parse slug from polaroid path: ${path}`);

  return filename.replace(/\.mdx$/, '');
}

function toImageSrc(image: string) {
  const path = image.startsWith('/') ? image.slice(1) : image;
  return `${import.meta.env.BASE_URL}${path}`;
}

export const polaroids: Polaroid[] = Object.entries(polaroidFrontmatterModules)
  .map(([path, frontmatter]) => ({
    slug: slugFromPath(path),
    image: frontmatter.image,
    imageSrc: toImageSrc(frontmatter.image),
    caption: frontmatter.caption ?? '',
    order: frontmatter.order ?? 0,
    hasBody: frontmatter.hasBody ?? false,
    loadComponent: () => loadPolaroidModule(path),
  }))
  .sort((first, second) => first.order - second.order || first.slug.localeCompare(second.slug));

export function getPolaroid(slug: string) {
  return polaroids.find((polaroid) => polaroid.slug === slug);
}
