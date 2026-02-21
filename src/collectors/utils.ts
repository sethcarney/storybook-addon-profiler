export function computeAverage(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function computeStdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const avg = computeAverage(arr)
  const squaredDiffs = arr.map((x) => (x - avg) ** 2)
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (arr.length - 1))
}

export function computeFrameStability(frameTimes: number[]): number {
  if (frameTimes.length < 2) return 100
  const avg = computeAverage(frameTimes)
  if (avg === 0) return 100
  const stdDev = computeStdDev(frameTimes)
  const cv = stdDev / avg
  return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)))
}

export function computePercentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  if (arr.length === 1) return arr[0]!
  const sorted = [...arr].sort((a, b) => a - b)
  const index = p * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const fraction = index - lower
  if (lower === upper) {
    return sorted[lower]!
  }
  return sorted[lower]! + fraction * (sorted[upper]! - sorted[lower]!)
}

export function computeP95(arr: number[]): number {
  const value = computePercentile(arr, 0.95)
  return Math.round(value * 10) / 10
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

export function getMemoryMB(): number | null {
  const memory = (performance as PerformanceWithMemory).memory
  if (memory?.usedJSHeapSize) {
    return Math.round((memory.usedJSHeapSize / 1024 / 1024) * 10) / 10
  }
  return null
}

export function addToWindow(arr: number[], value: number, maxSize: number): void {
  arr.push(value)
  if (arr.length > maxSize) arr.shift()
}

export function updateMaxWithDecay(
  currentMax: number,
  newValue: number,
  decayThreshold: number,
  decayRate: number
): number {
  if (newValue > currentMax) {
    return newValue
  }
  if (newValue < decayThreshold && currentMax > decayThreshold) {
    return currentMax * decayRate
  }
  return currentMax
}
