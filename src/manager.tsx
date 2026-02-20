import { addons, types, useStorybookState, useChannel } from 'storybook/manager-api'
import { SyncIcon } from '@storybook/icons'
import React from 'react'
import { Badge, WithTooltip, TooltipNote, Code, AddonPanel, Button } from 'storybook/internal/components'
import { styled, useTheme } from 'storybook/theming'

import {
  ADDON_ID,
  PANEL_ID,
  PERF_EVENTS,
  THRESHOLDS,
  DEFAULT_METRICS,
  getStatusVariant,
  getZeroIsGoodStatus,
} from './performance-types'
import type { PerformanceMetrics, ElementTimingDisplay } from './performance-types'
import type { InteractionInfo, LoafDetails } from './collectors/types'
import {
  formatMs,
  formatMb,
  formatNumber,
  formatScore,
  formatPercent,
  formatRate,
} from './panel/formatters'

// ============================================================================
// Styled Components
// ============================================================================

const PanelWrapper = styled.div(({ theme }) => ({
  display: 'flex',
  fontFamily: theme.typography.fonts.mono,
  fontSize: '11px',
  lineHeight: 1.4,
  color: theme.color.defaultText,
  height: '100%',
  background: theme.background.content,
}))

const ContentArea = styled.div({
  flex: 1,
  overflow: 'auto',
  padding: '4px',
})

const SideToolbar = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: '4px',
  padding: '4px',
  borderLeft: `1px solid ${theme.appBorderColor}`,
  background: theme.barBg,
}))

const SectionsGrid = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '4px',
})

const Section = styled.section(({ theme }) => ({
  background: theme.background.app,
  borderRadius: theme.appBorderRadius,
  border: `1px solid ${theme.appBorderColor}`,
}))

const SectionHeader = styled.header<{ clickable?: boolean }>(({ theme, clickable }) => ({
  padding: '4px 8px',
  background: theme.barBg,
  borderBottom: `1px solid ${theme.appBorderColor}`,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  cursor: clickable ? 'pointer' : 'default',
  userSelect: 'none' as const,
  '&:hover': clickable ? { background: theme.background.hoverable } : {},
}))

const CollapseToggle = styled.span<{ collapsed: boolean }>(({ theme, collapsed }) => ({
  marginLeft: 'auto',
  fontSize: '8px',
  color: theme.color.mediumdark,
  transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
  transition: 'transform 0.15s ease',
  display: 'inline-flex',
  alignItems: 'center',
}))

const SectionTitle = styled.h3(({ theme }) => ({
  margin: 0,
  fontSize: '10px',
  fontWeight: theme.typography.weight.bold,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  color: theme.color.defaultText,
}))

const SectionIcon = styled.span({
  fontSize: '12px',
})

const MetricsList = styled.dl({
  margin: 0,
  padding: '2px 0',
})

const MetricItem = styled.div(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: '1px 6px',
  padding: '2px 8px',
  minHeight: '20px',
  borderBottom: `1px solid ${theme.appBorderColor}`,
  position: 'relative' as const,
  '&:last-child': {
    borderBottom: 'none',
  },
}))

const MetricItemWithDetail = styled(MetricItem)({
  minHeight: '36px',
  alignItems: 'start',
})

const MetricLabel = styled.dt(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '10px',
  color: theme.color.mediumdark,
  margin: 0,
  gridColumn: '1',
  gridRow: '1 / -1',
  alignSelf: 'center',
  minHeight: '16px',
}))

const MetricValue = styled.dd(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '6px',
  fontSize: '11px',
  fontWeight: theme.typography.weight.bold,
  fontFamily: theme.typography.fonts.mono,
  color: theme.color.defaultText,
  margin: 0,
  textAlign: 'right' as const,
  gridColumn: '2',
  minWidth: '60px',
  minHeight: '16px',
}))

const DetailValue = styled.dd(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '4px',
  fontSize: '9px',
  fontWeight: 'normal',
  fontFamily: theme.typography.fonts.mono,
  color: theme.color.mediumdark,
  margin: 0,
  textAlign: 'right' as const,
  gridColumn: '2',
  flexWrap: 'wrap' as const,
  minHeight: '14px',
  minWidth: '130px',
}))

const SecondaryValue = styled.span(({ theme }) => ({
  fontSize: '10px',
  fontWeight: 'normal',
  color: theme.color.mediumdark,
}))

