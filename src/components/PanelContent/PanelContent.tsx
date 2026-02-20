import React from 'react'
import { useStorybookState } from 'storybook/manager-api'
import { ConnectedPanelContent, EmptyState, EmptyStateTitle, EmptyStateSubtitle, EmptyStateHint } from '../ConnectedPanelContent/ConnectedPanelContent'

export function PanelContent({ active }: { active: boolean }) {
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
