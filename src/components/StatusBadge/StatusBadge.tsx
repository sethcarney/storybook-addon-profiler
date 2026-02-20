import React from 'react'
import { Badge } from 'storybook/internal/components'

export const VARIANT_TO_BADGE_STATUS: Record<string, 'positive' | 'warning' | 'negative' | 'neutral'> = {
  success: 'positive',
  warning: 'warning',
  error: 'negative',
  neutral: 'neutral',
}

export const StatusBadge = React.memo(function StatusBadge({
  variant,
  children,
}: {
  variant: string
  children: React.ReactNode
}) {
  return <Badge status={VARIANT_TO_BADGE_STATUS[variant] || 'neutral'}>{children}</Badge>
})