const InfoIcon = styled.button(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '13px',
  height: '13px',
  fontSize: '11px',
  fontWeight: 'normal',
  fontStyle: 'normal',
  fontFamily: 'system-ui, sans-serif',
  borderRadius: '50%',
  border: `1px solid ${theme.color.mediumdark}`,
  color: theme.color.mediumdark,
  background: 'transparent',
  padding: 0,
  userSelect: 'none' as const,
  lineHeight: 1,
  cursor: 'default',
  opacity: 0.7,
  transition: 'opacity 0.1s ease',
  '&:hover': {
    opacity: 1,
    color: theme.color.secondary,
  },
  '&:focus': {
    outline: 'none',
    boxShadow: `0 0 0 1px ${theme.color.secondary}`,
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${theme.color.secondary}`,
  },
}))

const SparklineContainer = styled.div({
  display: 'flex',
  alignItems: 'center',
  height: '16px',
})

const SparklineRow = styled.div({
  gridColumn: '1 / -1',
  display: 'flex',
  justifyContent: 'flex-end',
  paddingBottom: '1px',
})

const EmptyState = styled.div(({ theme }) => ({
  padding: '24px',
  textAlign: 'center' as const,
  color: theme.color.mediumdark,
}))

const EmptyStateTitle = styled.p(({ theme }) => ({
  fontSize: '12px',
  color: theme.color.defaultText,
  marginBottom: '8px',
}))

const EmptyStateSubtitle = styled.p(({ theme }) => ({
  fontSize: '10px',
  color: theme.color.mediumdark,
  opacity: 0.7,
  margin: 0,
}))

const EmptyStateHint = styled.p(({ theme }) => ({
  fontSize: '10px',
  color: theme.color.mediumdark,
  margin: 0,
}))

const NoDataHint = styled(SecondaryValue)(() => ({
  fontStyle: 'italic',
}))

const InspectButton = styled.button(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1px 4px',
  fontSize: '9px',
  fontFamily: theme.typography.fonts.mono,
  borderRadius: '3px',
  border: `1px solid ${theme.color.mediumdark}`,
  color: theme.color.mediumdark,
  background: 'transparent',
  cursor: 'pointer',
  marginLeft: '4px',
  transition: 'all 0.15s ease',
  '&:hover': {
    background: theme.color.secondary,
    borderColor: theme.color.secondary,
    color: theme.color.lightest,
  },
  '&:focus': {
    outline: 'none',
    boxShadow: `0 0 0 1px ${theme.color.secondary}`,
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}))

const WebVitalBadge = styled.span(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1px',
  padding: '1px 4px',
  fontSize: '7px',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.3px',
  borderRadius: '3px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#fff',
  marginLeft: '4px',
  boxShadow: '0 1px 2px rgba(102, 126, 234, 0.3)',
  '&::before': {
    content: '"⚡"',
    fontSize: '7px',
  },
}))

const TimingBreakdown = styled.span(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1px',
  fontSize: '8px',
  fontFamily: theme.typography.fonts.mono,
}))

const TimingPhase = styled.span<{ phase: 'delay' | 'process' | 'paint' }>(
  ({ theme, phase }) => {
    const colors = {
      delay: theme.color.warning,
      process: theme.color.secondary,
      paint: theme.color.positive,
    }
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '1px',
      padding: '0px 2px',
      borderRadius: '2px',
      background: `${colors[phase]}22`,
      color: colors[phase],
      minWidth: '36px',
      '& > abbr': {
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '7px',
        textTransform: 'uppercase' as const,
        marginRight: '1px',
        opacity: 0.8,
      },
      '&::after': {
        content: '"ms"',
        fontSize: '6px',
        opacity: 0.7,
        marginLeft: '1px',
      },
    }
  },
)

const TimingArrow = styled.span(({ theme }) => ({
  color: theme.color.mediumdark,
  fontSize: '7px',
  padding: '0 1px',
}))

// ============================================================================
// Badge status mapping
// ============================================================================

const VARIANT_TO_BADGE_STATUS: Record<string, 'positive' | 'warning' | 'negative' | 'neutral'> = {
  success: 'positive',
  warning: 'warning',
  error: 'negative',
  neutral: 'neutral',
}

const StatusBadge = React.memo(function StatusBadge({
  variant,
  children,
}: {
  variant: string
  children: React.ReactNode
}) {
  return <Badge status={VARIANT_TO_BADGE_STATUS[variant] || 'neutral'}>{children}</Badge>
})

// ============================================================================
// Sparkline Component
// ============================================================================

const Sparkline = React.memo(function Sparkline({
  data,
  width = 80,
  height = 20,
  goodThreshold,
  badThreshold,
  higherIsBetter = false,
}: {
  data: number[]
  width?: number
  height?: number
  goodThreshold?: number
  badThreshold?: number
  higherIsBetter?: boolean
}) {
  const theme = useTheme()

  const { pathData, min, max, currentValue, getY } = React.useMemo(() => {
    if (data.length < 2) {
      return { pathData: '', min: 0, max: 0, currentValue: 0, getY: () => height / 2 }
    }
    const padding = 2
    const innerWidth = width - padding * 2
    const innerHeight = height - padding * 2
    const minVal = Math.min(...data)
    const maxVal = Math.max(...data)
    const range = maxVal - minVal || 1
    const getX = (index: number) => padding + (index / (data.length - 1)) * innerWidth
    const getYFn = (value: number) =>
      padding + innerHeight - ((value - minVal) / range) * innerHeight
    const path = data
      .map((value, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getYFn(value).toFixed(1)}`)
      .join(' ')
    return {
      pathData: path,
      min: minVal,
      max: maxVal,
      currentValue: data[data.length - 1] ?? NaN,
      getY: getYFn,
    }
  }, [data, width, height])

  if (data.length < 2) {
    return (
      <SparklineContainer>
        <svg width={width} height={height} aria-hidden="true">
          <line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke={theme.color.medium}
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        </svg>
      </SparklineContainer>
    )
  }

  const padding = 2
  const getX = (index: number) => padding + (index / (data.length - 1)) * (width - padding * 2)

  let lineColor = theme.color.secondary
  if (goodThreshold !== undefined) {
    const isGood = higherIsBetter ? currentValue >= goodThreshold : currentValue <= goodThreshold
    const isBad =
      badThreshold !== undefined &&
      (higherIsBetter ? currentValue < badThreshold : currentValue > badThreshold)
    if (isBad) lineColor = theme.color.negative
    else if (isGood) lineColor = theme.color.positive
    else lineColor = theme.color.warning
  }

  return (
    <SparklineContainer>
      <svg width={width} height={height} aria-hidden="true">
        {goodThreshold !== undefined &&
          goodThreshold >= min &&
          goodThreshold <= max && (
            <line
              x1={padding}
              y1={getY(goodThreshold)}
              x2={width - padding}
              y2={getY(goodThreshold)}
              stroke={theme.color.medium}
              strokeWidth={1}
              strokeDasharray="2,2"
              opacity={0.5}
            />
          )}
        <path d={pathData} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={getX(data.length - 1)} cy={getY(currentValue)} r={2.5} fill={lineColor} />
      </svg>
    </SparklineContainer>
  )
})

