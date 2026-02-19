import type { MainThreadMetrics, MetricCollector } from './types'

export class MainThreadCollector implements MetricCollector<MainThreadMetrics> {
  #longTasks = 0
  #longestTask = 0
  #totalBlockingTime = 0
  #observer: PerformanceObserver | null = null

  start(): void {
    try {
      this.#observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.#longTasks++
          if (entry.duration > this.#longestTask) {
            this.#longestTask = entry.duration
          }
          this.#totalBlockingTime += Math.max(0, entry.duration - 50)
        }
      })
      this.#observer.observe({ type: 'longtask' })
    } catch {
      // Long Tasks API not supported
    }
  }

  stop(): void {
    this.#observer?.disconnect()
    this.#observer = null
  }

  reset(): void {
    this.#longTasks = 0
    this.#longestTask = 0
    this.#totalBlockingTime = 0
  }

  getMetrics(): MainThreadMetrics {
    return {
      longTasks: this.#longTasks,
      longestTask: this.#longestTask,
      totalBlockingTime: this.#totalBlockingTime,
    }
  }
}
