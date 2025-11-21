# Rukn File Tree MRE

Minimal reproduction of the Rukn file-tree UI. It mirrors the production folder/file flows (virtualised tree, sticky parents, drag & drop, context menu, keyboard shortcuts, dialogs) but replaces every backend/API dependency with deterministic in-memory mocks so the component can be debugged in isolation.

## What's included

- Exact copies of the Rukn `Folder`, `FileTreeItem`, and supporting utilities
- Mocked API layer, websocket layer, and dataset (hundreds of folders/files, revisions, users)
- Dialog/context-menu primitives lifted from the main app
- The same Tailwind-generated styles used in production so the UI matches pixel-for-pixel

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 (or whichever port Vite prints) and interact with the tree. Drag/drop, multi-select, copy/cut/paste, inline rename, and context-menu actions all mutate the local dataset so behaviours can be tested without the real backend.

## Commands

- `pnpm dev` – run the playground with hot module reloading.
- `pnpm check` – run `svelte-check` for type and accessibility diagnostics.
- `pnpm build` – typecheck then produce a production bundle via Vite.

## Project layout

- `src/Folder.svelte` – main tree view copied from Rukn.
- `src/FileTreeItem.svelte` – virtualised node renderer with sticky parents.
- `src/store.js` – mocked `session`/`appdata` stores plus helpers the API layer uses.
- `src/api.js` – miniature REST-ish mock that implements the endpoints the tree expects.
- `src/lib` – shared UI primitives (dialogs, buttons, context menu, etc.).

Everything else (router stub, CSS, utilities) exists only to make the tree behave the same way it does inside the monolith.