// ============================================================================
// Generic Metric Component
// ============================================================================

const getStatus = getStatusVariant
const getZeroStatus = getZeroIsGoodStatus

const Metric = React.memo(function Metric({
  label,
  tooltip,
  sparkline,
  isWebVital,
  detail,
  reserveDetailSpace,
  children,
}: {
  label: string
  tooltip?: string
  sparkline?: React.ReactNode
  isWebVital?: boolean
  detail?: React.ReactNode
  reserveDetailSpace?: boolean
  children: React.ReactNode
}) {
  const hasDetail = detail || reserveDetailSpace
  const Container = hasDetail ? MetricItemWithDetail : MetricItem
  return (
    <Container>
      {sparkline ? <SparklineRow>{sparkline}</SparklineRow> : null}
      <MetricLabel>
        {label}
        {isWebVital && <WebVitalBadge>Vital</WebVitalBadge>}
        {tooltip && (
          <WithTooltip
            tooltip={<TooltipNote note={tooltip} />}
            trigger="hover"
            closeOnOutsideClick
          >
            <InfoIcon type="button" aria-label={`Info about ${label}`}>
              i
            </InfoIcon>
          </WithTooltip>
        )}
      </MetricLabel>
      <MetricValue>{children}</MetricValue>
      {hasDetail ? <DetailValue>{detail}</DetailValue> : null}
    </Container>
  )
})

