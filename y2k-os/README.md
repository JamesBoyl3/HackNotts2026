# Y2K OS

Y2K OS is a Windows 98-inspired desktop for a playable Nottingham hedge-fund simulation. The production game runs entirely in the React/TypeScript frontend; the historical Python and standalone React projects remain useful references but are not gameplay dependencies.

## Run

From the repository root:

```bash
npm install --prefix y2k-os
npm run dev
```

Checks:

```bash
npm run build
npm run lint
```

Open the Vite URL and launch **Market Terminal**. The normal session clock runs from 09:00 to 16:30 over eight real minutes; the compact session timer is shown in the desktop header. Market weeks are advanced explicitly from the terminal and are not automatically advanced by the clock.

## Architecture

- `src/game/gameEngine.ts` is the sole source of truth for cash, positions, prices, history, events, LP confidence, crash timing, orders, week progression, game-over, and final performance.
- `src/state/useGameState.ts` is the React adapter. It persists validated-in-practice game snapshots in versioned-key local storage and exposes engine actions to applications.
- `src/apps/terminal/MarketTerminal.tsx` renders the shared engine state and never calculates prices or trade rules. The previous placeholder is preserved in `MarketTerminalBackup.tsx`.
- `src/services/aiContent.ts` calls the local OpenAI-compatible model at `http://127.0.0.1:8889/v1/chat/completions`, validates concise JSON news, applies a timeout, and falls back to deterministic week-specific copy. The game remains playable when the model is offline.
- `src/apps/email/email.tsx` retains the existing Outlook Express fixtures and receives a week bulletin fallback as new weeks open.
- `src/apps/browser/browser.tsx` provides Nottingham Financial, Penguin Palace, eBay, and YouTube-style internal pages. No simulated page makes external requests.

The migrated rules match `marketsimreact/marketsimreact.jsx`: $1.2M initial cash, HCKSOC/CAPONE/TELLUV starting holdings, $35K overhead, reassurance for $150K, a random crash in weeks 11–14, deterministic events in weeks 5/9/17, and a 24-week target of $7.5M.

## Local AI

Start any local OpenAI-compatible chat server on port `8889`, for example one configured to expose:

```text
http://127.0.0.1:8889/v1/chat/completions
```

No cloud key or frontend secret is required. Responses must contain JSON fields `headline`, `summary`, `body`, `publishedAt`, and `relatedTickers`; invalid, slow, or unavailable responses use the local fallback article. AI prose can never mutate gameplay state.

## Reset and known limitations

Use **Start > Restart mock session** or the terminal’s new-game control to clear the stored game. Generated narrative is cached for the current React session and fallback email copy is retained across week changes. The local model server is optional. Browser mock pages are intentionally lightweight set dressing, and engine unit-test infrastructure is not yet added; the engine is isolated into pure functions to make that next step straightforward.
