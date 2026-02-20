import { addons, types } from 'storybook/manager-api'
import React from 'react'
import { ADDON_ID, PANEL_ID } from './performance-types'
import { PerformancePanel } from './components/PerformancePanel/PerformancePanel'

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: '⚡ Performance',
    match: ({ viewMode }) => viewMode === 'story',
    render: ({ active }) => <PerformancePanel active={!!active} />,
  })
})
