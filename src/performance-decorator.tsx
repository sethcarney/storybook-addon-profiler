import {
  createContext,
  memo,
  useRef,
  useLayoutEffect,
  useCallback,
  Profiler,
  useContext,
} from 'react'
import { addons } from 'storybook/internal/preview-api'
import type { RenderInfo } from './collectors/types'
import { CollectorManager } from './collectors/collector-manager'
import { PERF_EVENTS } from './performance-types'
import { performanceStore } from './performance-store'

type ReportRenderFn = (args: Omit<RenderInfo, 'storyId'>) => void

export const ReportReactRenderProfileContext = createContext<ReportRenderFn | null>(null)

export function useReportReactRenderProfile(): ReportRenderFn {
  const ctx = useContext(ReportReactRenderProfileContext)
  if (!ctx) {
    throw new Error('useReportReactRenderProfile must be used within a PerformanceProvider')
  }
  return ctx
}

const UPDATE_INTERVAL_MS = 50
const SPARKLINE_SAMPLE_INTERVAL_MS = 200

interface PerformanceProviderProps {
  children: React.ReactNode
  enabled?: boolean
  storyId: string
}

export const PerformanceProvider = memo(function PerformanceProvider({
  children,
  enabled = true,
  storyId,
}: PerformanceProviderProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const managerRef = useRef<CollectorManager | null>(null)

  if (managerRef.current == null) {
    managerRef.current = new CollectorManager({
      onProfilerUpdate: (profilerStoryId, id, metrics) => {
        performanceStore.updateProfiler(id, metrics)
        addons
          .getChannel()
          .emit(PERF_EVENTS.PROFILER_UPDATE, { id, metrics, storyId: profilerStoryId })
      },
    })
  }

  useLayoutEffect(() => {
    const manager = managerRef.current
    if (!enabled || !manager) return

    const channel = addons.getChannel()
    manager.start()

    const handleRequestMetrics = () => {
      channel.emit(PERF_EVENTS.METRICS_UPDATE, manager.computeMetrics())
      for (const id of manager.getProfilerIds()) {
        const metrics = manager.getProfilerMetrics(id)
        if (metrics) {
          channel.emit(PERF_EVENTS.PROFILER_UPDATE, { id, metrics, storyId })
        }
      }
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
      updateAnimationId = requestAnimationFrame(updateLoop)
    }

    let updateAnimationId = requestAnimationFrame(updateLoop)

    return () => {
      manager.stop()
      cancelAnimationFrame(updateAnimationId)
      channel.off(PERF_EVENTS.REQUEST_METRICS, handleRequestMetrics)
      channel.off(PERF_EVENTS.RESET, handleReset)
      channel.off(PERF_EVENTS.INSPECT_ELEMENT, handleInspectElement)
    }
  }, [enabled, storyId])

  useLayoutEffect(() => {
    const manager = managerRef.current
    if (!enabled || !contentRef.current || !manager) return
    return manager.observeContainer(contentRef.current)
  }, [enabled])

  const contextValue = useCallback(
    (args: Omit<RenderInfo, 'storyId'>) => managerRef.current?.reportRender({ ...args, storyId }),
    [storyId],
  )

  if (!enabled) {
    return <>{children}</>
  }

  return (
    <ReportReactRenderProfileContext.Provider value={contextValue}>
      <div ref={contentRef}>{children}</div>
    </ReportReactRenderProfileContext.Provider>
  )
})

interface ProfiledComponentProps {
  id: string
  children: React.ReactNode
}

export const ProfiledComponent = memo(function ProfiledComponent({
  id,
  children,
}: ProfiledComponentProps) {
  const reportRender = useReportReactRenderProfile()

  const onRender = useCallback(
    (
      profilerId: string,
      phase: 'mount' | 'update' | 'nested-update',
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number,
    ) => {
      reportRender({
        profilerId,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
      })
    },
    [reportRender],
  )

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  )
})

export const withPerformanceMonitor = (Story: React.ComponentType, ctx: { id: string }) => {
  const storyId = ctx.id
  const profilerId = `Story(${storyId})`
  return (
    <PerformanceProvider enabled={true} storyId={storyId}>
      <ProfiledComponent id={profilerId}>
        <Story />
      </ProfiledComponent>
    </PerformanceProvider>
  )
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
      console.log(
        '%c[Performance Panel] Inspecting element:',
        'color: #f06; font-weight: bold',
        element,
        `\nSelector: ${selector}`,
      )
    }
  } catch {
    // Invalid selector
  }
}
