# Workspace Tools

- **Package Manager:** pnpm
- **Linter:** oxlint
- **Formatter:** prettier

## After Editing

✅ After editing files, check the types for errors and then format and lint only the files changed for the current task.

```sh
# Example
pnpm typecheck
# Run format and lint for only files modified
pnpm exec prettier --config .config/prettier.json --ignore-path .config/prettierignore --write src/App.tsx src/core/systems/move-entity.ts
pnpm lint -- src/App.tsx src/core/systems/move-entity.ts
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

Content is pure data defined in `content/`. MDX posts and JSON metadata. Content files should describe data and prose, not application behavior.

### Static Assets

Static assets such as images, video and 3D models are defined in `public/`. These assets need stable browser URLs, such as images and social cards. They are referenced by their public path.

### Core

Headless data and behavior are defined in `src/core/`. Keep this layer free of React and route rendering. Koota world setup, actions, traits, systems, movement behavior and domain data loaders live here. Posts are exposed from `src/core/posts`.

### Client Code

Client code is defined in `src/`. It is broken up into domain level features in `src/features` and an `app.tsx` entry point. Routers for the router are defined statically in `routes.ts`.

Features project React views over the headless core. Shared interactive surfaces, such as the desk, should stay reusable and blog-agnostic; blog-specific routing and post presentation belong in `src/features/blog`, and about-specific presentation belongs in `src/features/about`.
