import type { MetricCollector, PaintMetrics } from "./types"

export class PaintCollector implements MetricCollector<PaintMetrics> {
  #paintCount = 0
  #scriptEvalTime = 0
  #compositorLayers: number | null = null
  #lastLayerCheckTime = 0
  static #LAYER_CHECK_INTERVAL = 3000

  #paintObserver: PerformanceObserver | null = null
  #resourceObserver: PerformanceObserver | null = null

  start(): void {
    try {
      this.#paintObserver = new PerformanceObserver((list) => {
        this.#paintCount += list.getEntries().length
      })
      this.#paintObserver.observe({ type: "paint", buffered: true })
    } catch {
      // Paint Timing API not supported
    }

    try {
      this.#resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "resource") {
            const resourceEntry = entry as PerformanceResourceTiming
            if (resourceEntry.initiatorType === "script") {
              const scriptTime = resourceEntry.responseEnd - resourceEntry.fetchStart
              if (scriptTime > 0) {
                this.#scriptEvalTime += scriptTime
              }
            }
          }
        }
      })
      this.#resourceObserver.observe({ type: "resource", buffered: true })
    } catch {
      // Resource Timing API not supported
    }
  }

  stop(): void {
    this.#paintObserver?.disconnect()
    this.#resourceObserver?.disconnect()
    this.#paintObserver = null
    this.#resourceObserver = null
  }

  reset(): void {
    this.#paintCount = 0
    this.#scriptEvalTime = 0
    this.#lastLayerCheckTime = 0
  }

  updateCompositorLayers(): void {
    const now = performance.now()
    if (this.#compositorLayers !== null && now - this.#lastLayerCheckTime < PaintCollector.#LAYER_CHECK_INTERVAL) {
      return
    }
    this.#lastLayerCheckTime = now

    let layerCount = 0
    const allElements = document.querySelectorAll("*")
    for (const el of allElements) {
      const style = getComputedStyle(el)
      if (style.willChange && style.willChange !== "auto") {
        layerCount++
        continue
      }
      if (style.perspective && style.perspective !== "none") {
        layerCount++
        continue
      }
      const transform = style.transform
      if (transform && transform !== "none") {
        if (
          transform.startsWith("matrix3d") ||
          /translate3d|translateZ|rotate3d|rotateX|rotateY|scale3d|perspective/i.test(transform)
        ) {
          layerCount++
        }
      }
    }
    this.#compositorLayers = layerCount
  }

  getMetrics(): PaintMetrics {
    return {
      paintCount: this.#paintCount,
      scriptEvalTime: this.#scriptEvalTime,
      compositorLayers: this.#compositorLayers
    }
  }
}
