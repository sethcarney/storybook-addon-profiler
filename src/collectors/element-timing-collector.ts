import type { ElementTimingMetrics, ElementTimingRecord, MetricCollector } from "./types"

function getSelector(element: Element): string {
  if ((element as HTMLElement).id) {
    return `#${(element as HTMLElement).id}`
  }
  const classes = (element as HTMLElement).className
    ? `.${(element as HTMLElement).className
        .split(/\s+/)
        .filter((c) => c)
        .slice(0, 2)
        .join(".")}`
    : ""
  return `${element.tagName.toLowerCase()}${classes}`
}

/**
 * Tracks elements annotated with `data-profiler="name"` via MutationObserver.
 * Records the elapsed time (ms) from when the collector started until each
 * matching element is inserted into the DOM.
 *
 * Usage in stories:
 *   <img data-profiler="hero-image" src="..." />
 *   <h1 data-profiler="page-title">Hello</h1>
 */
export class ElementTimingCollector implements MetricCollector<ElementTimingMetrics> {
  #observer: MutationObserver | null = null
  #elements: ElementTimingRecord[] = []
  #largestRenderTime = 0
  #startTime = 0

  start(startTime?: number): void {
    this.#startTime = startTime ?? performance.now()
    const root = document.getElementById("storybook-root") ?? document.body

    // Capture any elements already present — elapsed since story render start
    const elapsed = performance.now() - this.#startTime
    for (const el of root.querySelectorAll("[data-profiler]")) {
      this.#processElement(el as HTMLElement, elapsed)
    }

    this.#observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue
          const elapsed = performance.now() - this.#startTime
          if (node.hasAttribute("data-profiler")) {
            this.#processElement(node as HTMLElement, elapsed)
          }
          for (const el of node.querySelectorAll("[data-profiler]")) {
            this.#processElement(el as HTMLElement, elapsed)
          }
        }
      }
    })

    this.#observer.observe(root, { childList: true, subtree: true })
  }

  #processElement(el: HTMLElement, renderTime: number): void {
    const identifier = el.getAttribute("data-profiler") || "unnamed"
    // Deduplicate by name — first insertion wins
    if (this.#elements.some((e) => e.identifier === identifier)) return
    const record: ElementTimingRecord = {
      identifier,
      renderTime: Math.round(renderTime * 10) / 10,
      loadTime: Math.round(renderTime * 10) / 10,
      selector: getSelector(el),
      tagName: el.tagName.toLowerCase()
    }
    this.#elements.push(record)
    if (renderTime > this.#largestRenderTime) {
      this.#largestRenderTime = renderTime
    }
  }

  stop(): void {
    this.#observer?.disconnect()
    this.#observer = null
  }

  reset(): void {
    this.#elements = []
    this.#largestRenderTime = 0
    this.#startTime = performance.now()
  }

  getMetrics(): ElementTimingMetrics {
    return {
      elementTimingSupported: true,
      elements: [...this.#elements],
      largestRenderTime: this.#largestRenderTime,
      elementCount: this.#elements.length
    }
  }
}
