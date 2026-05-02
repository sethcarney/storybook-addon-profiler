import React from "react"
import { Code } from "storybook/internal/components"
import { styled } from "storybook/theming"
import { THRESHOLDS, getStatusVariant } from "../../performance-types"
import { formatMs } from "../../panel/formatters"
import { MetricsSection } from "../MetricsSection/MetricsSection"
import { Metric, SecondaryValue } from "../Metric/Metric"
import { StatusBadge } from "../StatusBadge/StatusBadge"
import type { InteractionInfo } from "../../collectors/types"

const TimingBreakdown = styled.span(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "1px",
  fontSize: "8px",
  fontFamily: theme.typography.fonts.mono
}))

const TimingPhase = styled.span<{ phase: "delay" | "process" | "paint" }>(({ theme, phase }) => {
  const colors = {
    delay: theme.color.warning,
    process: theme.color.secondary,
    paint: theme.color.positive
  }
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "1px",
    padding: "0px 2px",
    borderRadius: "2px",
    background: `${colors[phase]}22`,
    color: colors[phase],
    minWidth: "36px",
    "& > abbr": {
      textDecoration: "none",
      fontWeight: 600,
      fontSize: "7px",
      textTransform: "uppercase" as const,
      marginRight: "1px",
      opacity: 0.8
    },
    "&::after": {
      content: '"ms"',
      fontSize: "6px",
      opacity: 0.7,
      marginLeft: "1px"
    }
  }
})

const TimingArrow = styled.span(({ theme }) => ({
  color: theme.color.mediumdark,
  fontSize: "7px",
  padding: "0 1px"
}))

const InspectButton = styled.button(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1px 4px",
  fontSize: "9px",
  fontFamily: theme.typography.fonts.mono,
  borderRadius: "3px",
  border: `1px solid ${theme.color.mediumdark}`,
  color: theme.color.mediumdark,
  background: "transparent",
  cursor: "pointer",
  marginLeft: "4px",
  transition: "all 0.15s ease",
  "&:hover": {
    background: theme.color.secondary,
    borderColor: theme.color.secondary,
    color: theme.color.lightest
  },
  "&:focus": {
    outline: "none",
    boxShadow: `0 0 0 1px ${theme.color.secondary}`
  },
  "&:active": {
    transform: "scale(0.95)"
  }
}))

const NoDataHint = styled(SecondaryValue)(() => ({
  fontStyle: "italic"
}))

