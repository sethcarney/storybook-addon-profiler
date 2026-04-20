import React from "react"
import { THRESHOLDS, getStatusVariant, getZeroIsGoodStatus } from "../../performance-types"
import { formatMs } from "../../panel/formatters"
import { MetricsSection } from "../MetricsSection/MetricsSection"
import { Metric, SecondaryValue } from "../Metric/Metric"
import { StatusBadge } from "../StatusBadge/StatusBadge"
import { Sparkline } from "../Sparkline/Sparkline"

export const FrameTimingSection = React.memo(function FrameTimingSection({
  fps,
  fpsHistory,
  frameTime,
  maxFrameTime,
  frameTimeHistory,
  droppedFrames,
  frameJitter,
  frameStability,
  paintTime,
  maxPaintTime,
  paintJitter,
  collapsed,
  onToggle
}: {
  fps: number
  fpsHistory: number[]
  frameTime: number
  maxFrameTime: number
  frameTimeHistory: number[]
  droppedFrames: number
  frameJitter: number
  frameStability: number
  paintTime: number
  maxPaintTime: number
  paintJitter: number
  collapsed?: boolean
  onToggle?: () => void
}) {
  const fpsStatus = getStatusVariant(fps, THRESHOLDS.FPS_GOOD, THRESHOLDS.FPS_WARNING, true)
  const droppedStatus =
    droppedFrames > THRESHOLDS.DROPPED_FRAMES_WARNING ? "error" : droppedFrames > 0 ? "warning" : "success"
  const frameJitterStatus = getZeroIsGoodStatus(frameJitter)
  const stabilityStatus = frameStability >= 90 ? "success" : frameStability >= 70 ? "warning" : "error"
  const paintJitterStatus = getZeroIsGoodStatus(paintJitter)

  return (
    <MetricsSection icon="📊" title="Frame Timing" collapsed={collapsed} onToggle={onToggle}>
      <Metric
        label="FPS"
        tooltip="Frames per second. Target: 60fps. Below 30 causes visible stuttering."
        sparkline={
          <Sparkline
            data={fpsHistory}
            goodThreshold={THRESHOLDS.FPS_GOOD}
            badThreshold={THRESHOLDS.FPS_WARNING}
            higherIsBetter
          />
        }
      >
        <StatusBadge variant={fpsStatus}>{fps}</StatusBadge>
      </Metric>
      <Metric
        label="Frame Time"
        tooltip="Average time per frame. Target: ≤16.67ms for 60fps."
        sparkline={
          <Sparkline
            data={frameTimeHistory}
            goodThreshold={THRESHOLDS.FRAME_TIME_TARGET}
            badThreshold={THRESHOLDS.FRAME_TIME_WARNING}
          />
        }
        detail={<>max {formatMs(maxFrameTime)}</>}
      >
        {formatMs(frameTime)}
      </Metric>
      <Metric label="Dropped Frames" tooltip="Frames taking >2× expected time. High count indicates stuttering.">
        <StatusBadge variant={droppedStatus}>
          <span>{droppedFrames}</span>
          {droppedFrames === 0 ? <span>{" ✨"}</span> : <span>{" 💧"}</span>}
        </StatusBadge>
      </Metric>
      <Metric label="Frame Jitter" tooltip="Sudden spikes in frame time vs recent baseline.">
        <StatusBadge variant={frameJitterStatus}>
          {frameJitter === 0 ? "✨ Smooth" : `⚡ ${frameJitter} spikes`}
        </StatusBadge>
      </Metric>
      <Metric label="Frame Stability" tooltip="Frame time consistency (0-100%). 100% = perfectly smooth.">
        <StatusBadge variant={stabilityStatus}>
          <span>{frameStability >= 90 ? "🎯 " : frameStability >= 70 ? "📊 " : "📉 "}</span>
          <span>{frameStability}%</span>
        </StatusBadge>
      </Metric>
      <Metric label="Paint Time" tooltip="Browser rendering time via double-RAF technique.">
        {formatMs(paintTime)}
        <SecondaryValue>/ {formatMs(maxPaintTime)} max</SecondaryValue>
      </Metric>
      <Metric label="Paint Jitter" tooltip="Sudden spikes in paint time vs recent baseline.">
        <StatusBadge variant={paintJitterStatus}>
          {paintJitter === 0 ? "✨ None" : `🎨 ${paintJitter} spikes`}
        </StatusBadge>
      </Metric>
    </MetricsSection>
  )
})
