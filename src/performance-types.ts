import type { InteractionInfo, LoafDetails } from './collectors/types'

export const ADDON_ID = 'storybook-addon-profiler'
export const PANEL_ID = `${ADDON_ID}/panel`

export const PERF_EVENTS = {
  /** Decorator -> Panel: New metrics available */
  METRICS_UPDATE: `${ADDON_ID}/metrics-update`,
  /** Panel -> Decorator: Reset all metrics to baseline */
  RESET: `${ADDON_ID}/reset`,
  /** Panel -> Decorator: Request immediate metrics update */
  REQUEST_METRICS: `${ADDON_ID}/request-metrics`,
  /** Panel -> Decorator: Highlight/inspect an element by selector */
  INSPECT_ELEMENT: `${ADDON_ID}/inspect-element`,
  /** Decorator -> Panel: Profiler metrics updated (per-profiler) */
  PROFILER_UPDATE: `${ADDON_ID}/profiler-update`,
} as const

export const THRESHOLDS = {
  FPS_GOOD: 55,
  FPS_WARNING: 30,
  FRAME_TIME_TARGET: 16.67,
  FRAME_TIME_WARNING: 32,
  DROPPED_FRAMES_WARNING: 10,
  INPUT_LATENCY_GOOD: 16,
  INPUT_LATENCY_WARNING: 50,
  INP_GOOD: 200,
  INP_WARNING: 500,
  LONG_TASKS_WARNING: 5,
  TBT_WARNING: 200,
  LOAF_COUNT_WARNING: 5,
  LOAF_DURATION_WARNING: 100,
  LOAF_BLOCKING_WARNING: 200,
  CLS_GOOD: 0.1,
  CLS_WARNING: 0.25,
  FORCED_REFLOW_WARNING: 5,
  DOM_MUTATIONS_WARNING: 50,
  CASCADE_WARNING: 3,
  SLOW_UPDATES_WARNING: 3,
  REACT_P95_WARNING: 8,
  MEMORY_DELTA_WARNING: 5,
  MEMORY_DELTA_DANGER: 20,
  GC_PRESSURE_WARNING: 1,
  LAYERS_WARNING: 20,
} as const

export interface ElementTimingDisplay {
  identifier: string
  renderTime: number
  selector: string
}

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  maxFrameTime: number
  droppedFrames: number
  frameJitter: number
  frameStability: number
  inputLatency: number
  maxInputLatency: number
  inputJitter: number
  eventTimingSupported: boolean
  interactionCount: number
  inpMs: number
  firstInputDelay: number | null
  firstInputType: string | null
  lastInteraction: InteractionInfo | null
  slowestInteraction: InteractionInfo | null
  interactionsByType: Record<string, number>
  paintTime: number
  maxPaintTime: number
  paintCount: number
  paintJitter: number
  memoryUsedMB: number | null
  memoryDeltaMB: number | null
  peakMemoryMB: number | null
  gcPressure: number
  fpsHistory: number[]
  frameTimeHistory: number[]
  memoryHistory: number[]
  longTasks: number
  longestTask: number
  totalBlockingTime: number
  loafSupported: boolean
  loafCount: number
  totalLoafBlockingDuration: number
  longestLoafDuration: number
  longestLoafBlockingDuration: number
  avgLoafDuration: number
  p95LoafDuration: number
  loafsWithScripts: number
  lastLoaf: LoafDetails | null
  worstLoaf: LoafDetails | null
  styleWrites: number
  thrashingScore: number
  layoutShiftScore: number
  layoutShiftCount: number
  currentSessionCLS: number
  forcedReflowCount: number
  domMutationsPerFrame: number
  cssVarChanges: number
  reactRenderCount: number
  reactMountCount: number
  reactMountDuration: number
  reactPostMountUpdateCount: number
  reactPostMountMaxDuration: number
  reactP95Duration: number
  slowReactUpdates: number
  renderCascades: number
  domElements: number | null
  scriptEvalTime: number
  eventListenerCount: number
  observerCount: number
  compositorLayers: number | null
  elementTimingSupported: boolean
  elementTimingCount: number
  largestElementRenderTime: number
  elementTimings: ElementTimingDisplay[]
}

export const DEFAULT_METRICS: PerformanceMetrics = {
  fps: 0,
  frameTime: 0,
  maxFrameTime: 0,
  droppedFrames: 0,
  frameJitter: 0,
  frameStability: 100,
  inputLatency: 0,
  maxInputLatency: 0,
  inputJitter: 0,
  eventTimingSupported: true,
  interactionCount: 0,
  inpMs: 0,
  firstInputDelay: null,
  firstInputType: null,
  lastInteraction: null,
  slowestInteraction: null,
  interactionsByType: {},
  paintTime: 0,
  maxPaintTime: 0,
  paintCount: 0,
  paintJitter: 0,
  memoryUsedMB: null,
  memoryDeltaMB: null,
  peakMemoryMB: null,
  gcPressure: 0,
  fpsHistory: [],
  frameTimeHistory: [],
  memoryHistory: [],
  longTasks: 0,
  longestTask: 0,
  totalBlockingTime: 0,
  loafSupported: true,
  loafCount: 0,
  totalLoafBlockingDuration: 0,
  longestLoafDuration: 0,
  longestLoafBlockingDuration: 0,
  avgLoafDuration: 0,
  p95LoafDuration: 0,
  loafsWithScripts: 0,
  lastLoaf: null,
  worstLoaf: null,
  styleWrites: 0,
  thrashingScore: 0,
  layoutShiftScore: 0,
  layoutShiftCount: 0,
  currentSessionCLS: 0,
  forcedReflowCount: 0,
  domMutationsPerFrame: 0,
  cssVarChanges: 0,
  reactRenderCount: 0,
  reactMountCount: 0,
  reactMountDuration: 0,
  reactPostMountUpdateCount: 0,
  reactPostMountMaxDuration: 0,
  reactP95Duration: 0,
  slowReactUpdates: 0,
  renderCascades: 0,
  domElements: null,
  scriptEvalTime: 0,
  eventListenerCount: 0,
  observerCount: 0,
  compositorLayers: null,
  elementTimingSupported: true,
  elementTimingCount: 0,
  largestElementRenderTime: 0,
  elementTimings: [],
}

export function getStatusVariant(
  value: number,
  good: number,
  warning: number,
  higherIsBetter = false,
): 'success' | 'warning' | 'error' {
  if (higherIsBetter) {
    if (value >= good) return 'success'
    if (value >= warning) return 'warning'
    return 'error'
  }
  if (value <= good) return 'success'
  if (value <= warning) return 'warning'
  return 'error'
}

export function getZeroIsGoodStatus(value: number): 'success' | 'error' {
  return value === 0 ? 'success' : 'error'
}
