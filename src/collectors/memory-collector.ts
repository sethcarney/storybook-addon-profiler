import type { MemoryMetrics, MetricCollector } from './types'
import { SPARKLINE_HISTORY_SIZE } from './constants'
import { addToWindow, getMemoryMB } from './utils'

export class MemoryCollector implements MetricCollector<MemoryMetrics> {
  #baselineMemoryMB: number | null = null
  #peakMemoryMB: number | null = null
  #lastMemoryMB: number | null = null
  #memoryHistory: number[] = []
  #gcPressure = 0
  #lastGcCheckTime = 0
  #lastGcMemory: number | null = null

  start(): void {
    const memory = getMemoryMB()
    this.#baselineMemoryMB = memory
    this.#peakMemoryMB = memory
    this.#lastMemoryMB = memory
    this.#lastGcCheckTime = performance.now()
    this.#lastGcMemory = memory
  }

  stop(): void {
    // Nothing to clean up
  }

  reset(): void {
    const memory = getMemoryMB()
    this.#baselineMemoryMB = memory
    this.#peakMemoryMB = memory
    this.#lastMemoryMB = memory
    this.#memoryHistory = []
    this.#gcPressure = 0
    this.#lastGcCheckTime = performance.now()
    this.#lastGcMemory = memory
  }

  update(): void {
    const memory = getMemoryMB()
    if (memory === null) return

    this.#lastMemoryMB = memory
    if (this.#baselineMemoryMB === null) this.#baselineMemoryMB = memory
    if (this.#peakMemoryMB === null || memory > this.#peakMemoryMB) {
      this.#peakMemoryMB = memory
    }
    addToWindow(this.#memoryHistory, memory, SPARKLINE_HISTORY_SIZE)
    this.#updateGcPressure()
  }

  getMetrics(): MemoryMetrics {
    return {
      baselineMemoryMB: this.#baselineMemoryMB,
      peakMemoryMB: this.#peakMemoryMB,
      lastMemoryMB: this.#lastMemoryMB,
      memoryHistory: [...this.#memoryHistory],
      gcPressure: this.#gcPressure,
    }
  }

  #updateGcPressure(): void {
    const now = performance.now()
    const currentMemory = getMemoryMB()
    if (currentMemory !== null && this.#lastGcMemory !== null) {
      const timeDelta = (now - this.#lastGcCheckTime) / 1000
      if (timeDelta > 0) {
        const memoryDelta = currentMemory - this.#lastGcMemory
        if (memoryDelta > 0) {
          this.#gcPressure = memoryDelta / timeDelta
        } else {
          this.#gcPressure *= 0.9
        }
      }
    }
    this.#lastGcCheckTime = now
    this.#lastGcMemory = currentMemory
  }
}
