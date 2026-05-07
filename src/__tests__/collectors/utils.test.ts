import { describe, it, expect } from "vitest"
import {
  computeAverage,
  computeStdDev,
  computeFrameStability,
  computePercentile,
  computeP95,
  addToWindow,
  updateMaxWithDecay,
} from "../../collectors/utils"

describe("computeAverage", () => {
  it("returns 0 for an empty array", () => {
    expect(computeAverage([])).toBe(0)
  })

  it("returns the value for a single-element array", () => {
    expect(computeAverage([7])).toBe(7)
  })

  it("computes the mean correctly", () => {
    expect(computeAverage([1, 2, 3, 4])).toBe(2.5)
    expect(computeAverage([10, 20, 30])).toBeCloseTo(20)
  })
})

describe("computeStdDev", () => {
  it("returns 0 for empty or single-element arrays", () => {
    expect(computeStdDev([])).toBe(0)
    expect(computeStdDev([5])).toBe(0)
  })

  it("returns 0 for identical values", () => {
    expect(computeStdDev([4, 4, 4, 4])).toBe(0)
  })

  it("computes sample standard deviation correctly", () => {
    // mean=5, Σ(x-mean)²=32, sample variance=32/7≈4.571, stddev≈2.138
    expect(computeStdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2)
  })
})

describe("computeFrameStability", () => {
  it("returns 100 for fewer than 2 frames", () => {
    expect(computeFrameStability([])).toBe(100)
    expect(computeFrameStability([16])).toBe(100)
  })

  it("returns 100 for perfectly stable frame times", () => {
    expect(computeFrameStability([16, 16, 16, 16])).toBe(100)
  })

  it("returns a value in [0, 100]", () => {
    const result = computeFrameStability([5, 50, 5, 50, 5, 50])
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(100)
  })

  it("returns lower stability for highly variable frame times", () => {
    const stable = computeFrameStability([16, 16, 16, 16])
    const variable = computeFrameStability([5, 100, 5, 100])
    expect(stable).toBeGreaterThan(variable)
  })
})

describe("computePercentile", () => {
  it("returns 0 for an empty array", () => {
    expect(computePercentile([], 0.5)).toBe(0)
  })

  it("returns the only element for a single-element array", () => {
    expect(computePercentile([42], 0.9)).toBe(42)
  })

  it("computes the median (p50) of an odd-length sorted array", () => {
    expect(computePercentile([1, 2, 3, 4, 5], 0.5)).toBe(3)
  })

  it("interpolates correctly for non-integer indices", () => {
    // [1, 2, 3, 4] p75 → index = 0.75 * 3 = 2.25 → 3 + 0.25*(4-3) = 3.25
    expect(computePercentile([1, 2, 3, 4], 0.75)).toBeCloseTo(3.25)
  })
})

describe("computeP95", () => {
  it("returns a value rounded to 1 decimal place", () => {
    const arr = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    const result = computeP95(arr)
    // Should equal Math.round(computePercentile(arr, 0.95) * 10) / 10
    expect(result).toBe(Math.round(computePercentile(arr, 0.95) * 10) / 10)
  })
})

describe("addToWindow", () => {
  it("appends a value when below maxSize", () => {
    const arr: number[] = [1, 2]
    addToWindow(arr, 3, 5)
    expect(arr).toEqual([1, 2, 3])
  })

  it("evicts the oldest value when at maxSize", () => {
    const arr = [1, 2, 3]
    addToWindow(arr, 4, 3)
    expect(arr).toEqual([2, 3, 4])
  })

  it("maintains the window size after many insertions", () => {
    const arr: number[] = []
    for (let i = 0; i < 20; i++) addToWindow(arr, i, 5)
    expect(arr).toHaveLength(5)
    expect(arr).toEqual([15, 16, 17, 18, 19])
  })
})

describe("updateMaxWithDecay", () => {
  it("returns newValue when it exceeds currentMax", () => {
    expect(updateMaxWithDecay(50, 100, 40, 0.9)).toBe(100)
  })

  it("returns currentMax when newValue is lower but above the decay threshold", () => {
    expect(updateMaxWithDecay(100, 60, 40, 0.9)).toBe(100)
  })

  it("applies decay when newValue falls below the decay threshold and currentMax is above it", () => {
    expect(updateMaxWithDecay(100, 30, 40, 0.9)).toBeCloseTo(90)
  })

  it("does not decay when currentMax is already at or below the threshold", () => {
    expect(updateMaxWithDecay(35, 20, 40, 0.9)).toBe(35)
  })
})
