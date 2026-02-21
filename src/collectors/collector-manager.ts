import { SPARKLINE_HISTORY_SIZE } from './constants'
import { addToWindow, computeAverage } from './utils'
import { FrameTimingCollector } from './frame-timing-collector'
import { InputCollector } from './input-collector'
import { MainThreadCollector } from './main-thread-collector'
import { LongAnimationFrameCollector } from './long-animation-frame-collector'
import { LayoutShiftCollector } from './layout-shift-collector'
import { MemoryCollector } from './memory-collector'
import { PaintCollector } from './paint-collector'
import { StyleMutationCollector } from './style-mutation-collector'
import { ForcedReflowCollector } from './forced-reflow-collector'
import { ElementTimingCollector } from './element-timing-collector'
import type { PerformanceMetrics } from '../performance-types'

interface CollectorManagerState {
  fpsHistory: number[]
  frameTimeHistory: number[]
  domElements: number | null
}

function createInitialState(): CollectorManagerState {
  return {
    fpsHistory: [],
    frameTimeHistory: [],
    domElements: null,
  }
}

export class CollectorManager {
  collectors: {
    style: StyleMutationCollector
    reflow: ForcedReflowCollector
    frame: FrameTimingCollector
    input: InputCollector
    mainThread: MainThreadCollector
    loaf: LongAnimationFrameCollector
    layoutShift: LayoutShiftCollector
    memory: MemoryCollector
    paint: PaintCollector
    elementTiming: ElementTimingCollector
  }
  #running = false
  #state: CollectorManagerState
  #lastMetrics: PerformanceMetrics | null = null

  constructor() {
    this.#state = createInitialState()
    this.collectors = {
      style: new StyleMutationCollector(),
      reflow: new ForcedReflowCollector(),
      frame: new FrameTimingCollector((delta) => this.collectors.style.checkThrashing(delta)),
      input: new InputCollector(),
      mainThread: new MainThreadCollector(),
      loaf: new LongAnimationFrameCollector(),
      layoutShift: new LayoutShiftCollector(),
      memory: new MemoryCollector(),
      paint: new PaintCollector(),
      elementTiming: new ElementTimingCollector(),
    }

    this.collectors.style.onLayoutDirty = () => this.collectors.reflow.markLayoutDirty()
  }

  get isRunning(): boolean {
    return this.#running
  }