const MetricsSection = React.memo(function MetricsSection({
  icon,
  title,
  children,
  defaultCollapsed = false,
}: {
  icon: string
  title: string
  children: React.ReactNode
  defaultCollapsed?: boolean
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
  return (
    <Section>
      <SectionHeader clickable onClick={() => setCollapsed((c) => !c)}>
        <SectionIcon>{icon}</SectionIcon>
        <SectionTitle>{title}</SectionTitle>
        <CollapseToggle collapsed={collapsed}>▼</CollapseToggle>
      </SectionHeader>
      {!collapsed && <MetricsList>{children}</MetricsList>}
    </Section>
  )
})

// ============================================================================
// Section Components
// ============================================================================

const FrameTimingSection = React.memo(function FrameTimingSection({
  fps, fpsHistory, frameTime, maxFrameTime, frameTimeHistory,
  droppedFrames, frameJitter, frameStability, paintTime, maxPaintTime, paintJitter,
}: {
  fps: number; fpsHistory: number[]; frameTime: number; maxFrameTime: number
  frameTimeHistory: number[]; droppedFrames: number; frameJitter: number
  frameStability: number; paintTime: number; maxPaintTime: number; paintJitter: number
}) {
  const fpsStatus = getStatus(fps, THRESHOLDS.FPS_GOOD, THRESHOLDS.FPS_WARNING, true)
  const droppedStatus = droppedFrames > THRESHOLDS.DROPPED_FRAMES_WARNING ? 'error' : droppedFrames > 0 ? 'warning' : 'success'
  const frameJitterStatus = getZeroStatus(frameJitter)
  const stabilityStatus = frameStability >= 90 ? 'success' : frameStability >= 70 ? 'warning' : 'error'
  const paintJitterStatus = getZeroStatus(paintJitter)

  return (
    <MetricsSection icon="📊" title="Frame Timing">
      <Metric label="FPS" tooltip="Frames per second. Target: 60fps. Below 30 causes visible stuttering."
        sparkline={<Sparkline data={fpsHistory} goodThreshold={THRESHOLDS.FPS_GOOD} badThreshold={THRESHOLDS.FPS_WARNING} higherIsBetter />}>
        <StatusBadge variant={fpsStatus}>{fps}</StatusBadge>
      </Metric>
      <Metric label="Frame Time" tooltip="Average time per frame. Target: ≤16.67ms for 60fps."
        sparkline={<Sparkline data={frameTimeHistory} goodThreshold={THRESHOLDS.FRAME_TIME_TARGET} badThreshold={THRESHOLDS.FRAME_TIME_WARNING} />}
        detail={<>max {formatMs(maxFrameTime)}</>}>
        {formatMs(frameTime)}
      </Metric>
      <Metric label="Dropped Frames" tooltip="Frames taking >2× expected time. High count indicates stuttering.">
        <StatusBadge variant={droppedStatus}>
          <span>{droppedFrames}</span>
          {droppedFrames === 0 ? <span>{' ✨'}</span> : <span>{' 💧'}</span>}
        </StatusBadge>
      </Metric>
      <Metric label="Frame Jitter" tooltip="Sudden spikes in frame time vs recent baseline.">
        <StatusBadge variant={frameJitterStatus}>
          {frameJitter === 0 ? '✨ Smooth' : `⚡ ${frameJitter} spikes`}
        </StatusBadge>
      </Metric>
      <Metric label="Frame Stability" tooltip="Frame time consistency (0-100%). 100% = perfectly smooth.">
        <StatusBadge variant={stabilityStatus}>
          <span>{frameStability >= 90 ? '🎯 ' : frameStability >= 70 ? '📊 ' : '📉 '}</span>
          <span>{frameStability}%</span>
        </StatusBadge>
      </Metric>
      <Metric label="Paint Time" tooltip="Browser rendering time via double-RAF technique.">
        {formatMs(paintTime)}
        <SecondaryValue>/ {formatMs(maxPaintTime)} max</SecondaryValue>
      </Metric>
      <Metric label="Paint Jitter" tooltip="Sudden spikes in paint time vs recent baseline.">
        <StatusBadge variant={paintJitterStatus}>
          {paintJitter === 0 ? '✨ None' : `🎨 ${paintJitter} spikes`}
        </StatusBadge>
      </Metric>
    </MetricsSection>
  )
})

const InputSection = React.memo(function InputSection({
  inputLatency, maxInputLatency, eventTimingSupported, inpMs, interactionCount,
  firstInputDelay, firstInputType, lastInteraction, slowestInteraction, onInspectElement,
}: {
  inputLatency: number; maxInputLatency: number; eventTimingSupported: boolean
  inpMs: number; interactionCount: number; firstInputDelay: number | null
  firstInputType: string | null; lastInteraction: InteractionInfo | null
  slowestInteraction: InteractionInfo | null; onInspectElement: (s: string) => void
}) {
  const inputStatus = getStatus(inputLatency, THRESHOLDS.INPUT_LATENCY_GOOD, THRESHOLDS.INPUT_LATENCY_WARNING)
  const inpStatus = getStatus(inpMs, THRESHOLDS.INP_GOOD, THRESHOLDS.INP_WARNING)

  const getInteractionStatus = (interaction: InteractionInfo | null) => {
    if (!interaction) return 'neutral'
    return getStatus(interaction.duration, THRESHOLDS.INP_GOOD, THRESHOLDS.INP_WARNING)
  }

  const handleInspect = (selector: string) => {
    if (selector && selector !== 'unknown') onInspectElement(selector)
  }

  const renderTimingBreakdown = (interaction: InteractionInfo) => (
    <TimingBreakdown>
      <TimingPhase phase="delay">
        <abbr title="Input delay">wait</abbr>{Math.round(interaction.inputDelay)}
      </TimingPhase>
      <TimingArrow>→</TimingArrow>
      <TimingPhase phase="process">
        <abbr title="Processing time">js</abbr>{Math.round(interaction.processingTime)}
      </TimingPhase>
      <TimingArrow>→</TimingArrow>
      <TimingPhase phase="paint">
        <abbr title="Presentation delay">paint</abbr>{Math.round(interaction.presentationDelay)}
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
        {interaction.targetSelector !== 'unknown' && (
          <>
            <span>·</span>
            <Code>{interaction.targetSelector.slice(0, 18)}</Code>
            <InspectButton onClick={() => handleInspect(interaction.targetSelector)} title="Highlight element">🔍</InspectButton>
          </>
        )}
      </>
    )
  }

  return (
    <MetricsSection icon="👇" title="Input Responsiveness">
      <Metric label="INP" isWebVital tooltip="Interaction to Next Paint - Core Web Vital. Good: ≤200ms, Poor: >500ms." reserveDetailSpace
        detail={eventTimingSupported && interactionCount > 0 ? <>{interactionCount} interactions</> : null}>
        {!eventTimingSupported ? <NoDataHint>Chrome/Edge only</NoDataHint>
          : interactionCount > 0 ? <StatusBadge variant={inpStatus}>{Math.round(inpMs)}ms</StatusBadge>
          : <SecondaryValue>—</SecondaryValue>}
      </Metric>
      <Metric label="Last Interaction" tooltip="Most recent user interaction with timing breakdown." reserveDetailSpace
        detail={renderInteractionDetail(lastInteraction)}>
        {!eventTimingSupported ? <NoDataHint>Chrome/Edge only</NoDataHint>
          : lastInteraction ? <StatusBadge variant={getInteractionStatus(lastInteraction)}>{Math.round(lastInteraction.duration)}ms</StatusBadge>
          : <SecondaryValue>—</SecondaryValue>}
      </Metric>
      <Metric label="Slowest" tooltip="Slowest interaction observed." reserveDetailSpace
        detail={renderInteractionDetail(slowestInteraction)}>
        {!eventTimingSupported ? <NoDataHint>Chrome/Edge only</NoDataHint>
          : slowestInteraction ? <StatusBadge variant={getInteractionStatus(slowestInteraction)}>{Math.round(slowestInteraction.duration)}ms</StatusBadge>
          : <SecondaryValue>—</SecondaryValue>}
      </Metric>
      <Metric label="FID" isWebVital tooltip="First Input Delay." reserveDetailSpace
        detail={firstInputType ? <>{firstInputType}</> : null}>
        {firstInputDelay !== null
          ? <StatusBadge variant={getStatus(firstInputDelay, 100, 300)}>{Math.round(firstInputDelay)}ms</StatusBadge>
          : <SecondaryValue>—</SecondaryValue>}
      </Metric>
      <Metric label="Pointer Latency" tooltip="Time from pointer move to next frame.">
        <StatusBadge variant={inputStatus}>{formatMs(inputLatency)}</StatusBadge>
        <SecondaryValue>/ {formatMs(maxInputLatency)} max</SecondaryValue>
      </Metric>
    </MetricsSection>
  )
})

