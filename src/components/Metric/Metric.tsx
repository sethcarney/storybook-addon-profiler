import React from "react"
import { WithTooltip, TooltipNote } from "storybook/internal/components"
import { styled } from "storybook/theming"

const MetricItem = styled.div(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: "1px 6px",
  padding: "2px 8px",
  minHeight: "20px",
  borderBottom: `1px solid ${theme.appBorderColor}`,
  position: "relative" as const,
  "&:last-child": {
    borderBottom: "none"
  }
}))

const MetricItemWithDetail = styled(MetricItem)({
  minHeight: "36px",
  alignItems: "start"
})

const MetricLabel = styled.dt(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "10px",
  color: theme.color.mediumdark,
  margin: 0,
  gridColumn: "1",
  gridRow: "1 / -1",
  alignSelf: "center",
  minHeight: "16px"
}))

const MetricValue = styled.dd(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "6px",
  fontSize: "11px",
  fontWeight: theme.typography.weight.bold,
  fontFamily: theme.typography.fonts.mono,
  color: theme.color.defaultText,
  margin: 0,
  textAlign: "right" as const,
  gridColumn: "2",
  minWidth: "60px",
  minHeight: "16px"
}))

const DetailValue = styled.dd(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "4px",
  fontSize: "9px",
  fontWeight: "normal",
  fontFamily: theme.typography.fonts.mono,
  color: theme.color.mediumdark,
  margin: 0,
  textAlign: "right" as const,
  gridColumn: "2",
  flexWrap: "wrap" as const,
  minHeight: "14px",
  minWidth: "130px"
}))

export const SecondaryValue = styled.span(({ theme }) => ({
  fontSize: "10px",
  fontWeight: "normal",
  color: theme.color.mediumdark
}))

const InfoIcon = styled.button(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "13px",
  height: "13px",
  fontSize: "11px",
  fontWeight: "normal",
  fontStyle: "normal",
  fontFamily: "system-ui, sans-serif",
  borderRadius: "50%",
  border: `1px solid ${theme.color.mediumdark}`,
  color: theme.color.mediumdark,
  background: "transparent",
  padding: 0,
  userSelect: "none" as const,
  lineHeight: 1,
  cursor: "default",
  opacity: 0.7,
  transition: "opacity 0.1s ease",
  "&:hover": {
    opacity: 1,
    color: theme.color.secondary
  },
  "&:focus": {
    outline: "none",
    boxShadow: `0 0 0 1px ${theme.color.secondary}`
  },
  "&:focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${theme.color.secondary}`
  }
}))

const WebVitalBadge = styled.span(() => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "1px",
  padding: "1px 4px",
  fontSize: "7px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.3px",
  borderRadius: "3px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#fff",
  marginLeft: "4px",
  boxShadow: "0 1px 2px rgba(102, 126, 234, 0.3)",
  "&::before": {
    content: '"⚡"',
    fontSize: "7px"
  }
}))

const SparklineRow = styled.div({
  gridColumn: "1 / -1",
  display: "flex",
  justifyContent: "flex-end",
  paddingBottom: "1px"
})

export const Metric = React.memo(function Metric({
  label,
  tooltip,
  sparkline,
  isWebVital,
  detail,
  reserveDetailSpace,
  children
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
          <WithTooltip tooltip={<TooltipNote note={tooltip} />} trigger="hover" closeOnOutsideClick>
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
