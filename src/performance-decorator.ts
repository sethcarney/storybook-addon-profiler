import { addons, useEffect } from 'storybook/internal/preview-api'
import { CollectorManager } from './collectors/collector-manager'
import { PERF_EVENTS } from './performance-types'
import { performanceStore } from './performance-store'

type AnyStoryFn = (...args: unknown[]) => unknown
type MinimalStoryContext = { id: string; [key: string]: unknown }

const UPDATE_INTERVAL_MS = 50
const SPARKLINE_SAMPLE_INTERVAL_MS = 200

function findStoryRoot(): HTMLElement {
  return (
    document.getElementById('storybook-root') ??
    document.getElementById('storybook-preview-root') ??
    document.body
  )
}

export const withPerformanceMonitor = (Story: AnyStoryFn, ctx: MinimalStoryContext) => {
  const storyId = ctx.id

  useEffect(() => {
    const channel = addons.getChannel()
    const manager = new CollectorManager()

    manager.start()

    const storyRoot = findStoryRoot()
    const containerCleanup = manager.observeContainer(storyRoot)

    const handleRequestMetrics = () => {
      channel.emit(PERF_EVENTS.METRICS_UPDATE, manager.computeMetrics())
    }

    const handleReset = () => {
      manager.reset()
      performanceStore.resetAll()
    }

    channel.on(PERF_EVENTS.REQUEST_METRICS, handleRequestMetrics)
    channel.on(PERF_EVENTS.RESET, handleReset)
    channel.on(PERF_EVENTS.INSPECT_ELEMENT, handleInspectElement)

    let lastUpdateTime = performance.now()
    let lastSparklineTime = performance.now()
    let animationFrameId: number

    const updateLoop = () => {
      const now = performance.now()
      if (now - lastSparklineTime >= SPARKLINE_SAMPLE_INTERVAL_MS) {
        lastSparklineTime = now
        manager.updateSparklineData()
      }
      if (now - lastUpdateTime >= UPDATE_INTERVAL_MS) {
        lastUpdateTime = now
        const computed = manager.computeMetrics()
        channel.emit(PERF_EVENTS.METRICS_UPDATE, computed)
        performanceStore.setGlobalMetrics(computed)
      }
      animationFrameId = requestAnimationFrame(updateLoop)
    }

    animationFrameId = requestAnimationFrame(updateLoop)

    return () => {
      manager.stop()
      cancelAnimationFrame(animationFrameId)
      containerCleanup()
      channel.off(PERF_EVENTS.REQUEST_METRICS, handleRequestMetrics)
      channel.off(PERF_EVENTS.RESET, handleReset)
      channel.off(PERF_EVENTS.INSPECT_ELEMENT, handleInspectElement)
    }
  }, [storyId])

  return Story()
}

function handleInspectElement(selector: string): void {
  if (!selector || selector === 'unknown') return
  try {
    const element = document.querySelector(selector)
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const originalOutline = element.style.outline
      const originalOutlineOffset = element.style.outlineOffset
      element.style.outline = '3px solid #f06'
      element.style.outlineOffset = '2px'
      setTimeout(() => {
        element.style.outline = '3px solid #06f'
        setTimeout(() => {
          element.style.outline = '3px solid #f06'
          setTimeout(() => {
            element.style.outline = originalOutline
            element.style.outlineOffset = originalOutlineOffset
          }, 200)
        }, 200)
      }, 200)
    }
  } catch {
    // Invalid selector
  }
}
