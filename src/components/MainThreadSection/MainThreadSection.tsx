import React from 'react'
import { THRESHOLDS, getStatusVariant, getZeroIsGoodStatus } from '../../performance-types'
import { MetricsSection } from '../MetricsSection/MetricsSection'
import { Metric, SecondaryValue } from '../Metric/Metric'
import { StatusBadge } from '../StatusBadge/StatusBadge'

export const MainThreadSection = React.memo(function MainThreadSection({
  longTasks, longestTask, totalBlockingTime, thrashingScore, domMutationsPerFrame,
}: {
  longTasks: number; longestTask: number; totalBlockingTime: number
  thrashingScore: number; domMutationsPerFrame: number
}) {
  return (
    <MetricsSection icon="⏱️" title="Main Thread">
      <Metric label="Long Tasks" tooltip="Tasks blocking main thread >50ms."
        detail={longestTask > 0 ? <>longest: {Math.round(longestTask)}ms</> : null}>
        <StatusBadge variant={getStatusVariant(longTasks, 0, THRESHOLDS.LONG_TASKS_WARNING)}>
          <span>{longTasks === 0 ? '✨ ' : '🐢 '}</span><span>{longTasks}</span>
        </StatusBadge>
      </Metric>
      <Metric label="TBT" isWebVital tooltip="Total Blocking Time. Good: <200ms, Poor: >600ms.">
        <StatusBadge variant={getStatusVariant(totalBlockingTime, 0, THRESHOLDS.TBT_WARNING)}>
          <span>{totalBlockingTime === 0 ? '🚀 ' : totalBlockingTime > 600 ? '💥 ' : '⏳ '}</span>
          <span>{totalBlockingTime}ms</span>
        </StatusBadge>
      </Metric>
      <Metric label="Thrashing" tooltip="Frame blocking >50ms near style writes.">
        <StatusBadge variant={getZeroIsGoodStatus(thrashingScore)}>
          {thrashingScore === 0 ? '✨ None' : `🔄 ${thrashingScore} stalls`}
        </StatusBadge>
      </Metric>
      <Metric label="DOM Churn" tooltip="DOM mutations per sample period.">
        <StatusBadge variant={getStatusVariant(domMutationsPerFrame, 0, THRESHOLDS.DOM_MUTATIONS_WARNING)}>
          <span>{domMutationsPerFrame === 0 ? '✨ ' : domMutationsPerFrame > 10 ? '🌪️ ' : '🔨 '}</span>
          <span>{domMutationsPerFrame}</span>
        </StatusBadge>
        <SecondaryValue>/period</SecondaryValue>
      </Metric>
    </MetricsSection>
  )
})