const MainThreadSection = React.memo(function MainThreadSection({
  longTasks, longestTask, totalBlockingTime, thrashingScore, domMutationsPerFrame,
}: {
  longTasks: number; longestTask: number; totalBlockingTime: number
  thrashingScore: number; domMutationsPerFrame: number
}) {
  return (
    <MetricsSection icon="⏱️" title="Main Thread">
      <Metric label="Long Tasks" tooltip="Tasks blocking main thread >50ms."
        detail={longestTask > 0 ? <>longest: {Math.round(longestTask)}ms</> : null}>
        <StatusBadge variant={getStatus(longTasks, 0, THRESHOLDS.LONG_TASKS_WARNING)}>
          <span>{longTasks === 0 ? '✨ ' : '🐢 '}</span><span>{longTasks}</span>
        </StatusBadge>
      </Metric>
      <Metric label="TBT" isWebVital tooltip="Total Blocking Time. Good: <200ms, Poor: >600ms.">
        <StatusBadge variant={getStatus(totalBlockingTime, 0, THRESHOLDS.TBT_WARNING)}>
          <span>{totalBlockingTime === 0 ? '🚀 ' : totalBlockingTime > 600 ? '💥 ' : '⏳ '}</span>
          <span>{totalBlockingTime}ms</span>
        </StatusBadge>
      </Metric>
      <Metric label="Thrashing" tooltip="Frame blocking >50ms near style writes.">
        <StatusBadge variant={getZeroStatus(thrashingScore)}>
          {thrashingScore === 0 ? '✨ None' : `🔄 ${thrashingScore} stalls`}
        </StatusBadge>
      </Metric>
      <Metric label="DOM Churn" tooltip="DOM mutations per sample period.">
        <StatusBadge variant={getStatus(domMutationsPerFrame, 0, THRESHOLDS.DOM_MUTATIONS_WARNING)}>
          <span>{domMutationsPerFrame === 0 ? '✨ ' : domMutationsPerFrame > 10 ? '🌪️ ' : '🔨 '}</span>
          <span>{domMutationsPerFrame}</span>
        </StatusBadge>
        <SecondaryValue>/period</SecondaryValue>
      </Metric>
    </MetricsSection>
  )
})

