import React from "react"
import { AddonPanel } from "storybook/internal/components"
import { PanelContent } from "../PanelContent/PanelContent"

export function PerformancePanel({ active }: { active: boolean }) {
  return (
    <AddonPanel active={active}>
      <PanelContent active={active} />
    </AddonPanel>
  )
}
