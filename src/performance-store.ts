import type { PerformanceMetrics } from './performance-types'
import { DEFAULT_METRICS } from './performance-types'

export function createPerformanceStore() {
  let globalMetrics: PerformanceMetrics = { ...DEFAULT_METRICS }
  const subscribers = new Set<() => void>()

  const notifySubscribers = () => {
    for (const callback of subscribers) {
      callback()
    }
  }

  return {
    subscribe(callback: () => void): () => void {
      subscribers.add(callback)
      return () => {
        subscribers.delete(callback)
      }
    },

    setGlobalMetrics(metrics: PerformanceMetrics): void {
      globalMetrics = metrics
      notifySubscribers()
    },

    getGlobalMetrics(): PerformanceMetrics {
      return globalMetrics
    },

    resetAll(): void {
      globalMetrics = { ...DEFAULT_METRICS }
      notifySubscribers()
    },
  }
}

export const performanceStore = createPerformanceStore()
