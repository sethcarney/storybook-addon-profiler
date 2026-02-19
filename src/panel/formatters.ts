const msFormatter = new Intl.NumberFormat('en-US', {
  style: 'unit',
  unit: 'millisecond',
  unitDisplay: 'narrow',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
export const formatMs = (value: number) => msFormatter.format(value)

const mbFormatter = new Intl.NumberFormat('en-US', {
  style: 'unit',
  unit: 'megabyte',
  unitDisplay: 'narrow',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
export const formatMb = (value: number) => mbFormatter.format(value)

const numberFormatter = new Intl.NumberFormat('en-US')
export const formatNumber = (value: number) => numberFormatter.format(value)

const scoreFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})
export const formatScore = (value: number) => scoreFormatter.format(value)

export const formatPercent = (value: number) => `${Math.round(value)}%`

const rateFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
export const formatRate = (value: number, unit: string) => `${rateFormatter.format(value)} ${unit}`
