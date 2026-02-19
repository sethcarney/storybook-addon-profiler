import type { MetricCollector, ReactProfilerMetrics, RenderInfo } from './types'
import { addToWindow } from './utils'

const DEFAULT_REACT_METRICS: ReactProfilerMetrics = {
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

function createEmptyReactMetrics(): ReactProfilerMetrics {
  return { ...DEFAULT_REACT_METRICS, reactUpdateDurations: [], commitLagHistory: [] }
}

interface ProfilerState {
  metrics: ReactProfilerMetrics
  storyId: string
}

export class ReactProfilerCollector implements MetricCollector<ReactProfilerMetrics> {
  #profilers = new Map<string, ProfilerState>()
  #onProfilerUpdate?: (storyId: string, id: string, metrics: ReactProfilerMetrics) => void

  start(): void {
    // React Profiler is passive - no setup needed
  }

  stop(): void {
    // React Profiler is passive - no teardown needed
  }

  reset(): void {
    for (const [profilerId, state] of this.#profilers) {
      const profilerMountCount = state.metrics.reactMountCount
      const profilerMountDuration = state.metrics.reactMountDuration
      state.metrics = {
        ...createEmptyReactMetrics(),
        reactMountCount: profilerMountCount,
        reactMountDuration: profilerMountDuration,
      }
      this.#onProfilerUpdate?.(state.storyId, profilerId, state.metrics)
    }
  }

  setOnProfilerUpdate(
    callback: (storyId: string, id: string, metrics: ReactProfilerMetrics) => void,
  ): void {
    this.#onProfilerUpdate = callback
  }

  clearProfilers(): void {
    this.#profilers.clear()
  }

  clearProfilersExcept(keepStoryId: string): void {
    for (const [id, state] of this.#profilers) {
      if (state.storyId !== keepStoryId) {
        this.#profilers.delete(id)
      }
    }
  }

  getProfilerIds(): string[] {
    return Array.from(this.#profilers.keys())
  }

  getProfilerMetrics(id: string): ReactProfilerMetrics | undefined {
    return this.#profilers.get(id)?.metrics
  }

  reportRender = (info: RenderInfo): void => {
    const commitLag = Math.max(0, info.commitTime - info.startTime - info.actualDuration)
    let state = this.#profilers.get(info.profilerId)
    if (!state) {
      state = { metrics: createEmptyReactMetrics(), storyId: info.storyId }
      this.#profilers.set(info.profilerId, state)
    } else {
      state.storyId = info.storyId
    }
    this.#updateProfilerMetrics(state, info, commitLag)
    this.#onProfilerUpdate?.(info.storyId, info.profilerId, state.metrics)
  }

  #updateProfilerMetrics(state: ProfilerState, info: RenderInfo, commitLag: number): void {
    const { phase, actualDuration, baseDuration } = info
    const metrics = state.metrics

    if (phase === 'nested-update') {
      metrics.nestedUpdateCount++
    }

    metrics.reactRenderCount++
    metrics.totalBaseDuration += baseDuration
    metrics.totalActualDuration += actualDuration
    metrics.memoizationEfficiency =
      metrics.totalBaseDuration > 0
        ? metrics.totalActualDuration / metrics.totalBaseDuration
        : 1

    if (commitLag > metrics.maxCommitLag) {
      metrics.maxCommitLag = commitLag
    }
    addToWindow(metrics.commitLagHistory, commitLag, 100)

    if (phase === 'mount') {
      metrics.reactMountCount++
      metrics.reactMountDuration += actualDuration
    } else {
      metrics.reactPostMountUpdateCount++
      if (actualDuration > metrics.reactPostMountMaxDuration) {
        metrics.reactPostMountMaxDuration = actualDuration
      }
      if (actualDuration > 16) {
        metrics.slowReactUpdates++
      }
      addToWindow(metrics.reactUpdateDurations, actualDuration, 100)
    }
  }

  getMetrics(): ReactProfilerMetrics {
    if (this.#profilers.size === 0) {
      return createEmptyReactMetrics()
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

    for (const state of this.#profilers.values()) {
      const m = state.metrics
      renderCount += m.reactRenderCount
      mountCount += m.reactMountCount
      mountDuration += m.reactMountDuration
      updateCount += m.reactPostMountUpdateCount
      maxDuration = Math.max(maxDuration, m.reactPostMountMaxDuration)
      nestedCount += m.nestedUpdateCount
      slowCount += m.slowReactUpdates
      totalBase += m.totalBaseDuration
      totalActual += m.totalActualDuration
      maxLag = Math.max(maxLag, m.maxCommitLag)
      allDurations.push(...m.reactUpdateDurations)
      allLags.push(...m.commitLagHistory)
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
  }
}
