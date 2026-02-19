import type { InputMetrics, InteractionInfo, MetricCollector } from './types'
import {
  INTERACTION_LATENCIES_WINDOW,
  INPUT_LATENCIES_WINDOW,
  PAINT_TIMES_WINDOW,
  JITTER_BASELINE_SIZE,
  JITTER_MULTIPLIER,
  JITTER_INPUT_DELTA,
  JITTER_INPUT_ABSOLUTE,
  JITTER_PAINT_DELTA,
  JITTER_PAINT_ABSOLUTE,
  MAX_INPUT_DECAY_THRESHOLD,
  MAX_INPUT_DECAY_RATE,
  MAX_PAINT_DECAY_THRESHOLD,
  MAX_PAINT_DECAY_RATE,
} from './constants'
import { addToWindow, computeAverage, updateMaxWithDecay } from './utils'

interface PerformanceEventTimingEntry extends PerformanceEntry {
  interactionId: number
  processingStart: number
  processingEnd: number
  targetSelector?: string
}

interface PerformanceWithInteractionCount extends Performance {
  interactionCount?: number
}

export class InputCollector implements MetricCollector<InputMetrics> {
  #inputLatencies: number[] = []
  #maxInputLatency = 0
  #inputJitter = 0
  #recentInputLatencies: number[] = []

  #paintTimes: number[] = []
  #maxPaintTime = 0
  #paintJitter = 0
  #recentPaintTimes: number[] = []

  #interactionCount = 0
  #interactionLatencies: number[] = []
  #inpMs = 0

  #inputDelays: number[] = []
  #processingTimes: number[] = []
  #presentationDelays: number[] = []

  #interactionMap = new Map<number, number>()

  #firstInputDelay: number | null = null
  #firstInputType: string | null = null

  #slowestInteraction: InteractionInfo | null = null
  #lastInteraction: InteractionInfo | null = null

  #interactionsByType: Record<string, number> = {}

  #eventTimingObserver: PerformanceObserver | null = null
  #firstInputObserver: PerformanceObserver | null = null
  #eventTimingSupported: boolean
  #boundHandlePointerMove: (event: PointerEvent) => void

  constructor() {
    this.#boundHandlePointerMove = this.#handlePointerMove.bind(this)
    this.#eventTimingSupported = this.#checkEventTimingSupport()
  }

