import React from "react"
import { THRESHOLDS, getStatusVariant, getZeroIsGoodStatus } from "../../performance-types"
import { formatScore } from "../../panel/formatters"
import { MetricsSection } from "../MetricsSection/MetricsSection"
import { Metric } from "../Metric/Metric"
import { StatusBadge } from "../StatusBadge/StatusBadge"

export const LayoutAndInternalsSection = React.memo(function LayoutAndInternalsSection({
  layoutShiftScore,
  layoutShiftCount,
  currentSessionCLS,
  forcedReflowCount,
  styleWrites,
  cssVarChanges,
  inputJitter,
  collapsed,
  onToggle
}: {
  layoutShiftScore: number
  layoutShiftCount: number
  currentSessionCLS: number
  forcedReflowCount: number
  styleWrites: number
  cssVarChanges: number
  inputJitter: number
  collapsed?: boolean
  onToggle?: () => void
}) {
  const clsStatus = getStatusVariant(layoutShiftScore, THRESHOLDS.CLS_GOOD, THRESHOLDS.CLS_WARNING)
  const detailParts: string[] = []
  if (layoutShiftCount > 0) detailParts.push(`${layoutShiftCount} shifts`)
  if (currentSessionCLS > 0) detailParts.push(`session: ${formatScore(currentSessionCLS)}`)

  return (
    <MetricsSection icon="📐" title="Layout & Stability" collapsed={collapsed} onToggle={onToggle}>
      <Metric
        label="CLS"
        isWebVital
        tooltip="Cumulative Layout Shift. Core Web Vital. Good: <0.1, Poor: >0.25."
        detail={detailParts.length > 0 ? <>{detailParts.join(" · ")}</> : null}
      >
        <StatusBadge variant={clsStatus}>
          {layoutShiftScore === 0
            ? "🎯 0"
            : layoutShiftScore > 0.25
              ? `📦 ${formatScore(layoutShiftScore)}`
              : formatScore(layoutShiftScore)}
        </StatusBadge>
      </Metric>
      <Metric label="Forced Reflows" tooltip="Layout reads after style writes force synchronous layout.">
        <StatusBadge variant={getStatusVariant(forcedReflowCount, 0, THRESHOLDS.FORCED_REFLOW_WARNING)}>
          <span>{forcedReflowCount === 0 ? "✨ " : "💥 "}</span>
          <span>{forcedReflowCount}</span>
        </StatusBadge>
      </Metric>
      <Metric
        label="Style Writes"
        tooltip="Inline style mutations."
        detail={cssVarChanges > 0 ? <>{cssVarChanges} CSS var changes</> : null}
      >
        <span>
          {"🎨 "}
          {styleWrites}
        </span>
      </Metric>
      <Metric label="Input Jitter" tooltip="Unexpected input latency spikes.">
        <StatusBadge variant={getZeroIsGoodStatus(inputJitter)}>
          {inputJitter === 0 ? "✨ None" : `😵 ${inputJitter} hitches`}
        </StatusBadge>
      </Metric>
    </MetricsSection>
  )
})
