# storybook-addon-profiler — Project Context

## Overview

A Storybook panel addon that shows real-time browser performance metrics while viewing stories. It works by attaching a decorator to every story that starts Web API collectors, then streaming metrics to the manager panel via Storybook's channel.

## Tech Stack

- **Runtime**: Bun (`bun run build`, `bun run dev`, etc. — no npm/node)
- **Bundler**: tsup (wraps Rollup + esbuild), config in `tsup.config.ts`
- **Language**: TypeScript + React (React is only used for the manager panel UI)
- **Storybook version**: 10.x (peer dep accepts `storybook: *`; minimum supported is 8+)

## Key Architecture

### Two execution contexts

1. **Preview** (story iframe) — `src/preview.ts`, `src/performance-decorator.ts`, `src/collectors/`
   - Framework-agnostic. Uses only Web APIs and `storybook/internal/preview-api`.
   - `withPerformanceMonitor` decorator starts collectors, runs a rAF loop, and emits metrics over the Storybook channel.
2. **Manager** (Storybook sidebar/panel) — `src/manager.tsx`
   - Always React (Storybook's manager UI is always React, regardless of user framework).
   - Renders the performance panel with styled-components via `storybook/internal/components` and `storybook/internal/theming`.

### Decorator (`src/performance-decorator.ts`)

- **Framework-agnostic** — no React imports.
- Uses `useEffect` from `storybook/internal/preview-api` for lifecycle management.
- Observes `#storybook-root` (or `#storybook-preview-root` / `document.body` as fallback) for DOM element counting.
- Runs a `requestAnimationFrame` loop emitting `METRICS_UPDATE` every 50ms.
- `Story()` is called and returned directly (works across all frameworks).
- Types: uses local `AnyStoryFn` / `MinimalStoryContext` aliases to avoid importing Storybook internal types (reduces coupling / breakage risk).

### Collectors (`src/collectors/`)

All collectors are pure Web API / passive observers — no framework dependencies:

- `frame-timing-collector.ts` — rAF-based FPS and frame timing
- `input-collector.ts` — EventTiming API for INP/FID, plus a double-rAF pointer latency loop
- `main-thread-collector.ts` — PerformanceObserver for Long Tasks / TBT
- `long-animation-frame-collector.ts` — LoAF API (Chrome 123+)
- `layout-shift-collector.ts` — CLS via PerformanceObserver
- `memory-collector.ts` — `performance.memory` (Chrome only)
- `paint-collector.ts` — paint count, script eval time, compositor layers
- `style-mutation-collector.ts` — MutationObserver for DOM/style churn, thrashing detection
- `forced-reflow-collector.ts` — patches layout-trigger getters on `HTMLElement.prototype`; uses a static registry so multiple instances share the patch and restore it on the last `stop()`
- `element-timing-collector.ts` — MutationObserver for `data-profiler="name"` attribute tracking; deduplicates by name
- `collector-manager.ts` — owns one of each collector, wires `style.onLayoutDirty` → `reflow.markLayoutDirty`, drives sparkline history

### Channel Events (`src/performance-types.ts` → `PERF_EVENTS`)

- `METRICS_UPDATE` — preview → manager, all computed metrics
- `REQUEST_METRICS` — manager → preview, ask for immediate update
- `RESET` — manager → preview, reset all collectors
- `INSPECT_ELEMENT` — manager → preview, highlight element by CSS selector

### Performance Store (`src/performance-store.ts`)

- Module-level singleton used in the preview to hold the latest metrics.
- Framework-agnostic. Subscriber pattern (no React state).

## Build

```
bun run build              # one-off build (tsup)
bun run build:watch        # tsup in watch mode
bun run dev                # tsup --watch + React Storybook dev

# Per-framework test Storybooks (run after bun run build)
bun run storybook:react    # React on port 6006
bun run storybook:vue      # Vue 3 on port 6007
bun run storybook:angular  # Angular on port 6008

bun run build-storybook:react    # static build → storybook-static/react
bun run build-storybook:vue      # static build → storybook-static/vue
bun run build-storybook:angular  # static build → storybook-static/angular
```

The addon build produces three separate bundles (see `tsup.config.ts`):

- `dist/index.js` + `dist/preview.js` — preview entries
- `dist/manager.js` — manager panel UI
- `dist/preset.js` — Node.js preset that registers the manager entry

## Test Storybook Structure

```
tests/
  react/
    .storybook/main.ts      # @storybook/react-vite
    .storybook/preview.ts
    stories/Button.stories.tsx
  vue/
    .storybook/main.ts      # @storybook/vue3-vite
    .storybook/preview.ts
    stories/Button.stories.ts
  angular/
    .storybook/main.ts      # @storybook/angular
    .storybook/preview.ts
    stories/Button.stories.ts
    tsconfig.json           # extends root, adds experimentalDecorators
```

Each test instance loads the addon via `../../../dist/preset.js` and registers `withPerformanceMonitor` in its own preview.ts.

## Peer Dependencies

- `storybook` (any version 8+)
- `@storybook/icons` (for the panel reset button icon)
- React/`@storybook/react` are **devDependencies only** (used for the local dev storybook, not required by consumers)

## Supported Frameworks

react, vue3, angular, svelte, preact, html, web-components, solid

## Storybook 10 API Notes (upgraded from 8.x)

- `storybook/internal/manager-api` → **`storybook/manager-api`** (public path in v10)
- `storybook/internal/theming` → **`storybook/theming`** (public path in v10)
- `__definePreview` in `storybook/internal/csf` → **`definePreview`** (renamed in v10)
- `storybook/internal/preview-api` and `storybook/internal/components` still work unchanged

## Important Conventions

- The `.storybook/` config uses `@storybook/react-vite` — this is just for the **local dev environment**, not a requirement of the addon itself.
- `manager.tsx` uses React + `storybook/internal/components` styled components — this is intentional and correct (manager UI is always React).
- `preview.ts` casts `withPerformanceMonitor as any` in its `decorators` array because the decorator is intentionally renderer-agnostic and Storybook's `DecoratorFunction` is generic over the framework renderer.
- `src/index.ts` wraps the preview default export in `definePreview(...)` from `storybook/internal/csf` so it can be consumed via the public package entry. The actual auto-injection still goes through `previewAnnotations` in `src/preset.ts` pointing at `dist/preview.js`.
- Avoid importing Storybook internal types in the preview code to reduce breakage across Storybook versions.
- Number formatting goes through `src/panel/formatters.ts` (Intl-backed). `formatMb` and `formatMs` already include the unit suffix — do not append `MB`/`ms` manually at the call site.