const LoAFSection = React.memo(function LoAFSection({
  loafSupported, loafCount, totalLoafBlockingDuration, longestLoafDuration,
  longestLoafBlockingDuration, avgLoafDuration, p95LoafDuration, loafsWithScripts, worstLoaf,
}: {
  loafSupported: boolean; loafCount: number; totalLoafBlockingDuration: number
  longestLoafDuration: number; longestLoafBlockingDuration: number; avgLoafDuration: number
  p95LoafDuration: number; loafsWithScripts: number; worstLoaf: LoafDetails | null
}) {
  if (!loafSupported) {
    return (
      <MetricsSection icon="🎞️" title="Long Animation Frames">
        <Metric label="Status" tooltip="Long Animation Frames API requires Chrome 123+">
          <StatusBadge variant="neutral"><span>⚠️ Not supported</span></StatusBadge>
        </Metric>
      </MetricsSection>
    )
  }

  return (
    <MetricsSection icon="🎞️" title="Long Animation Frames">
      <Metric label="LoAF Count" tooltip="Animation frames exceeding 50ms."
        detail={loafsWithScripts > 0 ? <>{loafsWithScripts} with scripts</> : null}>
        <StatusBadge variant={getStatus(loafCount, 0, THRESHOLDS.LOAF_COUNT_WARNING)}>
          <span>{loafCount === 0 ? '✨ ' : loafCount > 10 ? '🐢 ' : '⚠️ '}</span>
          <span>{loafCount}</span>
        </StatusBadge>
      </Metric>
      <Metric label="Blocking" tooltip="Total blocking duration from all LoAFs."
        detail={longestLoafBlockingDuration > 0 ? <>worst: {longestLoafBlockingDuration}ms</> : null}>
        <StatusBadge variant={getStatus(totalLoafBlockingDuration, 0, THRESHOLDS.LOAF_BLOCKING_WARNING)}>
          <span>{totalLoafBlockingDuration === 0 ? '🚀 ' : totalLoafBlockingDuration > 500 ? '💥 ' : '⏳ '}</span>
          <span>{totalLoafBlockingDuration}ms</span>
        </StatusBadge>
      </Metric>
      <Metric label="Longest" tooltip="Longest long animation frame."
        detail={avgLoafDuration > 0 ? <>avg: {avgLoafDuration}ms</> : null}>
        <StatusBadge variant={getStatus(longestLoafDuration, 0, THRESHOLDS.LOAF_DURATION_WARNING)}>
          <span>{longestLoafDuration === 0 ? '✨ ' : longestLoafDuration > 200 ? '🐌 ' : '⏱️ '}</span>
          <span>{longestLoafDuration}ms</span>
        </StatusBadge>
      </Metric>
      <Metric label="P95 Duration" tooltip="95th percentile LoAF duration.">
        <StatusBadge variant={getStatus(p95LoafDuration, 0, THRESHOLDS.LOAF_DURATION_WARNING)}>
          <span>{p95LoafDuration === 0 ? '✨ ' : '📊 '}</span>
          <span>{p95LoafDuration}ms</span>
        </StatusBadge>
      </Metric>
      {worstLoaf?.topScript && (
        <Metric label="Top Script" tooltip={`Worst LoAF: ${worstLoaf.topScript.invokerType} (${worstLoaf.topScript.invoker})`}>
          <Code style={{ fontSize: '10px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {worstLoaf.topScript.sourceFunctionName || worstLoaf.topScript.invoker}
          </Code>
          <SecondaryValue>{Math.round(worstLoaf.topScript.duration)}ms</SecondaryValue>
        </Metric>
      )}
    </MetricsSection>
  )
})

const ElementTimingSection = React.memo(function ElementTimingSection({
  elementTimingSupported, elementTimingCount, largestElementRenderTime, elementTimings,
}: {
  elementTimingSupported: boolean; elementTimingCount: number
  largestElementRenderTime: number; elementTimings: ElementTimingDisplay[]
}) {
  if (!elementTimingSupported) {
    return (
      <MetricsSection icon="🎯" title="Element Timing">
        <Metric label="Status" tooltip="Element Timing API is Chromium-only">
          <StatusBadge variant="neutral"><span>⚠️ Not supported</span></StatusBadge>
        </Metric>
      </MetricsSection>
    )
  }
  if (elementTimingCount === 0) {
    return (
      <MetricsSection icon="🎯" title="Element Timing">
        <Metric label="No elements tracked" tooltip='Add `elementtiming` attribute to track render time'>
          <Code style={{ fontSize: '10px' }}>elementtiming="name"</Code>
        </Metric>
      </MetricsSection>
    )
  }
  const sortedElements = [...elementTimings].sort((a, b) => b.renderTime - a.renderTime)
  return (
    <MetricsSection icon="🎯" title="Element Timing">
      <Metric label="Elements" tooltip="Number of elements tracked">
        <StatusBadge variant="success"><span>{'📍 '}</span><span>{elementTimingCount}</span></StatusBadge>
      </Metric>
      <Metric label="Largest" tooltip="Slowest element to render.">
        <StatusBadge variant={getStatus(largestElementRenderTime, 100, 250)}>
          <span>{largestElementRenderTime < 100 ? '⚡ ' : largestElementRenderTime < 250 ? '⏱️ ' : '🐌 '}</span>
          <span>{largestElementRenderTime}ms</span>
        </StatusBadge>
      </Metric>
      {sortedElements.slice(0, 3).map((el, i) => (
        <Metric key={el.identifier} label={el.identifier} tooltip={`Element: ${el.selector}\nRender: ${el.renderTime}ms`}>
          <StatusBadge variant={getStatus(el.renderTime, 100, 250)}>
            <span>{i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : '🥉 '}</span>
            <span>{el.renderTime}ms</span>
          </StatusBadge>
        </Metric>
      ))}
    </MetricsSection>
  )
})

const LayoutAndInternalsSection = React.memo(function LayoutAndInternalsSection({
  layoutShiftScore, layoutShiftCount, currentSessionCLS, forcedReflowCount, styleWrites, cssVarChanges, inputJitter,
}: {
  layoutShiftScore: number; layoutShiftCount: number; currentSessionCLS: number
  forcedReflowCount: number; styleWrites: number; cssVarChanges: number; inputJitter: number
}) {
  const clsStatus = getStatus(layoutShiftScore, THRESHOLDS.CLS_GOOD, THRESHOLDS.CLS_WARNING)
  const detailParts: string[] = []
  if (layoutShiftCount > 0) detailParts.push(`${layoutShiftCount} shifts`)
  if (currentSessionCLS > 0) detailParts.push(`session: ${formatScore(currentSessionCLS)}`)

    return (
    <MetricsSection icon="📐" title="Layout & Stability">
      <Metric label="CLS" isWebVital tooltip="Cumulative Layout Shift. Core Web Vital. Good: <0.1, Poor: >0.25."
        detail={detailParts.length > 0 ? <>{detailParts.join(' · ')}</> : null}>
        <StatusBadge variant={clsStatus}>
          {layoutShiftScore === 0 ? '🎯 0' : layoutShiftScore > 0.25 ? `📦 ${formatScore(layoutShiftScore)}` : formatScore(layoutShiftScore)}
        </StatusBadge>
      </Metric>
      <Metric label="Forced Reflows" tooltip="Layout reads after style writes force synchronous layout.">
        <StatusBadge variant={getStatus(forcedReflowCount, 0, THRESHOLDS.FORCED_REFLOW_WARNING)}>
          <span>{forcedReflowCount === 0 ? '✨ ' : '💥 '}</span><span>{forcedReflowCount}</span>
        </StatusBadge>
      </Metric>
      <Metric label="Style Writes" tooltip="Inline style mutations."
        detail={cssVarChanges > 0 ? <>{cssVarChanges} CSS var changes</> : null}>
        <span>{'🎨 '}{styleWrites}</span>
      </Metric>
      <Metric label="Input Jitter" tooltip="Unexpected input latency spikes.">
        <StatusBadge variant={getZeroStatus(inputJitter)}>
          {inputJitter === 0 ? '✨ None' : `😵 ${inputJitter} hitches`}
        </StatusBadge>
      </Metric>
    </MetricsSection>
  )
})

const MemoryAndRenderingSection = React.memo(function MemoryAndRenderingSection({
  memoryUsedMB, memoryDeltaMB, peakMemoryMB, memoryHistory,
  gcPressure, domElements, paintCount, compositorLayers,
}: {
  memoryUsedMB: number | null; memoryDeltaMB: number | null; peakMemoryMB: number | null
  memoryHistory: number[]; gcPressure: number; domElements: number | null
  paintCount: number; compositorLayers: number | null
}) {
  const gcStatus = getStatus(gcPressure, 0, THRESHOLDS.GC_PRESSURE_WARNING)
  const layerStatus = compositorLayers === null ? 'neutral' : getStatus(compositorLayers, 0, THRESHOLDS.LAYERS_WARNING)
  const deltaStatus = memoryDeltaMB === null ? 'neutral'
    : memoryDeltaMB > THRESHOLDS.MEMORY_DELTA_DANGER ? 'error'
    : memoryDeltaMB > THRESHOLDS.MEMORY_DELTA_WARNING ? 'warning' : 'success'
  const deltaText = memoryDeltaMB === null ? ''
    : memoryDeltaMB > 0.5 ? `+${formatMb(memoryDeltaMB)}`
    : memoryDeltaMB < -0.5 ? formatMb(memoryDeltaMB) : '±0'

  if (memoryUsedMB === null) {
    return (
      <MetricsSection icon="🧠" title="Memory & Rendering">
        <Metric label="Heap"><SecondaryValue>Not available (Chrome only)</SecondaryValue></Metric>
        <Metric label="Paint Count" tooltip="Number of paint operations.">{paintCount}</Metric>
        <Metric label="Compositor Layers" tooltip="Elements promoted to GPU layers.">
          {compositorLayers !== null ? <StatusBadge variant={layerStatus}>{compositorLayers}</StatusBadge> : '—'}
        </Metric>
      </MetricsSection>
    )
  }

  return (
    <MetricsSection icon="🧠" title="Memory & Rendering">
      <Metric label="Heap" tooltip="Current JS heap size."
        sparkline={<Sparkline data={memoryHistory} />}>
        <span>
          {formatMb(memoryUsedMB)}MB
          {deltaText && <StatusBadge variant={deltaStatus}> ({deltaText})</StatusBadge>}
        </span>
      </Metric>
      <Metric label="Peak" tooltip="Peak heap memory.">{peakMemoryMB !== null ? `${formatMb(peakMemoryMB)}MB` : '—'}</Metric>
      <Metric label="DOM Nodes" tooltip="Current DOM element count.">{domElements !== null ? formatNumber(domElements) : '—'}</Metric>
      <Metric label="GC Pressure" tooltip="Memory allocation rate.">
        <StatusBadge variant={gcStatus}>
          {gcPressure > 0.01 ? `🗑️ ${formatRate(gcPressure, 'MB/s')}` : '✨ Low'}
        </StatusBadge>
      </Metric>
      <Metric label="Paint / Layers" tooltip="Paint operations and compositor layers.">
        <span>{paintCount}</span>
        <SecondaryValue>
          /{' '}
          {compositorLayers !== null
            ? <StatusBadge variant={layerStatus}>{compositorLayers} layers</StatusBadge>
            : <span>—</span>}
        </SecondaryValue>
      </Metric>
    </MetricsSection>
  )
})

// ============================================================================
// Panel State & Connected Component
// ============================================================================

interface PanelState {
  status: 'loading' | 'connected' | 'error' | 'no-decorator'
  metrics: PerformanceMetrics
  errorMessage: string | null
}

type PanelAction =
  | { type: 'METRICS_RECEIVED'; metrics: PerformanceMetrics }
  | { type: 'STORY_ERROR'; message: string }
  | { type: 'NO_DECORATOR' }
  | { type: 'RESET_METRICS' }

const INITIAL_STATE: PanelState = {
  status: 'loading',
  metrics: DEFAULT_METRICS,
  errorMessage: null,
}

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'METRICS_RECEIVED':
      return { ...state, status: 'connected', metrics: action.metrics, errorMessage: null }
    case 'STORY_ERROR':
      return { ...state, status: 'error', errorMessage: action.message }
    case 'NO_DECORATOR':
      if (state.status === 'loading') return { ...state, status: 'no-decorator' }
      return state
    case 'RESET_METRICS':
      return { ...state, metrics: DEFAULT_METRICS }
    default:
      return state
  }
}

