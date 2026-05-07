import React from "react"
import { useStorybookState, useChannel } from "storybook/manager-api"
import { SyncIcon } from "@storybook/icons"
import { Code, Button } from "storybook/internal/components"
import { styled } from "storybook/theming"
import { PERF_EVENTS, DEFAULT_METRICS } from "../../performance-types"
import type { PerformanceMetrics } from "../../performance-types"
import { FrameTimingSection } from "../FrameTimingSection/FrameTimingSection"
import { InputSection } from "../InputSection/InputSection"
import { MainThreadSection } from "../MainThreadSection/MainThreadSection"
import { LoAFSection } from "../LoAFSection/LoAFSection"
import { LayoutAndInternalsSection } from "../LayoutAndInternalsSection/LayoutAndInternalsSection"
import { MemoryAndRenderingSection } from "../MemoryAndRenderingSection/MemoryAndRenderingSection"
import { ElementTimingSection } from "../ElementTimingSection/ElementTimingSection"

// ============================================================================
// Section ordering & drag-and-drop types
// ============================================================================

const SECTION_IDS = ["frame-timing", "input", "main-thread", "loaf", "layout", "memory", "element-timing"] as const

type SectionId = (typeof SECTION_IDS)[number]

// ============================================================================
// Styled Components
// ============================================================================

const PanelWrapper = styled.div(({ theme }) => ({
  display: "flex",
  fontFamily: theme.typography.fonts.mono,
  fontSize: "11px",
  lineHeight: 1.4,
  color: theme.color.defaultText,
  height: "100%",
  background: theme.background.content
}))

const ContentArea = styled.div({
  flex: 1,
  overflow: "auto",
  padding: "4px"
})

const SideToolbar = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: "4px",
  padding: "4px",
  borderLeft: `1px solid ${theme.appBorderColor}`,
  background: theme.barBg
}))

const SectionsGrid = styled.div({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "4px",
  alignItems: "start"
})

const DragWrapper = styled.div<{ isDragOver: boolean }>(({ theme, isDragOver }) => ({
  borderRadius: theme.appBorderRadius,
  transition: "box-shadow 0.1s ease",
  ...(isDragOver && {
    boxShadow: `0 0 0 2px ${theme.color.secondary}`
  })
}))

export const EmptyState = styled.div(({ theme }) => ({
  padding: "24px",
  textAlign: "center" as const,
  color: theme.color.mediumdark
}))

export const EmptyStateTitle = styled.p(({ theme }) => ({
  fontSize: "12px",
  color: theme.color.defaultText,
  marginBottom: "8px"
}))

export const EmptyStateSubtitle = styled.p(({ theme }) => ({
  fontSize: "10px",
  color: theme.color.mediumdark,
  opacity: 0.7,
  margin: 0
}))

export const EmptyStateHint = styled.p(({ theme }) => ({
  fontSize: "10px",
  color: theme.color.mediumdark,
  margin: 0
}))

// ============================================================================
// Panel State & Reducer
// ============================================================================

interface PanelState {
  status: "loading" | "connected" | "error" | "no-decorator"
  metrics: PerformanceMetrics
  errorMessage: string | null
}

type PanelAction =
  | { type: "METRICS_RECEIVED"; metrics: PerformanceMetrics }
  | { type: "STORY_ERROR"; message: string }
  | { type: "NO_DECORATOR" }
  | { type: "RESET_METRICS" }

const INITIAL_STATE: PanelState = {
  status: "loading",
  metrics: DEFAULT_METRICS,
  errorMessage: null
}

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case "METRICS_RECEIVED":
      return { ...state, status: "connected", metrics: action.metrics, errorMessage: null }
    case "STORY_ERROR":
      return { ...state, status: "error", errorMessage: action.message }
    case "NO_DECORATOR":
      if (state.status === "loading") return { ...state, status: "no-decorator" }
      return state
    case "RESET_METRICS":
      return { ...state, metrics: DEFAULT_METRICS }
    default:
      return state
  }
}

// ============================================================================
// Component
// ============================================================================

