import type { ForcedReflowMetrics, MetricCollector } from './types'

interface ReflowRegistry {
  initialized: boolean
  originalGetters: Map<string, PropertyDescriptor>
  activeCollectors: Set<ForcedReflowCollector>
  currentCollector: ForcedReflowCollector | null
}

export class ForcedReflowCollector implements MetricCollector<ForcedReflowMetrics> {
  #forcedReflowCount = 0
  #layoutDirty = false
  #dirtyTimeout: ReturnType<typeof setTimeout> | null = null

  static #registry: ReflowRegistry | null = null
  static #REFLOW_PROPS = [
    'offsetTop',
    'offsetLeft',
    'offsetWidth',
    'offsetHeight',
    'scrollTop',
    'scrollLeft',
    'scrollWidth',
    'scrollHeight',
    'clientTop',
    'clientLeft',
    'clientWidth',
    'clientHeight',
  ]

  markLayoutDirty(): void {
    this.#layoutDirty = true
    if (this.#dirtyTimeout) clearTimeout(this.#dirtyTimeout)
    this.#dirtyTimeout = setTimeout(() => {
      this.#layoutDirty = false
    }, 0)
  }

  start(): void {
    if (!ForcedReflowCollector.#registry) {
      ForcedReflowCollector.#registry = {
        initialized: false,
        originalGetters: new Map(),
        activeCollectors: new Set(),
        currentCollector: null,
      }
    }

    const registry = ForcedReflowCollector.#registry
    registry.activeCollectors.add(this)
    registry.currentCollector = this

    if (!registry.initialized) {
      registry.initialized = true
      for (const prop of ForcedReflowCollector.#REFLOW_PROPS) {
        const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop)
        if (descriptor?.get) {
          registry.originalGetters.set(prop, descriptor)
          Object.defineProperty(HTMLElement.prototype, prop, {
            get() {
              const collector = ForcedReflowCollector.#registry?.currentCollector
              if (collector && collector.#layoutDirty) {
                collector.#forcedReflowCount++
                collector.#layoutDirty = false
              }
              return descriptor.get?.call(this)
            },
            configurable: true,
          })
        }
      }
    }
  }

  stop(): void {
    if (this.#dirtyTimeout) {
      clearTimeout(this.#dirtyTimeout)
      this.#dirtyTimeout = null
    }

    const registry = ForcedReflowCollector.#registry
    if (!registry) return

    registry.activeCollectors.delete(this)
    if (registry.currentCollector === this) {
      registry.currentCollector = null
    }

    if (registry.activeCollectors.size === 0 && registry.initialized) {
      for (const [prop, descriptor] of registry.originalGetters) {
        Object.defineProperty(HTMLElement.prototype, prop, descriptor)
      }
      registry.originalGetters.clear()
      registry.initialized = false
    }
  }

  reset(): void {
    this.#forcedReflowCount = 0
    this.#layoutDirty = false
  }

  getMetrics(): ForcedReflowMetrics {
    return {
      forcedReflowCount: this.#forcedReflowCount,
    }
  }
}
