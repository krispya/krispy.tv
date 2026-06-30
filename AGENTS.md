<!-- managed:start -->
## Workspace Tools

- **Package Manager:** pnpm
- **Linter:** oxlint
- **Formatter:** prettier

### After Editing

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
<!-- managed:end -->

## Architecture

> **IMPORTANT:** Keep these architecture notes in sync with the app.

The app has an architecture with strict separation of concerns and boundaries reinforced by the file system.

### Content

Content is user authored data such as MDX articles and JSON metadata defined in `content/`.

### Static Assets

Static assets such as images, video and 3D models are defined in `public/`. These assets need stable browser URLs. They are referenced by a relative public path.

### Client Code

Client code is defined in `src/`. It is broken up into domain level features in `src/features` and an `app.tsx` entry point. Routers for the router are defined statically in `routes.ts`.

Features can either be purely view or real-time.

- **View feature.** This is a typical React component as the view layer. State is purely local view state, or fetched from an external API and cached locally. Updates are expected to be sparse and reactive. `about` is an example of a view feature.
- **Real-time feature.** This has an ECS core powered by Koota that updates in a real-time frameloop and the separately React view components that query the Koota world for entities and maps them to view components. This is called a renderer pattern. There is a strict boundary between the core and view where the core can be run headless and the view is a projection of its state. `desk` is an example of a real-time feature.
