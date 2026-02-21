import React from "react"
import { Code } from "storybook/internal/components"
import { getStatusVariant } from "../../performance-types"
import { MetricsSection } from "../MetricsSection/MetricsSection"
import { Metric } from "../Metric/Metric"
import { StatusBadge } from "../StatusBadge/StatusBadge"
import type { ElementTimingDisplay } from "../../performance-types"

export const ElementTimingSection = React.memo(function ElementTimingSection({
  elementTimingCount,
  largestElementRenderTime,
  elementTimings
}: {
  elementTimingCount: number
  largestElementRenderTime: number
  elementTimings: ElementTimingDisplay[]
}) {
  if (elementTimingCount === 0) {
    return (
      <MetricsSection icon="🎯" title="Element Timing">
        <Metric label="No elements tracked" tooltip="Add data-profiler attribute to elements you want to time">
          <Code style={{ fontSize: "10px" }}>data-profiler="name"</Code>
        </Metric>
      </MetricsSection>
    )
  }
  const sortedElements = [...elementTimings].sort((a, b) => b.renderTime - a.renderTime)
  return (
    <MetricsSection icon="🎯" title="Element Timing">
      <Metric label="Elements" tooltip="Number of data-profiler elements tracked">
        <StatusBadge variant="success">
          <span>{"📍 "}</span>
          <span>{elementTimingCount}</span>
        </StatusBadge>
      </Metric>
      <Metric label="Slowest" tooltip="Slowest element to appear in DOM">
        <StatusBadge variant={getStatusVariant(largestElementRenderTime, 100, 250)}>
          <span>{largestElementRenderTime < 100 ? "⚡ " : largestElementRenderTime < 250 ? "⏱️ " : "🐌 "}</span>
          <span>{largestElementRenderTime}ms</span>
        </StatusBadge>
      </Metric>
      {sortedElements.slice(0, 3).map((el, i) => (
        <Metric
          key={el.identifier}
          label={el.identifier}
          tooltip={`Element: ${el.selector}\nTime to DOM: ${el.renderTime}ms`}
        >
          <StatusBadge variant={getStatusVariant(el.renderTime, 100, 250)}>
            <span>{i === 0 ? "🥇 " : i === 1 ? "🥈 " : "🥉 "}</span>
            <span>{el.renderTime}ms</span>
          </StatusBadge>
        </Metric>
      ))}
    </MetricsSection>
  )
})