export function ConnectedPanelContent({ storyId: _storyId }: { storyId: string }) {
  const [state, dispatch] = React.useReducer(panelReducer, INITIAL_STATE)
  const { previewInitialized } = useStorybookState()

  // Section order and collapse state
  const [order, setOrder] = React.useState<SectionId[]>([...SECTION_IDS])
  const [collapsed, setCollapsed] = React.useState<Set<SectionId>>(new Set())
  const [dragOverId, setDragOverId] = React.useState<SectionId | null>(null)
  const dragRef = React.useRef<SectionId | null>(null)

  const isConnected = () => state.status === "connected"

  const emit = useChannel({
    [PERF_EVENTS.METRICS_UPDATE]: (data: PerformanceMetrics) => {
      dispatch({ type: "METRICS_RECEIVED", metrics: data })
    },
    storyRendered: () => emit(PERF_EVENTS.REQUEST_METRICS),
    storyFinished: () => emit(PERF_EVENTS.REQUEST_METRICS),
    storyErrored: () => dispatch({ type: "STORY_ERROR", message: "Story failed to render" }),
    storyMissing: () => dispatch({ type: "STORY_ERROR", message: "Story not found" }),
    storyThrewException: (error: any) =>
      dispatch({ type: "STORY_ERROR", message: error?.message || "Story threw an exception" }),
    playFunctionThrewException: (error: any) =>
      dispatch({ type: "STORY_ERROR", message: `Play function error: ${error?.message || "Unknown error"}` }),
    storyArgsUpdated: () => {
      if (isConnected()) {
        emit(PERF_EVENTS.RESET)
        dispatch({ type: "RESET_METRICS" })
      }
    }
  })

  React.useEffect(() => {
    if (previewInitialized) emit(PERF_EVENTS.REQUEST_METRICS)
  }, [previewInitialized, emit])

  React.useEffect(() => {
    if (!previewInitialized || state.status !== "loading") return
    const timeoutId = setTimeout(() => dispatch({ type: "NO_DECORATOR" }), 500)
    return () => clearTimeout(timeoutId)
  }, [previewInitialized, state.status])

  const handleReset = React.useCallback(() => {
    emit(PERF_EVENTS.RESET)
    dispatch({ type: "RESET_METRICS" })
  }, [emit])

  const handleInspectElement = React.useCallback(
    (selector: string) => {
      emit(PERF_EVENTS.INSPECT_ELEMENT, selector)
    },
    [emit]
  )

  const handleToggle = React.useCallback((id: SectionId) => {
    setCollapsed((prev) => {
      const isNowCollapsed = !prev.has(id)
      const next = new Set(prev)
      if (isNowCollapsed) {
        next.add(id)
        // Move collapsed section to the end of the order
        setOrder((prevOrder) => {
          const without = prevOrder.filter((x) => x !== id)
          return [...without, id]
        })
      } else {
        next.delete(id)
        // Move expanded section before the first collapsed one
        setOrder((prevOrder) => {
          const without = prevOrder.filter((x) => x !== id)
          const firstCollapsedIdx = without.findIndex((x) => next.has(x))
          if (firstCollapsedIdx === -1) return [...without, id]
          const result = [...without]
          result.splice(firstCollapsedIdx, 0, id)
          return result
        })
      }
      return next
    })
  }, [])

  const handleDragStart = React.useCallback((id: SectionId) => {
    dragRef.current = id
  }, [])

  const handleDragOver = React.useCallback((e: React.DragEvent, id: SectionId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (dragRef.current !== id) setDragOverId(id)
  }, [])

  const handleDrop = React.useCallback((e: React.DragEvent, targetId: SectionId) => {
    e.preventDefault()
    const sourceId = dragRef.current
    if (!sourceId || sourceId === targetId) {
      setDragOverId(null)
      return
    }
    setOrder((prev) => {
      const next = [...prev]
      const fromIdx = next.indexOf(sourceId)
      const toIdx = next.indexOf(targetId)
      next.splice(fromIdx, 1)
      next.splice(toIdx, 0, sourceId)
      return next
    })
    setDragOverId(null)
    dragRef.current = null
  }, [])

  const handleDragEnd = React.useCallback(() => {
    setDragOverId(null)
    dragRef.current = null
  }, [])

  if (state.status !== "connected") {
    if (state.status === "error") {
      return (
        <EmptyState>
          <EmptyStateTitle>Story error</EmptyStateTitle>
          <EmptyStateSubtitle>{state.errorMessage}</EmptyStateSubtitle>
          <EmptyStateHint>
            <span>Fix the error in your story to see performance metrics.</span>
          </EmptyStateHint>
        </EmptyState>
      )
    }
    if (state.status === "no-decorator") {
      return (
        <EmptyState>
          <EmptyStateTitle>Performance monitoring not active for this story</EmptyStateTitle>
          <EmptyStateHint>
            Add the <Code>withPerformanceMonitor</Code> decorator to enable metrics collection.
          </EmptyStateHint>
        </EmptyState>
      )
    }
    return (
      <EmptyState>
        <EmptyStateTitle>Loading story…</EmptyStateTitle>
        <EmptyStateSubtitle>Waiting for performance metrics</EmptyStateSubtitle>
      </EmptyState>
    )
  }

  const { metrics } = state

  const renderSection = (id: SectionId) => {
    const isCollapsed = collapsed.has(id)
    const onToggle = () => handleToggle(id)
    switch (id) {
      case "frame-timing":
        return (
          <FrameTimingSection
            collapsed={isCollapsed}
            onToggle={onToggle}
            fps={metrics.fps}
            fpsHistory={metrics.fpsHistory}
            frameTime={metrics.frameTime}
            maxFrameTime={metrics.maxFrameTime}
            frameTimeHistory={metrics.frameTimeHistory}
            droppedFrames={metrics.droppedFrames}
            frameJitter={metrics.frameJitter}
            frameStability={metrics.frameStability}
            paintTime={metrics.paintTime}
            maxPaintTime={metrics.maxPaintTime}
            paintJitter={metrics.paintJitter}
          />
        )
      case "input":
        return (
          <InputSection
            collapsed={isCollapsed}
            onToggle={onToggle}
            inputLatency={metrics.inputLatency}
            maxInputLatency={metrics.maxInputLatency}
            eventTimingSupported={metrics.eventTimingSupported}
            inpMs={metrics.inpMs}
            interactionCount={metrics.interactionCount}
            firstInputDelay={metrics.firstInputDelay}
            firstInputType={metrics.firstInputType}
            lastInteraction={metrics.lastInteraction}
            slowestInteraction={metrics.slowestInteraction}
            onInspectElement={handleInspectElement}
          />
        )
      case "main-thread":
        return (
          <MainThreadSection
            collapsed={isCollapsed}
            onToggle={onToggle}
            longTasks={metrics.longTasks}
            longestTask={metrics.longestTask}
            totalBlockingTime={metrics.totalBlockingTime}
            thrashingScore={metrics.thrashingScore}
            domMutationsPerFrame={metrics.domMutationsPerFrame}
          />
        )
      case "loaf":
        return (
          <LoAFSection
            collapsed={isCollapsed}
            onToggle={onToggle}
            loafSupported={metrics.loafSupported}
            loafCount={metrics.loafCount}
            totalLoafBlockingDuration={metrics.totalLoafBlockingDuration}
            longestLoafDuration={metrics.longestLoafDuration}
            longestLoafBlockingDuration={metrics.longestLoafBlockingDuration}
            avgLoafDuration={metrics.avgLoafDuration}
            p95LoafDuration={metrics.p95LoafDuration}
            loafsWithScripts={metrics.loafsWithScripts}
            worstLoaf={metrics.worstLoaf}
          />
        )
      case "layout":
        return (
          <LayoutAndInternalsSection
            collapsed={isCollapsed}
            onToggle={onToggle}
            layoutShiftScore={metrics.layoutShiftScore}
            layoutShiftCount={metrics.layoutShiftCount}
            currentSessionCLS={metrics.currentSessionCLS}
            forcedReflowCount={metrics.forcedReflowCount}
            styleWrites={metrics.styleWrites}
            cssVarChanges={metrics.cssVarChanges}
            inputJitter={metrics.inputJitter}
          />
        )
      case "memory":
        return (
          <MemoryAndRenderingSection
            collapsed={isCollapsed}
            onToggle={onToggle}
            memoryUsedMB={metrics.memoryUsedMB}
            memoryDeltaMB={metrics.memoryDeltaMB}
            peakMemoryMB={metrics.peakMemoryMB}
            memoryHistory={metrics.memoryHistory}
            gcPressure={metrics.gcPressure}
            domElements={metrics.domElements}
            paintCount={metrics.paintCount}
            compositorLayers={metrics.compositorLayers}
          />
        )
      case "element-timing":
        return (
          <ElementTimingSection
            collapsed={isCollapsed}
            onToggle={onToggle}
            elementTimingCount={metrics.elementTimingCount}
            largestElementRenderTime={metrics.largestElementRenderTime}
            elementTimings={metrics.elementTimings}
          />
        )
    }
  }

  return (
    <PanelWrapper>
      <ContentArea>
        <SectionsGrid>
          {order.map((id) => (
            <DragWrapper
              key={id}
              draggable
              isDragOver={dragOverId === id}
              onDragStart={() => handleDragStart(id)}
              onDragOver={(e) => handleDragOver(e, id)}
              onDrop={(e) => handleDrop(e, id)}
              onDragEnd={handleDragEnd}
              onDragLeave={() => setDragOverId(null)}
            >
              {renderSection(id)}
            </DragWrapper>
          ))}
        </SectionsGrid>
      </ContentArea>
      <SideToolbar>
        <Button variant="ghost" padding="small" onClick={handleReset} aria-label="Reset all metrics">
          <SyncIcon />
        </Button>
      </SideToolbar>
    </PanelWrapper>
  )
}
