import type { Polaroid, PolaroidCaption, PolaroidFrontmatter } from './types.js';

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

function isRemoteOrDataUrl(path: string) {
  return /^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(path) || /^(?:data|blob):/i.test(path);
}

function toImageSrc(image: string) {
  if (isRemoteOrDataUrl(image)) return image;

  const path = image.startsWith('/') ? image.slice(1) : image;
  return `${import.meta.env.BASE_URL}${path}`;
}

function isImageCaptionUrl(caption: string) {
  return (
    isRemoteOrDataUrl(caption) ||
    /(?:^data:image\/|(?:\.avif|\.gif|\.jpe?g|\.png|\.svg|\.webp)(?:[?#].*)?$)/i.test(caption)
  );
}

function toCaption(caption: PolaroidFrontmatter['caption']): PolaroidCaption | undefined {
  if (!caption) return undefined;

  if (typeof caption === 'string') {
    return isImageCaptionUrl(caption)
      ? { kind: 'image', imageSrc: toImageSrc(caption), alt: '' }
      : { kind: 'text', text: caption };
  }

  if (caption.image) {
    return { kind: 'image', imageSrc: toImageSrc(caption.image), alt: caption.alt ?? '' };
  }

  if (caption.text) return { kind: 'text', text: caption.text };

  return undefined;
}

export const polaroids: Polaroid[] = Object.entries(polaroidFrontmatterModules)
  .map(([path, frontmatter]) => ({
    slug: slugFromPath(path),
    image: frontmatter.image,
    imageSrc: toImageSrc(frontmatter.image),
    caption: toCaption(frontmatter.caption),
    order: frontmatter.order ?? 0,
    hasBody: frontmatter.hasBody ?? false,
    loadComponent: () => loadPolaroidModule(path),
  }))
  .sort((first, second) => first.order - second.order || first.slug.localeCompare(second.slug));

export function getPolaroid(slug: string) {
  return polaroids.find((polaroid) => polaroid.slug === slug);
}
