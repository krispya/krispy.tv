// Global color source of truth: the raw palette and its semantics.
//
// `palette` holds the brand colors (ordered most -> least dominant).
// `color` maps those onto scene roles, with `shade` for deriving variants.
// This is the single place to retune the look. The Tailwind `@theme` block
// in src/index.css mirrors these values for the view layer.

import { shade, withAlpha } from './features/desk/utils/color';

export const palette = {
  promenade: '#F7F6E1',
  folio: '#FFFDF7',
  igniting: '#F5D798',
  meat: '#EE7F80',
  hazel: '#A36943',
  rootBeer: '#7F524D',
  catnip: '#88B094',
  overTheSky: '#9AD2E4',
} as const;

type ColorTokens = {
  surface: { desk: string; paper: string; articlePaper: string; paperEdge: string };
  line: { ink: string; inkSoft: string };
  accent: { gold: string; coral: string; sage: string; sky: string; wood: string };
  image: { blackConform: string };
};

// Semantic tokens — scene roles. Retune the mapping here to re-theme the desk.
export const color: ColorTokens = {
  surface: {
    // Neutral desktop surface (not a brand accent) — a light, cool ground
    // that lets the warm paper + accents read like the illustrated reference.
    desk: '#DFDDD9',
    paper: palette.promenade,
    articlePaper: palette.folio,
    paperEdge: shade(palette.promenade, -30),
  },
  line: {
    ink: shade(palette.rootBeer, -25),
    inkSoft: palette.rootBeer,
  },
  accent: {
    gold: palette.igniting,
    coral: palette.meat,
    sage: palette.catnip,
    sky: palette.overTheSky,
    wood: palette.hazel,
  },
  image: {
    // CSS `lighten` image layers map absolute black to this gradient.
    blackConform: `linear-gradient(145deg, ${withAlpha(shade(palette.rootBeer, -45), 1)} 0%,  ${withAlpha(shade(palette.rootBeer, -45), 0.4)} 100%)`,
  },
};
