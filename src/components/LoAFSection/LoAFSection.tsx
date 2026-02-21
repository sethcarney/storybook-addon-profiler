import React from "react"
import { Code } from "storybook/internal/components"
import { THRESHOLDS, getStatusVariant } from "../../performance-types"
import { MetricsSection } from "../MetricsSection/MetricsSection"
import { Metric, SecondaryValue } from "../Metric/Metric"
import { StatusBadge } from "../StatusBadge/StatusBadge"
import type { LoafDetails } from "../../collectors/types"

export const LoAFSection = React.memo(function LoAFSection({
  loafSupported,
  loafCount,
  totalLoafBlockingDuration,
  longestLoafDuration,
  longestLoafBlockingDuration,
  avgLoafDuration,
  p95LoafDuration,
  loafsWithScripts,
  worstLoaf
}: {
  loafSupported: boolean
  loafCount: number
  totalLoafBlockingDuration: number
  longestLoafDuration: number
  longestLoafBlockingDuration: number
  avgLoafDuration: number
  p95LoafDuration: number
  loafsWithScripts: number
  worstLoaf: LoafDetails | null
}) {
  if (!loafSupported) {
    return (
      <MetricsSection icon="🎞️" title="Long Animation Frames">
        <Metric label="Status" tooltip="Long Animation Frames API requires Chrome 123+">
          <StatusBadge variant="neutral">
            <span>⚠️ Not supported</span>
          </StatusBadge>
        </Metric>
      </MetricsSection>
    )
  }

  return (
    <MetricsSection icon="🎞️" title="Long Animation Frames">
      <Metric
        label="LoAF Count"
        tooltip="Animation frames exceeding 50ms."
        detail={loafsWithScripts > 0 ? <>{loafsWithScripts} with scripts</> : null}
      >
        <StatusBadge variant={getStatusVariant(loafCount, 0, THRESHOLDS.LOAF_COUNT_WARNING)}>
          <span>{loafCount === 0 ? "✨ " : loafCount > 10 ? "🐢 " : "⚠️ "}</span>
          <span>{loafCount}</span>
        </StatusBadge>
      </Metric>
      <Metric
        label="Blocking"
        tooltip="Total blocking duration from all LoAFs."
        detail={longestLoafBlockingDuration > 0 ? <>worst: {longestLoafBlockingDuration}ms</> : null}
      >
        <StatusBadge variant={getStatusVariant(totalLoafBlockingDuration, 0, THRESHOLDS.LOAF_BLOCKING_WARNING)}>
          <span>{totalLoafBlockingDuration === 0 ? "🚀 " : totalLoafBlockingDuration > 500 ? "💥 " : "⏳ "}</span>
          <span>{totalLoafBlockingDuration}ms</span>
        </StatusBadge>
      </Metric>
      <Metric
        label="Longest"
        tooltip="Longest long animation frame."
        detail={avgLoafDuration > 0 ? <>avg: {avgLoafDuration}ms</> : null}
      >
        <StatusBadge variant={getStatusVariant(longestLoafDuration, 0, THRESHOLDS.LOAF_DURATION_WARNING)}>
          <span>{longestLoafDuration === 0 ? "✨ " : longestLoafDuration > 200 ? "🐌 " : "⏱️ "}</span>
          <span>{longestLoafDuration}ms</span>
        </StatusBadge>
      </Metric>
      <Metric label="P95 Duration" tooltip="95th percentile LoAF duration.">
        <StatusBadge variant={getStatusVariant(p95LoafDuration, 0, THRESHOLDS.LOAF_DURATION_WARNING)}>
          <span>{p95LoafDuration === 0 ? "✨ " : "📊 "}</span>
          <span>{p95LoafDuration}ms</span>
        </StatusBadge>
      </Metric>
      {worstLoaf?.topScript && (
        <Metric
          label="Top Script"
          tooltip={`Worst LoAF: ${worstLoaf.topScript.invokerType} (${worstLoaf.topScript.invoker})`}
        >
          <Code style={{ fontSize: "10px", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis" }}>
            {worstLoaf.topScript.sourceFunctionName || worstLoaf.topScript.invoker}
          </Code>
          <SecondaryValue>{Math.round(worstLoaf.topScript.duration)}ms</SecondaryValue>
        </Metric>
      )}
    </MetricsSection>
  )
})
