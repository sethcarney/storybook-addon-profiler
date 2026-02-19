import type { ReactProfilerMetrics } from './collectors/types'
import type { PerformanceMetrics } from './performance-types'
import { DEFAULT_METRICS } from './performance-types'

export interface ProfilerEntry extends ReactProfilerMetrics {
  id: string
  lastUpdated: number
}

export interface StoreSnapshot {
  globalMetrics: PerformanceMetrics
  profilers: Map<string, ProfilerEntry>
  selectedProfilerId: string | null
  hasProfilers: boolean
}

export function createPerformanceStore() {
  let globalMetrics: PerformanceMetrics = { ...DEFAULT_METRICS }
  const profilers = new Map<string, ProfilerEntry>()
  let selectedProfilerId: string | null = null
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

    getSnapshot(): StoreSnapshot {
      return {
        globalMetrics,
        profilers: new Map(profilers),
        selectedProfilerId,
        hasProfilers: profilers.size > 0,
      }
    },

    getServerSnapshot(): StoreSnapshot {
      return this.getSnapshot()
    },

    setGlobalMetrics(metrics: PerformanceMetrics): void {
      globalMetrics = metrics
      notifySubscribers()
    },

    getGlobalMetrics(): PerformanceMetrics {
      return globalMetrics
    },

    resetGlobalMetrics(): void {
      globalMetrics = { ...DEFAULT_METRICS }
      notifySubscribers()
    },

    updateProfiler(id: string, metrics: ReactProfilerMetrics): void {
      profilers.set(id, {
        ...metrics,
        id,
        lastUpdated: performance.now(),
      })
      notifySubscribers()
    },

    removeProfiler(id: string): void {
      if (profilers.has(id)) {
        profilers.delete(id)
        if (selectedProfilerId === id) {
          selectedProfilerId = null
        }
        notifySubscribers()
      }
    },

    getProfilerMetrics(id: string): ProfilerEntry | undefined {
      return profilers.get(id)
    },

    getProfilerIds(): string[] {
      return Array.from(profilers.keys())
    },

    resetProfilers(): void {
      for (const [id, metrics] of profilers) {
        profilers.set(id, {
          ...metrics,
          reactRenderCount: 0,
          reactPostMountUpdateCount: 0,
          reactPostMountMaxDuration: 0,
          nestedUpdateCount: 0,
          slowReactUpdates: 0,
          reactUpdateDurations: [],
          lastUpdated: performance.now(),
        })
      }
      notifySubscribers()
    },

    clearProfilers(): void {
      profilers.clear()
      selectedProfilerId = null
      notifySubscribers()
    },

    setSelectedProfiler(id: string | null): void {
      if (id !== selectedProfilerId) {
        selectedProfilerId = id
        notifySubscribers()
      }
    },

    getSelectedProfiler(): string | null {
      return selectedProfilerId
    },

    getAggregatedReactMetrics(): ReactProfilerMetrics {
      if (profilers.size === 0) {
        return {
          reactRenderCount: 0,
          reactMountCount: 0,
          reactMountDuration: 0,
          reactPostMountUpdateCount: 0,
          reactPostMountMaxDuration: 0,
          nestedUpdateCount: 0,
          slowReactUpdates: 0,
          reactUpdateDurations: [],
          totalBaseDuration: 0,
          maxCommitLag: 0,
          commitLagHistory: [],
          memoizationEfficiency: 1,
          totalActualDuration: 0,
        }
      }

      let renderCount = 0
      let mountCount = 0
      let mountDuration = 0
      let updateCount = 0
      let maxDuration = 0
      let nestedCount = 0
      let slowCount = 0
      let totalBase = 0
      let totalActual = 0
      let maxLag = 0
      const allDurations: number[] = []
      const allLags: number[] = []

      for (const metrics of profilers.values()) {
        renderCount += metrics.reactRenderCount
        mountCount += metrics.reactMountCount
        mountDuration += metrics.reactMountDuration
        updateCount += metrics.reactPostMountUpdateCount
        maxDuration = Math.max(maxDuration, metrics.reactPostMountMaxDuration)
        nestedCount += metrics.nestedUpdateCount
        slowCount += metrics.slowReactUpdates
        totalBase += metrics.totalBaseDuration
        totalActual += metrics.totalActualDuration
        maxLag = Math.max(maxLag, metrics.maxCommitLag)
        allDurations.push(...metrics.reactUpdateDurations)
        allLags.push(...metrics.commitLagHistory)
      }

      const memoizationEfficiency = totalBase > 0 ? totalActual / totalBase : 1

      return {
        reactRenderCount: renderCount,
        reactMountCount: mountCount,
        reactMountDuration: mountDuration,
        reactPostMountUpdateCount: updateCount,
        reactPostMountMaxDuration: maxDuration,
        nestedUpdateCount: nestedCount,
        slowReactUpdates: slowCount,
        reactUpdateDurations: allDurations.slice(-100),
        totalBaseDuration: totalBase,
        maxCommitLag: maxLag,
        commitLagHistory: allLags.slice(-100),
        memoizationEfficiency,
        totalActualDuration: totalActual,
      }
    },

    resetAll(): void {
      globalMetrics = { ...DEFAULT_METRICS }
      this.resetProfilers()
      notifySubscribers()
    },
  }
}

export const performanceStore = createPerformanceStore()
