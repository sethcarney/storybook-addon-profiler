import type { LayoutShiftMetrics, MetricCollector } from "./types"

const SESSION_GAP_MS = 1000
const SESSION_MAX_DURATION_MS = 5000

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean
  value: number
}

export class LayoutShiftCollector implements MetricCollector<LayoutShiftMetrics> {
  #maxSessionScore = 0
  #currentSessionScore = 0
  #sessionFirstEntryTime: number | null = null
  #sessionLastEntryTime: number | null = null
  #layoutShiftCount = 0
  #sessionCount = 0
  #observer: PerformanceObserver | null = null

  start(): void {
    try {
      this.#observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.#processEntry(entry as LayoutShiftEntry)
        }
      })
      this.#observer.observe({ type: "layout-shift", buffered: true })
    } catch {
      // Layout Instability API not supported
    }
  }

  #processEntry(entry: LayoutShiftEntry): void {
    if (entry.hadRecentInput) return
    this.#layoutShiftCount++

    const shouldStartNewSession =
      this.#sessionFirstEntryTime === null ||
      this.#sessionLastEntryTime === null ||
      entry.startTime - this.#sessionLastEntryTime >= SESSION_GAP_MS ||
      entry.startTime - this.#sessionFirstEntryTime >= SESSION_MAX_DURATION_MS

    if (shouldStartNewSession) {
      if (this.#currentSessionScore > 0) {
        this.#sessionCount++
        if (this.#currentSessionScore > this.#maxSessionScore) {
          this.#maxSessionScore = this.#currentSessionScore
        }
      }
      this.#currentSessionScore = entry.value
      this.#sessionFirstEntryTime = entry.startTime
    } else {
      this.#currentSessionScore += entry.value
    }
    this.#sessionLastEntryTime = entry.startTime

    if (this.#currentSessionScore > this.#maxSessionScore) {
      this.#maxSessionScore = this.#currentSessionScore
    }
  }

  stop(): void {
    this.#observer?.disconnect()
    this.#observer = null
  }

  reset(): void {
    this.#maxSessionScore = 0
    this.#currentSessionScore = 0
    this.#sessionFirstEntryTime = null
    this.#sessionLastEntryTime = null
    this.#layoutShiftCount = 0
    this.#sessionCount = 0
  }

  getMetrics(): LayoutShiftMetrics {
    return {
      layoutShiftScore: Math.round(this.#maxSessionScore * 1e4) / 1e4,
      layoutShiftCount: this.#layoutShiftCount,
      currentSessionScore: Math.round(this.#currentSessionScore * 1e4) / 1e4,
      sessionCount: this.#sessionCount
    }
  }
}
