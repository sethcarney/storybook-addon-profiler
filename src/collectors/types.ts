export interface MetricCollector<T> {
  start(): void
  stop(): void
  reset(): void
  getMetrics(): T
}

export interface FrameTimingMetrics {
  frameTimes: number[]
  maxFrameTime: number
  droppedFrames: number
  frameJitter: number
  frameStability: number
}

export interface InputMetrics {
  inputLatencies: number[]
  maxInputLatency: number
  inputJitter: number
  paintTimes: number[]
  maxPaintTime: number
  paintJitter: number
  eventTimingSupported: boolean
  interactionCount: number
  interactionLatencies: number[]
  inpMs: number
  avgInputDelay: number
  avgProcessingTime: number
  avgPresentationDelay: number
  firstInputDelay: number | null
  firstInputType: string | null
  slowestInteraction: InteractionInfo | null
  lastInteraction: InteractionInfo | null
  interactionsByType: Record<string, number>
}

export interface InteractionInfo {
  duration: number
  eventType: string
  targetSelector: string
  inputDelay: number
  processingTime: number
  presentationDelay: number
}

export interface MainThreadMetrics {
  longTasks: number
  longestTask: number
  totalBlockingTime: number
}

export interface LoafMetrics {
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
}

export interface LoafDetails {
  duration: number
  blockingDuration: number
  renderStart: number
  styleAndLayoutStart: number
  scriptCount: number
  topScript: LoafScript | null
}

export interface LoafScript {
  sourceURL: string
  sourceFunctionName: string
  sourceCharPosition: number
  invokerType: string
  invoker: string
  executionStart: number
  duration: number
}

export interface LayoutShiftMetrics {
  layoutShiftScore: number
  layoutShiftCount: number
  currentSessionScore: number
  sessionCount: number
}

export interface MemoryMetrics {
  baselineMemoryMB: number | null
  peakMemoryMB: number | null
  lastMemoryMB: number | null
  memoryHistory: number[]
  gcPressure: number
}

export interface PaintMetrics {
  paintCount: number
  scriptEvalTime: number
  compositorLayers: number | null
}

export interface StyleMutationMetrics {
  styleWrites: number
  cssVarChanges: number
  domMutationFrames: number[]
  thrashingScore: number
}

export interface ForcedReflowMetrics {
  forcedReflowCount: number
}

export interface ElementTimingRecord {
  identifier: string
  renderTime: number
  loadTime: number
  selector: string
  tagName: string
  naturalWidth?: number
  naturalHeight?: number
  url?: string
}

export interface ElementTimingMetrics {
  elementTimingSupported: boolean
  elements: ElementTimingRecord[]
  largestRenderTime: number
  elementCount: number
}
