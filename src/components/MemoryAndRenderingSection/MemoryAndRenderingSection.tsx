import React from "react"
import { THRESHOLDS, getStatusVariant } from "../../performance-types"
import { formatMb, formatNumber, formatRate } from "../../panel/formatters"
import { MetricsSection } from "../MetricsSection/MetricsSection"
import { Metric, SecondaryValue } from "../Metric/Metric"
import { StatusBadge } from "../StatusBadge/StatusBadge"
import { Sparkline } from "../Sparkline/Sparkline"

export const MemoryAndRenderingSection = React.memo(function MemoryAndRenderingSection({
  memoryUsedMB,
  memoryDeltaMB,
  peakMemoryMB,
  memoryHistory,
  gcPressure,
  domElements,
  paintCount,
  compositorLayers,
  collapsed,
  onToggle
}: {
  memoryUsedMB: number | null
  memoryDeltaMB: number | null
  peakMemoryMB: number | null
  memoryHistory: number[]
  gcPressure: number
  domElements: number | null
  paintCount: number
  compositorLayers: number | null
  collapsed?: boolean
  onToggle?: () => void
}) {
  const gcStatus = getStatusVariant(gcPressure, 0, THRESHOLDS.GC_PRESSURE_WARNING)
  const layerStatus =
    compositorLayers === null ? "neutral" : getStatusVariant(compositorLayers, 0, THRESHOLDS.LAYERS_WARNING)
  const deltaStatus =
    memoryDeltaMB === null
      ? "neutral"
      : memoryDeltaMB > THRESHOLDS.MEMORY_DELTA_DANGER
        ? "error"
        : memoryDeltaMB > THRESHOLDS.MEMORY_DELTA_WARNING
          ? "warning"
          : "success"
  const deltaText =
    memoryDeltaMB === null
      ? ""
      : memoryDeltaMB > 0.5
        ? `+${formatMb(memoryDeltaMB)}`
        : memoryDeltaMB < -0.5
          ? formatMb(memoryDeltaMB)
          : "±0"

  if (memoryUsedMB === null) {
    return (
      <MetricsSection icon="🧠" title="Memory & Rendering" collapsed={collapsed} onToggle={onToggle}>
        <Metric label="Heap">
          <SecondaryValue>Not available (Chrome only)</SecondaryValue>
        </Metric>
        <Metric label="Paint Count" tooltip="Number of paint operations.">
          {paintCount}
        </Metric>
        <Metric label="Compositor Layers" tooltip="Elements promoted to GPU layers.">
          {compositorLayers !== null ? <StatusBadge variant={layerStatus}>{compositorLayers}</StatusBadge> : "—"}
        </Metric>
      </MetricsSection>
    )
  }

  return (
    <MetricsSection icon="🧠" title="Memory & Rendering" collapsed={collapsed} onToggle={onToggle}>
      <Metric label="Heap" tooltip="Current JS heap size." sparkline={<Sparkline data={memoryHistory} />}>
        <span>
          {formatMb(memoryUsedMB)}MB
          {deltaText && <StatusBadge variant={deltaStatus}> ({deltaText})</StatusBadge>}
        </span>
      </Metric>
      <Metric label="Peak" tooltip="Peak heap memory.">
        {peakMemoryMB !== null ? `${formatMb(peakMemoryMB)}MB` : "—"}
      </Metric>
      <Metric label="DOM Nodes" tooltip="Current DOM element count.">
        {domElements !== null ? formatNumber(domElements) : "—"}
      </Metric>
      <Metric label="GC Pressure" tooltip="Memory allocation rate.">
        <StatusBadge variant={gcStatus}>
          {gcPressure > 0.01 ? `🗑️ ${formatRate(gcPressure, "MB/s")}` : "✨ Low"}
        </StatusBadge>
      </Metric>
      <Metric label="Paint / Layers" tooltip="Paint operations and compositor layers.">
        <span>{paintCount}</span>
        <SecondaryValue>
          /{" "}
          {compositorLayers !== null ? (
            <StatusBadge variant={layerStatus}>{compositorLayers} layers</StatusBadge>
          ) : (
            <span>—</span>
          )}
        </SecondaryValue>
      </Metric>
    </MetricsSection>
  )
})
