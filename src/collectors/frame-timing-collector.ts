import type { FrameTimingMetrics, MetricCollector } from './types'
import {
  FRAME_TIME_60FPS,
  DROPPED_FRAME_MULTIPLIER,
  FRAME_TIMES_WINDOW,
  JITTER_BASELINE_SIZE,
  JITTER_MULTIPLIER,
  JITTER_FRAME_DELTA,
  JITTER_FRAME_ABSOLUTE,
  MAX_DECAY_THRESHOLD,
  MAX_DECAY_RATE,
} from './constants'
import { addToWindow, computeAverage, computeFrameStability, updateMaxWithDecay } from './utils'

export class FrameTimingCollector implements MetricCollector<FrameTimingMetrics> {
  #frameTimes: number[] = []
  #maxFrameTime = 0
  #droppedFrames = 0
  #frameJitter = 0
  #lastTime = 0
  #animationId: number | null = null
  #onFrame?: (delta: number) => void

  constructor(onFrame?: (delta: number) => void) {
    this.#onFrame = onFrame
  }

  start(): void {
    this.#lastTime = performance.now()
    this.#measure()
  }

  stop(): void {
    if (this.#animationId !== null) {
      cancelAnimationFrame(this.#animationId)
      this.#animationId = null
    }
  }

  reset(): void {
    this.#frameTimes = []
    this.#maxFrameTime = 0
    this.#droppedFrames = 0
    this.#frameJitter = 0
  }

  getMetrics(): FrameTimingMetrics {
    return {
      frameTimes: [...this.#frameTimes],
      maxFrameTime: this.#maxFrameTime,
      droppedFrames: this.#droppedFrames,
      frameJitter: this.#frameJitter,
      frameStability: computeFrameStability(this.#frameTimes),
    }
  }

  #measure = (): void => {
    const now = performance.now()
    const delta = now - this.#lastTime
    this.#lastTime = now
    this.#processFrame(delta)
    this.#onFrame?.(delta)
    this.#animationId = requestAnimationFrame(this.#measure)
  }

  #processFrame(delta: number): void {
    addToWindow(this.#frameTimes, delta, FRAME_TIMES_WINDOW)
    this.#maxFrameTime = updateMaxWithDecay(
      this.#maxFrameTime,
      delta,
      MAX_DECAY_THRESHOLD,
      MAX_DECAY_RATE,
    )
    if (delta > FRAME_TIME_60FPS * DROPPED_FRAME_MULTIPLIER) {
      this.#droppedFrames += Math.floor(delta / FRAME_TIME_60FPS) - 1
    }
    if (this.#frameTimes.length >= JITTER_BASELINE_SIZE) {
      const baselineFrames = this.#frameTimes.slice(-JITTER_BASELINE_SIZE, -1)
      const avgBaseline = computeAverage(baselineFrames)
      const isJitter =
        delta > avgBaseline * JITTER_MULTIPLIER &&
        delta - avgBaseline > JITTER_FRAME_DELTA &&
        delta > JITTER_FRAME_ABSOLUTE
      if (isJitter) this.#frameJitter++
    }
  }
}
