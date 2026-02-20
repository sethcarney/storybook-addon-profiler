# storybook-performance-profiler

A Storybook addon that provides real-time performance monitoring for stories. It displays comprehensive metrics including frame timing, input responsiveness, memory usage, React profiling, and more.

This repository contains the implementation used by the addon (manager + preview + collectors).

## Quick install

Add the addon to your Storybook config (`.storybook/main.ts`):

```ts
// .storybook/main.ts
const config = {
  addons: [
    // ... other addons
    'storybook-performance-profiler',
  ],
}
```

The addon registers a bottom panel titled "⚡ Performance" and applies the `withPerformanceMonitor` decorator globally via the preset.

## Usage

- The addon is applied globally when included in `main.ts`.
- To manually apply to a specific story:

```tsx
import { withPerformanceMonitor } from 'storybook-performance-profiler/decorator'

export default {
  title: 'MyComponent',
  decorators: [withPerformanceMonitor],
}
```

- Use the panel to view live metrics, click the reset (sync) button to clear baselines, and use the Inspect button to highlight slow interaction targets.

## Architecture

- `preview` (decorator): `src/performance-decorator.tsx` — provides `PerformanceProvider`, collects metrics in the preview iframe, reports via Storybook channel events.
- `manager` (panel UI): `src/manager.tsx` — subscribes to metrics events, renders the UI sections and sparkline charts.
- `collectors`: `src/collectors/*` — modular collectors that gather metrics using the best available APIs.

High-level flow:

Preview (decorator) collects → emits `PERF_EVENTS.METRICS_UPDATE` → Manager (panel) consumes and renders.

## Metrics collected

The addon implements the metrics described below (see `src/performance-types.ts` and collector implementations in `src/collectors`):

- Frame Timing: FPS, average frame time, dropped frames, frame jitter, stability
- Input Responsiveness: pointer latency, paint time, INP (Event Timing API), FID, last/slowest interaction (with breakdown and Inspect)
- Main Thread: Long Tasks, Total Blocking Time (TBT), thrashing, DOM churn
- Long Animation Frames (LoAF) — Chrome 123+ detection and script attribution
- Element Timing: elements with `elementtiming` attribute, largest render time
- Layout Stability: CLS, forced reflows, style writes
- React Performance: mount counts/durations, slow updates, P95 durations, render cascades
- Memory & Resources (Chrome-only): heap usage, memory delta, GC pressure, compositor layers

## Collectors (examples)

See `src/collectors` for each collector. Notable implementations:

- `frame-timing-collector.ts` — RAF loop and heuristics for dropped frames
- `input-collector.ts` — Event Timing API + pointermove + double-RAF paint timing
- `main-thread-collector.ts` — Long Tasks API
- `long-animation-frame-collector.ts` — LoAF entries with script attribution
- `react-profiler-collector.ts` — aggregates React Profiler `onRender` reports
- `memory-collector.ts` — uses `performance.memory` when available
- `paint-collector.ts` — paint/resource observers and compositor-layer heuristic

## Exports / entry points

The codebase follows the standard Storybook addon entry layout in source form:

- Preset / manager / preview / types:
  - `src/preset.ts` — manager entries (preset)
  - `src/manager.tsx` — Manager panel UI
  - `src/preview.ts` — registers `withPerformanceMonitor` decorator
  - `src/performance-decorator.tsx` — decorator/provider/inspect helper
  - `src/performance-types.ts` — `PERF_EVENTS`, `THRESHOLDS`, `DEFAULT_METRICS`, types

If you publish, ensure your package exports map the manager/preview/preset files as Storybook expects.

## Browser compatibility

- Chrome/Edge: full feature set (including `performance.memory` and LoAF where supported)
- Firefox/Safari: many metrics available, but memory API and some EventTiming/LoAF features may be unavailable — collectors gracefully degrade.

## Development commands

Run the typical workspace scripts (adjust as needed for your monorepo layout):

```bash
# Build
bun run build

# Typecheck
npm run tsc

# Lint
npm run lint

# Run tests (if present)
npm test
```

## Files to review

- Performance decorator: [src/performance-decorator.tsx](src/performance-decorator.tsx)
- Panel UI: [src/manager.tsx](src/manager.tsx)
- Types and constants: [src/performance-types.ts](src/performance-types.ts)
- Collectors: [src/collectors](src/collectors)

## Notes before publishing

- Verify package `exports` in `package.json` expose `manager`, `preview`, and `preset` entry points expected by Storybook.
- Confirm `package.json` `files`/bundling includes compiled `manager.js` (or use the preset to point to source) depending on your publishing/bundling approach.
- Run a full build and TypeScript checks in CI before publishing.

---

If you want, I can:
- Run the build and typecheck locally now, or
- Add a `package.json` `exports` example and a lightweight `README` for npm publishing, or
- Create a short `publish` checklist/PR template for releasing the package.
