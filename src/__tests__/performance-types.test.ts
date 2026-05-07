import { describe, it, expect } from "vitest"
import { getStatusVariant, getZeroIsGoodStatus, THRESHOLDS } from "../performance-types"

describe("getStatusVariant (lower is better)", () => {
  it("returns success at or below the good threshold", () => {
    expect(getStatusVariant(0, 200, 500)).toBe("success")
    expect(getStatusVariant(200, 200, 500)).toBe("success")
  })

  it("returns warning between good and warning thresholds", () => {
    expect(getStatusVariant(350, 200, 500)).toBe("warning")
  })

  it("returns error above the warning threshold", () => {
    expect(getStatusVariant(501, 200, 500)).toBe("error")
    expect(getStatusVariant(500, 200, 500)).toBe("warning")
  })
})

describe("getStatusVariant (higher is better)", () => {
  it("returns success at or above the good threshold", () => {
    expect(getStatusVariant(55, 55, 30, true)).toBe("success")
    expect(getStatusVariant(60, 55, 30, true)).toBe("success")
  })

  it("returns warning between warning and good thresholds", () => {
    expect(getStatusVariant(40, 55, 30, true)).toBe("warning")
  })

  it("returns error below the warning threshold", () => {
    expect(getStatusVariant(20, 55, 30, true)).toBe("error")
    expect(getStatusVariant(30, 55, 30, true)).toBe("warning")
  })
})

describe("getStatusVariant — real threshold constants smoke tests", () => {
  it("classifies a good FPS correctly", () => {
    expect(getStatusVariant(60, THRESHOLDS.FPS_GOOD, THRESHOLDS.FPS_WARNING, true)).toBe("success")
  })

  it("classifies a poor INP correctly", () => {
    expect(getStatusVariant(600, THRESHOLDS.INP_GOOD, THRESHOLDS.INP_WARNING)).toBe("error")
  })

  it("classifies an acceptable CLS correctly", () => {
    expect(getStatusVariant(0.05, THRESHOLDS.CLS_GOOD, THRESHOLDS.CLS_WARNING)).toBe("success")
  })
})

describe("getZeroIsGoodStatus", () => {
  it("returns success for zero", () => {
    expect(getZeroIsGoodStatus(0)).toBe("success")
  })

  it("returns error for positive values", () => {
    expect(getZeroIsGoodStatus(1)).toBe("error")
    expect(getZeroIsGoodStatus(100)).toBe("error")
  })

  it("returns error for negative values", () => {
    expect(getZeroIsGoodStatus(-1)).toBe("error")
  })
})
