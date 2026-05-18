# Workspace Tools

- **Package Manager:** pnpm
- **Linter:** oxlint
- **Formatter:** prettier

## React Compiler

Use React Compiler defaults. Do not add `useMemo`, `useCallback`, or `React.memo` unless required. Prefer removing stale manual memoization when editing. Use `"use no memo"` only as a targeted escape hatch. Keep side effects and state writes out of render and instead put them in effects, event handlers, external systems, or existing runtime hooks.

## After Editing

✅ After editing files, check the types for errors and then format and lint only the files changed for the current task.

```sh
# Example
pnpm typecheck
# Run format and lint for only files modified
pnpm exec prettier --config .config/prettier.json --ignore-path .config/prettierignore --write src/App.tsx src/features/desk/systems/update-dragging.ts
pnpm lint -- src/App.tsx src/features/desk/systems/update-dragging.ts
```

❌ Avoid unless explicitly approved:

```sh
pnpm format
pnpm lint
```

## Architecture

> **IMPORTANT:** Keep these architecture notes in sync with the app. If the app changes, update this too.

The app has a strict architecture with separation of concerns and boundaries reinforced by the file system. Assumes a single author for the blog.

### Content

Content is pure data defined in `content/`. MDX articles and JSON metadata. Content files should describe data and prose, not application behavior.

### Static Assets

Static assets such as images, video and 3D models are defined in `public/`. These assets need stable browser URLs, such as images and social cards. They are referenced by their public path.

### Client Code

Client code is defined in `src/`. It is broken up into domain level features in `src/features` and an `app.tsx` entry point. Routers for the router are defined statically in `routes.ts`.

- `**features/article` — Article data loaders and full article HTML pages. No Koota, no desk imports.
- `**features/about`** — About page presentation.
- `**features/desk**` — Real-time Koota desk: headless traits, systems, actions, frameloop, and view renderers. May reference article metadata for desk entities; articles do not reference the desk.

Only the desk route mounts `WorldProvider` and the frame loop.