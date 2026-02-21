# Architecture

## Overview

The addon runs in two separate browser contexts that communicate through Storybook's built-in channel:

```
┌─────────────────────────────────────┐      channel       ┌──────────────────────────────┐
│  Preview iframe                     │ ──METRICS_UPDATE──▶ │  Manager (Storybook shell)   │
│                                     │ ◀──RESET──────────── │                              │
│  withPerformanceMonitor decorator   │ ◀──REQUEST_METRICS── │  ⚡ Performance panel        │
│  CollectorManager (10 collectors)   │ ◀──INSPECT_ELEMENT── │  React UI + sparklines       │
│  rAF emit loop (50 ms)              │                      │                              │
└─────────────────────────────────────┘                      └──────────────────────────────┘
```

---

## Preview context

Entry: `src/preview.ts` → `src/performance-decorator.ts`

The `withPerformanceMonitor` decorator is framework-agnostic. It uses `useEffect` from `storybook/internal/preview-api` (not React) so it works identically across all frameworks.

### Lifecycle

1. Story mounts → decorator `useEffect` fires
2. `CollectorManager.start()` activates all collectors
3. A `MutationObserver` watches `#storybook-root` (or fallback) for DOM node count
4. A `requestAnimationFrame` loop runs until cleanup:
   - Every **50 ms** → `computeMetrics()` → emit `METRICS_UPDATE`
   - Every **200 ms** → `updateSparklineData()` (memory, FPS history, compositor layers)
5. Story unmounts or navigates → collectors stop, observers disconnect, rAF loop cancels

### Inbound channel events

| Event | Action |
|---|---|
| `REQUEST_METRICS` | Emit the current metrics snapshot immediately |
| `RESET` | Reset all collectors to zero, clear baseline |
| `INSPECT_ELEMENT(selector)` | Flash-highlight the matching DOM element (600 ms outline animation) |

---

## Collector system

Each collector in `src/collectors/` is an independent class with a `start()`, `stop()`, and `reset()` method plus a `getMetrics()` snapshot. `CollectorManager` owns all instances and wires them together at decorator startup.

| Collector | API used | Key outputs |
|---|---|---|
| `FrameTimingCollector` | `requestAnimationFrame` | FPS, frame time, dropped frames, jitter, stability |
| `InputCollector` | `EventTiming`, `PointerEvent`, double-rAF | INP, FID, pointer latency, paint time, per-interaction breakdown |
| `MainThreadCollector` | `PerformanceObserver('longtask')` | Long Tasks, TBT |
| `LongAnimationFrameCollector` | `PerformanceObserver('long-animation-frame')` | LoAF count, blocking duration, P95, top script *(Chrome 123+)* |
| `LayoutShiftCollector` | `PerformanceObserver('layout-shift')` | CLS, shift count, session score |
| `MemoryCollector` | `performance.memory` (200 ms poll) | Heap used, delta, GC pressure *(Chrome only)* |
| `PaintCollector` | `PerformanceObserver('paint'/'resource')` | Paint count, script eval time, compositor layers |
| `StyleMutationCollector` | `MutationObserver` | Style writes, CSS var mutations, DOM churn, thrashing score |
| `ForcedReflowCollector` | Property getter interception | Forced sync layout count |
| `ElementTimingCollector` | `PerformanceObserver('element')` | Per-element render times *(Chromium only)* |

Collectors that rely on unavailable APIs degrade silently — they check for API presence in `start()` and no-op if absent.

---

## Manager context

Entry: `src/manager.tsx` registers the panel via `addons.add()`.

### Component tree

```
PerformancePanel
└── PanelContent               (no-decorator / error / loading states)
    └── ConnectedPanelContent  (channel wiring, reducer state)
        ├── FrameTimingSection
        ├── InputSection
        ├── MainThreadSection
        ├── LoAFSection
        ├── LayoutAndInternalsSection
        └── MemoryAndRenderingSection
```

All components live under `src/components/`. Each section is collapsible and renders `<Metric>` rows with optional `<Sparkline>` charts and `<StatusBadge>` color indicators.

### State machine

The panel uses a simple reducer with these states:

| State | Condition |
|---|---|
| `loading` | Story rendered, waiting up to 500 ms for first `METRICS_UPDATE` |
| `connected` | Receiving metrics normally |
| `no-decorator` | 500 ms elapsed with no metrics (decorator not active) |
| `error` | Story threw an exception |

### Channel subscriptions

| Event | Handler |
|---|---|
| `METRICS_UPDATE` | Dispatch `METRICS_RECEIVED` → re-render panel sections |
| `storyRendered` | Emit `REQUEST_METRICS` to get an immediate snapshot |
| `storyArgsUpdated` | Emit `RESET` (args changed = new baseline) |
| `storyErrored` / `storyThrewException` | Dispatch error state |

---

## Preset & auto-injection

`src/preset.ts` exports two Storybook hooks:

- **`managerEntries`** — appends `dist/manager.js` so the panel is always registered
- **`previewAnnotations`** — appends `dist/preview.js` so the decorator runs in every story iframe

Both hooks simply prepend the compiled dist files to whatever entry arrays Storybook already has. The preset is loaded at startup via the `addons` array in `main.ts`. No manual `decorators` registration is needed and there is no framework-specific branching — the same files load for every framework.

---

## Build

Three tsup bundles are produced:

| Output | Entry | Notes |
|---|---|---|
| `dist/index.js` + `dist/preview.js` | `src/index.ts`, `src/preview.ts` | Preview-side code, no React |
| `dist/manager.js` | `src/manager.tsx` | Manager UI, React externalized |
| `dist/preset.js` | `src/preset.ts` | Node.js preset, no bundled deps |

All bundles are ESM. Storybook peer deps and React are externalized to avoid version conflicts with the host project.