function ConnectedPanelContent({ storyId: _storyId }: { storyId: string }) {
  const [state, dispatch] = React.useReducer(panelReducer, INITIAL_STATE)
  const { previewInitialized } = useStorybookState()

  const isConnected = () => state.status === 'connected'

  const emit = useChannel({
    [PERF_EVENTS.METRICS_UPDATE]: (data: PerformanceMetrics) => {
      dispatch({ type: 'METRICS_RECEIVED', metrics: data })
    },
    storyRendered: () => emit(PERF_EVENTS.REQUEST_METRICS),
    storyFinished: () => emit(PERF_EVENTS.REQUEST_METRICS),
    storyErrored: () => dispatch({ type: 'STORY_ERROR', message: 'Story failed to render' }),
    storyMissing: () => dispatch({ type: 'STORY_ERROR', message: 'Story not found' }),
    storyThrewException: (error: any) => dispatch({ type: 'STORY_ERROR', message: error?.message || 'Story threw an exception' }),
    playFunctionThrewException: (error: any) => dispatch({ type: 'STORY_ERROR', message: `Play function error: ${error?.message || 'Unknown error'}` }),
    storyArgsUpdated: () => {
      if (isConnected()) {
        emit(PERF_EVENTS.RESET)
        dispatch({ type: 'RESET_METRICS' })
      }
    },
  })

  React.useEffect(() => {
    if (previewInitialized) emit(PERF_EVENTS.REQUEST_METRICS)
  }, [previewInitialized, emit])

  React.useEffect(() => {
    if (!previewInitialized || state.status !== 'loading') return
    const timeoutId = setTimeout(() => dispatch({ type: 'NO_DECORATOR' }), 500)
    return () => clearTimeout(timeoutId)
  }, [previewInitialized, state.status])

  const handleReset = React.useCallback(() => {
    emit(PERF_EVENTS.RESET)
    dispatch({ type: 'RESET_METRICS' })
  }, [emit])

  const handleInspectElement = React.useCallback((selector: string) => {
    emit(PERF_EVENTS.INSPECT_ELEMENT, selector)
  }, [emit])

  if (state.status !== 'connected') {
    if (state.status === 'error') {
      return (
        <EmptyState>
          <EmptyStateTitle>Story error</EmptyStateTitle>
          <EmptyStateSubtitle>{state.errorMessage}</EmptyStateSubtitle>
          <EmptyStateHint><span>Fix the error in your story to see performance metrics.</span></EmptyStateHint>
        </EmptyState>
      )
    }
    if (state.status === 'no-decorator') {
      return (
        <EmptyState>
          <EmptyStateTitle>Performance monitoring not active for this story</EmptyStateTitle>
          <EmptyStateHint>Add the <Code>withPerformanceMonitor</Code> decorator to enable metrics collection.</EmptyStateHint>
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
  return (
    <PanelWrapper>
      <ContentArea>
        <SectionsGrid>
          <FrameTimingSection
            fps={metrics.fps} fpsHistory={metrics.fpsHistory} frameTime={metrics.frameTime}
            maxFrameTime={metrics.maxFrameTime} frameTimeHistory={metrics.frameTimeHistory}
            droppedFrames={metrics.droppedFrames} frameJitter={metrics.frameJitter}
            frameStability={metrics.frameStability} paintTime={metrics.paintTime}
            maxPaintTime={metrics.maxPaintTime} paintJitter={metrics.paintJitter}
          />
          <InputSection
            inputLatency={metrics.inputLatency} maxInputLatency={metrics.maxInputLatency}
            eventTimingSupported={metrics.eventTimingSupported} inpMs={metrics.inpMs}
            interactionCount={metrics.interactionCount} firstInputDelay={metrics.firstInputDelay}
            firstInputType={metrics.firstInputType} lastInteraction={metrics.lastInteraction}
            slowestInteraction={metrics.slowestInteraction} onInspectElement={handleInspectElement}
          />
          <MainThreadSection
            longTasks={metrics.longTasks} longestTask={metrics.longestTask}
            totalBlockingTime={metrics.totalBlockingTime} thrashingScore={metrics.thrashingScore}
            domMutationsPerFrame={metrics.domMutationsPerFrame}
          />
          <LoAFSection
            loafSupported={metrics.loafSupported} loafCount={metrics.loafCount}
            totalLoafBlockingDuration={metrics.totalLoafBlockingDuration}
            longestLoafDuration={metrics.longestLoafDuration}
            longestLoafBlockingDuration={metrics.longestLoafBlockingDuration}
            avgLoafDuration={metrics.avgLoafDuration} p95LoafDuration={metrics.p95LoafDuration}
            loafsWithScripts={metrics.loafsWithScripts} worstLoaf={metrics.worstLoaf}
          />
          <LayoutAndInternalsSection
            layoutShiftScore={metrics.layoutShiftScore} layoutShiftCount={metrics.layoutShiftCount}
            currentSessionCLS={metrics.currentSessionCLS} forcedReflowCount={metrics.forcedReflowCount}
            styleWrites={metrics.styleWrites} cssVarChanges={metrics.cssVarChanges}
            inputJitter={metrics.inputJitter}
          />
          <MemoryAndRenderingSection
            memoryUsedMB={metrics.memoryUsedMB} memoryDeltaMB={metrics.memoryDeltaMB}
            peakMemoryMB={metrics.peakMemoryMB} memoryHistory={metrics.memoryHistory}
            gcPressure={metrics.gcPressure} domElements={metrics.domElements}
            paintCount={metrics.paintCount} compositorLayers={metrics.compositorLayers}
          />
          <ElementTimingSection
            elementTimingSupported={metrics.elementTimingSupported}
            elementTimingCount={metrics.elementTimingCount}
            largestElementRenderTime={metrics.largestElementRenderTime}
            elementTimings={metrics.elementTimings}
          />
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

function PanelContent({ active }: { active: boolean }) {
  const { storyId, previewInitialized, viewMode } = useStorybookState()
  if (!active) return null
  if (!storyId) {
    return (
      <EmptyState>
        <EmptyStateTitle>No story selected</EmptyStateTitle>
        <EmptyStateSubtitle>Select a story to view performance metrics</EmptyStateSubtitle>
      </EmptyState>
    )
  }
  if (viewMode === 'docs') {
    return (
      <EmptyState>
        <EmptyStateTitle>Docs mode</EmptyStateTitle>
        <EmptyStateSubtitle>Performance metrics are optimized for story view. Switch to Canvas for accurate measurements.</EmptyStateSubtitle>
        <EmptyStateHint><span>Docs mode renders stories in iframes which affects timing accuracy.</span></EmptyStateHint>
      </EmptyState>
    )
  }
  if (!previewInitialized) {
    return (
      <EmptyState>
        <EmptyStateTitle>Preview not initialized</EmptyStateTitle>
        <EmptyStateSubtitle>Please wait...</EmptyStateSubtitle>
      </EmptyState>
    )
  }
  return <ConnectedPanelContent storyId={storyId} />
}

function PerformancePanel({ active }: { active: boolean }) {
  return (
    <AddonPanel active={active}>
      <PanelContent active={active} />
    </AddonPanel>
  )
}

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: '⚡ Performance',
    match: ({ viewMode }) => viewMode === 'story',
    render: ({ active }) => <PerformancePanel active={!!active} />,
  })
})