export const InputSection = React.memo(function InputSection({
  inputLatency,
  maxInputLatency,
  eventTimingSupported,
  inpMs,
  interactionCount,
  firstInputDelay,
  firstInputType,
  lastInteraction,
  slowestInteraction,
  onInspectElement,
  collapsed,
  onToggle
}: {
  inputLatency: number
  maxInputLatency: number
  eventTimingSupported: boolean
  inpMs: number
  interactionCount: number
  firstInputDelay: number | null
  firstInputType: string | null
  lastInteraction: InteractionInfo | null
  slowestInteraction: InteractionInfo | null
  onInspectElement: (s: string) => void
  collapsed?: boolean
  onToggle?: () => void
}) {
  const inputStatus = getStatusVariant(inputLatency, THRESHOLDS.INPUT_LATENCY_GOOD, THRESHOLDS.INPUT_LATENCY_WARNING)
  const inpStatus = getStatusVariant(inpMs, THRESHOLDS.INP_GOOD, THRESHOLDS.INP_WARNING)

  const getInteractionStatus = (interaction: InteractionInfo | null) => {
    if (!interaction) return "neutral"
    return getStatusVariant(interaction.duration, THRESHOLDS.INP_GOOD, THRESHOLDS.INP_WARNING)
  }

  const handleInspect = (selector: string) => {
    if (selector && selector !== "unknown") onInspectElement(selector)
  }

  const renderTimingBreakdown = (interaction: InteractionInfo) => (
    <TimingBreakdown>
      <TimingPhase phase="delay">
        <abbr title="Input delay">wait</abbr>
        {Math.round(interaction.inputDelay)}
      </TimingPhase>
      <TimingArrow>→</TimingArrow>
      <TimingPhase phase="process">
        <abbr title="Processing time">js</abbr>
        {Math.round(interaction.processingTime)}
      </TimingPhase>
      <TimingArrow>→</TimingArrow>
      <TimingPhase phase="paint">
        <abbr title="Presentation delay">paint</abbr>
        {Math.round(interaction.presentationDelay)}
      </TimingPhase>
    </TimingBreakdown>
  )

  const renderInteractionDetail = (interaction: InteractionInfo | null) => {
    if (!eventTimingSupported || !interaction) return null
    return (
      <>
        {interaction.eventType}
        <span>·</span>
        {renderTimingBreakdown(interaction)}
        {interaction.targetSelector !== "unknown" && (
          <>
            <span>·</span>
            <Code>{interaction.targetSelector.slice(0, 18)}</Code>
            <InspectButton onClick={() => handleInspect(interaction.targetSelector)} title="Highlight element">
              🔍
            </InspectButton>
          </>
        )}
      </>
    )
  }

  return (
    <MetricsSection icon="👇" title="Input Responsiveness" collapsed={collapsed} onToggle={onToggle}>
      <Metric
        label="INP"
        isWebVital
        tooltip="Interaction to Next Paint - Core Web Vital. Good: ≤200ms, Poor: >500ms."
        reserveDetailSpace
        detail={eventTimingSupported && interactionCount > 0 ? <>{interactionCount} interactions</> : null}
      >
        {!eventTimingSupported ? (
          <NoDataHint>Chrome/Edge only</NoDataHint>
        ) : interactionCount > 0 ? (
          <StatusBadge variant={inpStatus}>{Math.round(inpMs)}ms</StatusBadge>
        ) : (
          <SecondaryValue>—</SecondaryValue>
        )}
      </Metric>
      <Metric
        label="Last Interaction"
        tooltip="Most recent user interaction with timing breakdown."
        reserveDetailSpace
        detail={renderInteractionDetail(lastInteraction)}
      >
        {!eventTimingSupported ? (
          <NoDataHint>Chrome/Edge only</NoDataHint>
        ) : lastInteraction ? (
          <StatusBadge variant={getInteractionStatus(lastInteraction)}>
            {Math.round(lastInteraction.duration)}ms
          </StatusBadge>
        ) : (
          <SecondaryValue>—</SecondaryValue>
        )}
      </Metric>
      <Metric
        label="Slowest"
        tooltip="Slowest interaction observed."
        reserveDetailSpace
        detail={renderInteractionDetail(slowestInteraction)}
      >
        {!eventTimingSupported ? (
          <NoDataHint>Chrome/Edge only</NoDataHint>
        ) : slowestInteraction ? (
          <StatusBadge variant={getInteractionStatus(slowestInteraction)}>
            {Math.round(slowestInteraction.duration)}ms
          </StatusBadge>
        ) : (
          <SecondaryValue>—</SecondaryValue>
        )}
      </Metric>
      <Metric
        label="FID"
        isWebVital
        tooltip="First Input Delay."
        reserveDetailSpace
        detail={firstInputType ? <>{firstInputType}</> : null}
      >
        {firstInputDelay !== null ? (
          <StatusBadge variant={getStatusVariant(firstInputDelay, 100, 300)}>
            {Math.round(firstInputDelay)}ms
          </StatusBadge>
        ) : (
          <SecondaryValue>—</SecondaryValue>
        )}
      </Metric>
      <Metric label="Pointer Latency" tooltip="Time from pointer move to next frame.">
        <StatusBadge variant={inputStatus}>{formatMs(inputLatency)}</StatusBadge>
        <SecondaryValue>/ {formatMs(maxInputLatency)} max</SecondaryValue>
      </Metric>
    </MetricsSection>
  )
})