  #checkEventTimingSupport(): boolean {
    try {
      return PerformanceObserver.supportedEntryTypes?.includes('event') ?? false
    } catch {
      return false
    }
  }

  start(): void {
    window.addEventListener('pointermove', this.#boundHandlePointerMove)
    if (this.#eventTimingSupported) {
      this.#startEventTimingObserver()
    }
  }

  #startEventTimingObserver(): void {
    try {
      this.#eventTimingObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.#processEventTimingEntry(entry as PerformanceEventTimingEntry)
        }
      })
      this.#eventTimingObserver.observe({
        type: 'event',
        buffered: true,
        // @ts-expect-error durationThreshold is valid but not in all TS libs
        durationThreshold: 16,
      })

      this.#firstInputObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0 && this.#firstInputDelay === null) {
          const entry = entries[0] as PerformanceEventTimingEntry
          this.#firstInputDelay = entry.processingStart - entry.startTime
          this.#firstInputType = entry.name
        }
      })
      this.#firstInputObserver.observe({ type: 'first-input', buffered: true })
    } catch {
      this.#eventTimingSupported = false
    }
  }

  #processEventTimingEntry(entry: PerformanceEventTimingEntry): void {
    if (entry.interactionId === 0) return

    const duration = entry.duration
    const interactionId = entry.interactionId
    const eventType = entry.name

    this.#interactionsByType[eventType] = (this.#interactionsByType[eventType] ?? 0) + 1

    const inputDelay = entry.processingStart - entry.startTime
    const processingTime = entry.processingEnd - entry.processingStart
    const presentationDelay = Math.max(0, duration - inputDelay - processingTime)

    const interactionInfo: InteractionInfo = {
      duration,
      eventType,
      targetSelector: entry.targetSelector || 'unknown',
      inputDelay,
      processingTime,
      presentationDelay,
    }

    this.#lastInteraction = interactionInfo

    const existingDuration = this.#interactionMap.get(interactionId) ?? 0
    if (duration > existingDuration) {
      this.#interactionMap.set(interactionId, duration)
      if (!this.#slowestInteraction || duration > this.#slowestInteraction.duration) {
        this.#slowestInteraction = interactionInfo
      }
    }

    addToWindow(this.#inputDelays, inputDelay, INTERACTION_LATENCIES_WINDOW)
    addToWindow(this.#processingTimes, processingTime, INTERACTION_LATENCIES_WINDOW)
    addToWindow(this.#presentationDelays, presentationDelay, INTERACTION_LATENCIES_WINDOW)

    const perfWithEventTiming = performance as PerformanceWithInteractionCount
    this.#interactionCount = perfWithEventTiming.interactionCount ?? this.#interactionMap.size

    addToWindow(this.#interactionLatencies, duration, INTERACTION_LATENCIES_WINDOW)
    this.#updateInp()
  }

  #updateInp(): void {
    const interactions = Array.from(this.#interactionMap.values())
    if (interactions.length === 0) {
      this.#inpMs = 0
      return
    }
    interactions.sort((a, b) => b - a)
    const count = interactions.length
    if (count < 50) {
      this.#inpMs = interactions[0] ?? 0
    } else {
      const p98Index = Math.floor(count * 0.02)
      this.#inpMs = interactions[p98Index] ?? 0
    }
  }

  stop(): void {
    window.removeEventListener('pointermove', this.#boundHandlePointerMove)
    this.#eventTimingObserver?.disconnect()
    this.#firstInputObserver?.disconnect()
    this.#eventTimingObserver = null
    this.#firstInputObserver = null
  }

  reset(): void {
    this.#inputLatencies = []
    this.#maxInputLatency = 0
    this.#inputJitter = 0
    this.#recentInputLatencies = []
    this.#paintTimes = []
    this.#maxPaintTime = 0
    this.#paintJitter = 0
    this.#recentPaintTimes = []
    this.#interactionCount = 0
    this.#interactionLatencies = []
    this.#inpMs = 0
    this.#inputDelays = []
    this.#processingTimes = []
    this.#presentationDelays = []
    this.#interactionMap.clear()
    this.#firstInputDelay = null
    this.#firstInputType = null
    this.#slowestInteraction = null
    this.#lastInteraction = null
    this.#interactionsByType = {}
  }

  getMetrics(): InputMetrics {
    return {
      inputLatencies: [...this.#inputLatencies],
      maxInputLatency: this.#maxInputLatency,
      inputJitter: this.#inputJitter,
      paintTimes: [...this.#paintTimes],
      maxPaintTime: this.#maxPaintTime,
      paintJitter: this.#paintJitter,
      eventTimingSupported: this.#eventTimingSupported,
      interactionCount: this.#interactionCount,
      interactionLatencies: [...this.#interactionLatencies],
      inpMs: this.#inpMs,
      avgInputDelay: computeAverage(this.#inputDelays),
      avgProcessingTime: computeAverage(this.#processingTimes),
      avgPresentationDelay: computeAverage(this.#presentationDelays),
      firstInputDelay: this.#firstInputDelay,
      firstInputType: this.#firstInputType,
      slowestInteraction: this.#slowestInteraction,
      lastInteraction: this.#lastInteraction,
      interactionsByType: { ...this.#interactionsByType },
    }
  }

  #handlePointerMove(event: PointerEvent): void {
    const eventTime = event.timeStamp
    requestAnimationFrame(() => {
      const rafTime = performance.now()
      const latency = rafTime - eventTime
      this.#processInput(latency)
      requestAnimationFrame(() => {
        const paintEnd = performance.now()
        const paintTime = paintEnd - rafTime
        this.#processPaint(paintTime)
      })
    })
  }

  #processInput(latency: number): void {
    addToWindow(this.#inputLatencies, latency, INPUT_LATENCIES_WINDOW)
    this.#maxInputLatency = updateMaxWithDecay(
      this.#maxInputLatency,
      latency,
      MAX_INPUT_DECAY_THRESHOLD,
      MAX_INPUT_DECAY_RATE,
    )
    this.#recentInputLatencies.push(latency)
    if (this.#recentInputLatencies.length > 10) this.#recentInputLatencies.shift()
    if (this.#recentInputLatencies.length >= JITTER_BASELINE_SIZE) {
      const baseline = this.#recentInputLatencies.slice(0, -1)
      const avgBaseline = computeAverage(baseline)
      if (
        latency > avgBaseline * JITTER_MULTIPLIER &&
        latency - avgBaseline > JITTER_INPUT_DELTA &&
        latency > JITTER_INPUT_ABSOLUTE
      ) {
        this.#inputJitter++
      }
    }
  }

  #processPaint(paintTime: number): void {
    addToWindow(this.#paintTimes, paintTime, PAINT_TIMES_WINDOW)
    this.#maxPaintTime = updateMaxWithDecay(
      this.#maxPaintTime,
      paintTime,
      MAX_PAINT_DECAY_THRESHOLD,
      MAX_PAINT_DECAY_RATE,
    )
    this.#recentPaintTimes.push(paintTime)
    if (this.#recentPaintTimes.length > 10) this.#recentPaintTimes.shift()
    if (this.#recentPaintTimes.length >= JITTER_BASELINE_SIZE) {
      const baseline = this.#recentPaintTimes.slice(0, -1)
      const avgBaseline = computeAverage(baseline)
      if (
        paintTime > avgBaseline * JITTER_MULTIPLIER &&
        paintTime - avgBaseline > JITTER_PAINT_DELTA &&
        paintTime > JITTER_PAINT_ABSOLUTE
      ) {
        this.#paintJitter++
      }
    }
  }
}
