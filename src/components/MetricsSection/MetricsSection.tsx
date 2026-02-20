import React from 'react'
import { styled } from 'storybook/theming'

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

export const MetricsSection = React.memo(function MetricsSection({
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
