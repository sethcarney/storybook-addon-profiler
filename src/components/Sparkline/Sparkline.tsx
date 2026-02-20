import React from 'react'
import { styled, useTheme } from 'storybook/theming'

const SparklineContainer = styled.div({
  display: 'flex',
  alignItems: 'center',
  height: '16px',
})

export const Sparkline = React.memo(function Sparkline({
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