  get #allCollectors() {
    return Object.values(this.collectors)
  }

  start(storyStartTime?: number): void {
    if (this.#running) return
    for (const [key, collector] of Object.entries(this.collectors)) {
      if (key !== 'elementTiming') collector.start()
    }
    this.collectors.elementTiming.start(storyStartTime)
    this.#running = true
  }

  stop(): void {
    if (!this.#running) return
    for (const collector of this.#allCollectors) {
      collector.stop()
    }
    this.#running = false
  }

  reset(): void {
    for (const collector of this.#allCollectors) {
      collector.reset()
    }
    this.#state = createInitialState()
    this.#lastMetrics = null
  }

  updateSparklineData(): void {
    this.collectors.memory.update()
    this.collectors.paint.updateCompositorLayers()

    const frameMetrics = this.collectors.frame.getMetrics()
    if (frameMetrics.frameTimes.length > 0) {
      const avgFrameTime = computeAverage(frameMetrics.frameTimes)
      const fps = Math.round(1000 / avgFrameTime)
      addToWindow(this.#state.fpsHistory, fps, SPARKLINE_HISTORY_SIZE)
      addToWindow(this.#state.frameTimeHistory, avgFrameTime, SPARKLINE_HISTORY_SIZE)
    }
  }

  setDomElementCount(count: number): void {
    this.#state.domElements = count
  }

  observeContainer(container: HTMLElement): () => void {
    let countTimeout: ReturnType<typeof setTimeout> | null = null
    let pendingCount = false

    const countElements = () => {
      this.#state.domElements = container.querySelectorAll('*').length
      pendingCount = false
    }

    const scheduleCount = () => {
      if (!pendingCount) {
        pendingCount = true
        countTimeout = setTimeout(countElements, 500)
      }
    }

    countElements()
    const observer = new MutationObserver(scheduleCount)
    observer.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      if (countTimeout) clearTimeout(countTimeout)
    }
  }

  getFrameMetrics() {
    return this.collectors.frame.getMetrics()
  }

  computeMetrics(): PerformanceMetrics {
    const state = this.#state

    const frame = this.collectors.frame.getMetrics()
    const input = this.collectors.input.getMetrics()
    const mainThread = this.collectors.mainThread.getMetrics()
    const loaf = this.collectors.loaf.getMetrics()
    const layoutShift = this.collectors.layoutShift.getMetrics()
    const memory = this.collectors.memory.getMetrics()
    const style = this.collectors.style.getMetrics()
    const reflow = this.collectors.reflow.getMetrics()
    const paint = this.collectors.paint.getMetrics()
    const elementTiming = this.collectors.elementTiming.getMetrics()

    const avgFrameTime = computeAverage(frame.frameTimes)
    const fps = avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 0
    const avgInputLatency = computeAverage(input.inputLatencies)
    const avgPaintTime = computeAverage(input.paintTimes)

    const memoryDeltaMB =
      memory.lastMemoryMB !== null && memory.baselineMemoryMB !== null
        ? Math.round((memory.lastMemoryMB - memory.baselineMemoryMB) * 10) / 10
        : null

    const metrics: PerformanceMetrics = {
      fps,
      frameTime: Math.round(avgFrameTime * 10) / 10,
      maxFrameTime: Math.round(frame.maxFrameTime * 10) / 10,
      inputLatency: Math.round(avgInputLatency * 10) / 10,
      maxInputLatency: Math.round(input.maxInputLatency * 10) / 10,
      paintTime: Math.round(avgPaintTime * 10) / 10,
      maxPaintTime: Math.round(input.maxPaintTime * 10) / 10,
      inputJitter: input.inputJitter,
      memoryUsedMB: memory.lastMemoryMB,
      memoryDeltaMB,
      peakMemoryMB: memory.peakMemoryMB,
      fpsHistory: [...state.fpsHistory],
      frameTimeHistory: [...state.frameTimeHistory],
      memoryHistory: [...memory.memoryHistory],
      longTasks: mainThread.longTasks,
      longestTask: mainThread.longestTask,
      totalBlockingTime: Math.round(mainThread.totalBlockingTime),
      loafSupported: loaf.loafSupported,
      loafCount: loaf.loafCount,
      totalLoafBlockingDuration: loaf.totalLoafBlockingDuration,
      longestLoafDuration: loaf.longestLoafDuration,
      longestLoafBlockingDuration: loaf.longestLoafBlockingDuration,
      avgLoafDuration: loaf.avgLoafDuration,
      p95LoafDuration: loaf.p95LoafDuration,
      loafsWithScripts: loaf.loafsWithScripts,
      lastLoaf: loaf.lastLoaf,
      worstLoaf: loaf.worstLoaf,
      droppedFrames: frame.droppedFrames,
      frameJitter: frame.frameJitter,
      frameStability: frame.frameStability,
      styleWrites: style.styleWrites,
      thrashingScore: style.thrashingScore,
      layoutShiftScore: layoutShift.layoutShiftScore,
      layoutShiftCount: layoutShift.layoutShiftCount,
      currentSessionCLS: layoutShift.currentSessionScore,
      eventTimingSupported: input.eventTimingSupported,
      interactionCount: input.interactionCount,
      inpMs: input.inpMs,
      firstInputDelay: input.firstInputDelay,
      firstInputType: input.firstInputType,
      lastInteraction: input.lastInteraction,
      slowestInteraction: input.slowestInteraction,
      interactionsByType: input.interactionsByType,
      domElements: state.domElements,
      forcedReflowCount: reflow.forcedReflowCount,
      eventListenerCount: 0,
      observerCount: 0,
      cssVarChanges: style.cssVarChanges,
      scriptEvalTime: Math.round(paint.scriptEvalTime * 10) / 10,
      gcPressure: Math.round(memory.gcPressure * 100) / 100,
      paintCount: paint.paintCount,
      paintJitter: input.paintJitter,
      compositorLayers: paint.compositorLayers,
      domMutationsPerFrame: Math.round(computeAverage(style.domMutationFrames)),
      elementTimingSupported: elementTiming.elementTimingSupported,
      elementTimingCount: elementTiming.elementCount,
      largestElementRenderTime: Math.round(elementTiming.largestRenderTime * 10) / 10,
      elementTimings: elementTiming.elements.map((e) => ({
        identifier: e.identifier,
        renderTime: Math.round(e.renderTime * 10) / 10,
        selector: e.selector,
      })),
    }

    this.#lastMetrics = metrics
    return metrics
  }
}
