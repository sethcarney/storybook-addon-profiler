import type { MetricCollector, StyleMutationMetrics } from "./types"
import { THRASHING_FRAME_THRESHOLD, THRASHING_STYLE_WRITE_WINDOW } from "./constants"
import { addToWindow } from "./utils"

export class StyleMutationCollector implements MetricCollector<StyleMutationMetrics> {
  #styleWrites = 0
  #cssVarChanges = 0
  #domMutationFrames: number[] = []
  #thrashingScore = 0
  #styleWriteCount = 0
  #lastStyleWriteTime = 0
  #domMutationCount = 0

  #styleObserver: MutationObserver | null = null
  #domObserver: MutationObserver | null = null
  #sampleInterval: ReturnType<typeof setInterval> | null = null

  onLayoutDirty?: () => void

  start(): void {
    this.#styleObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "style") {
          this.#styleWrites++
          this.#styleWriteCount++
          this.#lastStyleWriteTime = performance.now()
          this.onLayoutDirty?.()

          const target = mutation.target as HTMLElement
          const styleValue = target.getAttribute("style") || ""
          const cssVarMatches = styleValue.match(/--[\w-]+\s*:/g)
          if (cssVarMatches) {
            this.#cssVarChanges += cssVarMatches.length
          }
        }
      }
    })
    this.#styleObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
      subtree: true
    })

    this.#domObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          this.#domMutationCount += mutation.addedNodes.length + mutation.removedNodes.length
        } else if (mutation.type === "attributes" && mutation.attributeName !== "style") {
          this.#domMutationCount++
        }
      }
    })
    this.#domObserver.observe(document.body, {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ["class", "id", "data-state", "aria-expanded", "aria-hidden", "hidden", "disabled"]
    })

    this.#sampleInterval = setInterval(() => {
      addToWindow(this.#domMutationFrames, this.#domMutationCount, 30)
      this.#domMutationCount = 0
    }, 200)
  }

  stop(): void {
    this.#styleObserver?.disconnect()
    this.#domObserver?.disconnect()
    if (this.#sampleInterval) clearInterval(this.#sampleInterval)
    this.#styleObserver = null
    this.#domObserver = null
    this.#sampleInterval = null
  }

  reset(): void {
    this.#styleWrites = 0
    this.#cssVarChanges = 0
    this.#domMutationFrames = []
    this.#thrashingScore = 0
    this.#styleWriteCount = 0
    this.#domMutationCount = 0
  }

  checkThrashing(frameTime: number): void {
    const now = performance.now()
    const timeSinceLastWrite = now - this.#lastStyleWriteTime
    const hadRecentStyleWrite = this.#styleWriteCount > 0 && timeSinceLastWrite < THRASHING_STYLE_WRITE_WINDOW
    if (hadRecentStyleWrite && frameTime > THRASHING_FRAME_THRESHOLD) {
      this.#thrashingScore++
    }
    this.#styleWriteCount = 0
  }

  getMetrics(): StyleMutationMetrics {
    return {
      styleWrites: this.#styleWrites,
      cssVarChanges: this.#cssVarChanges,
      domMutationFrames: [...this.#domMutationFrames],
      thrashingScore: this.#thrashingScore
    }
  }
}
