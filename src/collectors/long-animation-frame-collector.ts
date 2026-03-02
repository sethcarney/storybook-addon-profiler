import type { LoafDetails, LoafMetrics, LoafScript, MetricCollector } from "./types"
import { addToWindow, computeAverage, computeP95 } from "./utils"

const LOAF_HISTORY_WINDOW = 50

interface LoafEntry extends PerformanceEntry {
  blockingDuration: number
  renderStart: number
  styleAndLayoutStart: number
  scripts: LoafScriptEntry[]
}

interface LoafScriptEntry {
  sourceURL: string
  sourceFunctionName: string
  sourceCharPosition: number
  invokerType: string
  invoker: string
  executionStart: number
  duration: number
}

export class LongAnimationFrameCollector implements MetricCollector<LoafMetrics> {
  #loafSupported: boolean
  #loafCount = 0
  #totalBlockingDuration = 0
  #longestLoafDuration = 0
  #longestLoafBlockingDuration = 0
  #loafDurations: number[] = []
  #loafsWithScripts = 0
  #lastLoaf: LoafDetails | null = null
  #worstLoaf: LoafDetails | null = null
  #observer: PerformanceObserver | null = null

  constructor() {
    this.#loafSupported = this.#checkSupport()
  }

  #checkSupport(): boolean {
    try {
      return PerformanceObserver.supportedEntryTypes?.includes("long-animation-frame") ?? false
    } catch {
      return false
    }
  }

  start(): void {
    if (!this.#loafSupported) return
    try {
      this.#observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.#processEntry(entry as LoafEntry)
        }
      })
      this.#observer.observe({ type: "long-animation-frame", buffered: true })
    } catch {
      this.#loafSupported = false
    }
  }

  #processEntry(entry: LoafEntry): void {
    this.#loafCount++
    this.#totalBlockingDuration += entry.blockingDuration
    addToWindow(this.#loafDurations, entry.duration, LOAF_HISTORY_WINDOW)

    const hasScripts = entry.scripts && entry.scripts.length > 0
    if (hasScripts) {
      this.#loafsWithScripts++
    }

    let topScript: LoafScript | null = null
    if (hasScripts) {
      const sortedScripts = [...entry.scripts].sort((a, b) => b.duration - a.duration)
      const top = sortedScripts[0]
      if (top) {
        topScript = {
          sourceURL: top.sourceURL || "unknown",
          sourceFunctionName: top.sourceFunctionName || "anonymous",
          sourceCharPosition: top.sourceCharPosition,
          invokerType: top.invokerType,
          invoker: top.invoker || "unknown",
          executionStart: top.executionStart,
          duration: top.duration
        }
      }
    }

    const frameDetails: LoafDetails = {
      duration: entry.duration,
      blockingDuration: entry.blockingDuration,
      renderStart: entry.renderStart,
      styleAndLayoutStart: entry.styleAndLayoutStart,
      scriptCount: entry.scripts?.length ?? 0,
      topScript
    }

    this.#lastLoaf = frameDetails
    if (entry.duration > this.#longestLoafDuration) {
      this.#longestLoafDuration = entry.duration
      this.#longestLoafBlockingDuration = entry.blockingDuration
      this.#worstLoaf = frameDetails
    }
  }

  stop(): void {
    this.#observer?.disconnect()
    this.#observer = null
  }

  reset(): void {
    this.#loafCount = 0
    this.#totalBlockingDuration = 0
    this.#longestLoafDuration = 0
    this.#longestLoafBlockingDuration = 0
    this.#loafDurations = []
    this.#loafsWithScripts = 0
    this.#lastLoaf = null
    this.#worstLoaf = null
  }

  getMetrics(): LoafMetrics {
    return {
      loafSupported: this.#loafSupported,
      loafCount: this.#loafCount,
      totalLoafBlockingDuration: Math.round(this.#totalBlockingDuration),
      longestLoafDuration: Math.round(this.#longestLoafDuration),
      longestLoafBlockingDuration: Math.round(this.#longestLoafBlockingDuration),
      avgLoafDuration: Math.round(computeAverage(this.#loafDurations)),
      p95LoafDuration: Math.round(computeP95(this.#loafDurations)),
      loafsWithScripts: this.#loafsWithScripts,
      lastLoaf: this.#lastLoaf,
      worstLoaf: this.#worstLoaf
    }
  }
}
