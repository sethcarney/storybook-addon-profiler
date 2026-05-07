import { describe, it, expect, vi } from "vitest"
import { createPerformanceStore } from "../performance-store"
import { DEFAULT_METRICS } from "../performance-types"

describe("createPerformanceStore", () => {
  it("initializes with DEFAULT_METRICS", () => {
    const store = createPerformanceStore()
    expect(store.getGlobalMetrics()).toEqual(DEFAULT_METRICS)
  })

  it("updates metrics and returns the new value", () => {
    const store = createPerformanceStore()
    const updated = { ...DEFAULT_METRICS, fps: 60 }
    store.setGlobalMetrics(updated)
    expect(store.getGlobalMetrics().fps).toBe(60)
  })

  it("notifies subscribers when metrics change", () => {
    const store = createPerformanceStore()
    const cb = vi.fn()
    store.subscribe(cb)
    store.setGlobalMetrics({ ...DEFAULT_METRICS, fps: 30 })
    expect(cb).toHaveBeenCalledOnce()
  })

  it("notifies all subscribers", () => {
    const store = createPerformanceStore()
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    store.subscribe(cb1)
    store.subscribe(cb2)
    store.setGlobalMetrics({ ...DEFAULT_METRICS, fps: 30 })
    expect(cb1).toHaveBeenCalledOnce()
    expect(cb2).toHaveBeenCalledOnce()
  })

  it("stops notifying after unsubscribe", () => {
    const store = createPerformanceStore()
    const cb = vi.fn()
    const unsubscribe = store.subscribe(cb)
    unsubscribe()
    store.setGlobalMetrics({ ...DEFAULT_METRICS, fps: 30 })
    expect(cb).not.toHaveBeenCalled()
  })

  it("resets metrics to DEFAULT_METRICS", () => {
    const store = createPerformanceStore()
    store.setGlobalMetrics({ ...DEFAULT_METRICS, fps: 60, longTasks: 5 })
    store.resetAll()
    expect(store.getGlobalMetrics()).toEqual(DEFAULT_METRICS)
  })

  it("notifies subscribers on reset", () => {
    const store = createPerformanceStore()
    const cb = vi.fn()
    store.subscribe(cb)
    store.resetAll()
    expect(cb).toHaveBeenCalledOnce()
  })

  it("reset creates a new object, not the shared DEFAULT_METRICS reference", () => {
    const store = createPerformanceStore()
    store.resetAll()
    expect(store.getGlobalMetrics()).not.toBe(DEFAULT_METRICS)
  })
})
