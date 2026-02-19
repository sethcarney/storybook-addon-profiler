import type { ElementTimingMetrics, ElementTimingRecord, MetricCollector } from './types'

interface ElementTimingEntry extends PerformanceEntry {
  renderTime: number
  loadTime: number
  identifier: string
  element: Element | null
  naturalWidth?: number
  naturalHeight?: number
  url?: string
}

function getSimpleSelector(element: Element | null): string {
  if (!element) return 'unknown'
  if ((element as HTMLElement).id) {
    return `#${(element as HTMLElement).id}`
  }
  const timing = element.getAttribute('elementtiming')
  if (timing) {
    return `[elementtiming="${timing}"]`
  }
  const classes = (element as HTMLElement).className
    ? `.${(element as HTMLElement).className
        .split(/\s+/)
        .filter((c) => c)
        .slice(0, 2)
        .join('.')}`
    : ''
  return `${element.tagName.toLowerCase()}${classes}`
}

export class ElementTimingCollector implements MetricCollector<ElementTimingMetrics> {
  #observer: PerformanceObserver | null = null
  #supported = false
  #elements: ElementTimingRecord[] = []
  #largestRenderTime = 0

  constructor() {
    this.#supported = this.#checkSupport()
  }

  #checkSupport(): boolean {
    try {
      return (
        typeof PerformanceObserver !== 'undefined' &&
        PerformanceObserver.supportedEntryTypes?.includes('element') === true
      )
    } catch {
      return false
    }
  }

  start(): void {
    if (!this.#supported) return
    try {
      this.#observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.#processEntry(entry as ElementTimingEntry)
        }
      })
      this.#observer.observe({ type: 'element', buffered: true })
    } catch {
      this.#supported = false
    }
  }

  #processEntry(entry: ElementTimingEntry): void {
    const renderTime = entry.renderTime || entry.loadTime || 0
    const record: ElementTimingRecord = {
      identifier: entry.identifier || 'unnamed',
      renderTime,
      loadTime: entry.loadTime || 0,
      selector: getSimpleSelector(entry.element),
      tagName: entry.element?.tagName.toLowerCase() || 'unknown',
    }
    if (entry.naturalWidth) {
      record.naturalWidth = entry.naturalWidth
      record.naturalHeight = entry.naturalHeight
    }
    if (entry.url) {
      record.url = entry.url
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
  }

  getMetrics(): ElementTimingMetrics {
    return {
      elementTimingSupported: this.#supported,
      elements: [...this.#elements],
      largestRenderTime: this.#largestRenderTime,
      elementCount: this.#elements.length,
    }
  }
}
