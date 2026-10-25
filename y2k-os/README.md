# Y2K OS frontend

Y2K OS is a React + TypeScript + Vite desktop interface for the hedge-fund simulation. It runs independently with frontend-owned mock data; the Python game engine and AI service are not connected by this project.

## Run locally

From the repository root:

```bash
npm --prefix y2k-os install
npm --prefix y2k-os run dev
```

The production checks are:

```bash
npm --prefix y2k-os run build
npm --prefix y2k-os run lint
```

## Architecture

- `src/main.tsx` is the React bootstrap only.
- `src/App.tsx` composes the desktop, window manager behavior, application registry, and state hooks.
- `src/components/` contains reusable desktop primitives: the desktop surface, taskbar/Start menu, and window shell.
- `src/apps/` contains the application UIs: Market Terminal, email, browser, Messenger, and File Explorer.
- `src/domain/` contains shared TypeScript models and curated mock fixtures.
- `src/services/` contains frontend-only mock operations, including order validation, portfolio calculations, session progression, and simulated file opening.
- `src/state/useGameState.ts` owns mock game state. Desktop/window state remains local to `App`, so presentation state is not mixed with simulated financial state.
- `src/styles/` contains shared design tokens. Application and shell styles remain in `src/App.css` to preserve the existing visual design during this incremental refactor.

The application registry in `src/app/applicationRegistry.ts` is the single source for application IDs, titles, icons, and default window sizes. It is used by the desktop launcher and window creation logic.

## Simulation boundary

The market, game progression, email, Messenger, browser pages, and file system are simulated locally. Orders and session advancement are not authoritative game-engine operations. The extracted service functions are frontend-facing seams that can later be replaced by adapters supplied by the team without requiring the application UIs to be rewritten.

## Assets

Source assets are imported through Vite from `src/assets/`, including the default wallpaper in `src/assets/wallpapers/desktop-image.jpg`. This keeps development and production asset URLs consistent.
