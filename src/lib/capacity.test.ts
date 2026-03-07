import { describe, it, expect } from "vitest";
import { calculateCapacity, wouldExceedCapacity } from "./capacity";
import type { CapacityResult } from "./types";

describe("calculateCapacity", () => {
  const defaultParams = {
    workingDays: 65,
    quarterMembers: [
      { vacation_days: 0 },
      { vacation_days: 0 },
      { vacation_days: 0 },
    ],
    bufferPercentage: 0.2,
    oncallPerSprint: 1,
    sprintsPerQuarter: 6,
    assignedEpics: [] as { size: "XS" | "S" | "M" | "L" | "XL" }[],
  };

  it("calculates capacity for a standard team with no epics", () => {
    const result = calculateCapacity(defaultParams);

    // 3 members * 65 days = 195 total
    expect(result.totalAvailable).toBe(195);
    // 1 oncall * 6 sprints * 10 days = 60
    expect(result.oncallLoad).toBe(60);
    // 195 - 60 = 135
    expect(result.afterOncall).toBe(135);
    // round(135 * 0.2) = 27
    expect(result.buffer).toBe(27);
    // 135 - 27 = 108
    expect(result.finalCapacity).toBe(108);
    expect(result.usedCapacity).toBe(0);
    expect(result.remaining).toBe(108);
    expect(result.utilization).toBe(0);
  });

  it("subtracts vacation days per member", () => {
    const result = calculateCapacity({
      ...defaultParams,
      quarterMembers: [
        { vacation_days: 10 },
        { vacation_days: 5 },
        { vacation_days: 0 },
      ],
    });

    // (65-10) + (65-5) + (65-0) = 55 + 60 + 65 = 180
    expect(result.totalAvailable).toBe(180);
  });

  it("clamps member available days to zero if vacation exceeds working days", () => {
    const result = calculateCapacity({
      ...defaultParams,
      quarterMembers: [{ vacation_days: 100 }],
    });

    // max(0, 65 - 100) = 0
    expect(result.totalAvailable).toBe(0);
  });

  it("counts used capacity from assigned epics", () => {
    const result = calculateCapacity({
      ...defaultParams,
      assignedEpics: [{ size: "M" }, { size: "S" }, { size: "XS" }],
    });

    // M=20, S=10, XS=5 = 35
    expect(result.usedCapacity).toBe(35);
    expect(result.remaining).toBe(108 - 35);
  });

  it("calculates utilization as a ratio", () => {
    const result = calculateCapacity({
      ...defaultParams,
      assignedEpics: [{ size: "XL" }],
    });

    // 60 / 108
    expect(result.utilization).toBeCloseTo(60 / 108);
  });

  it("handles zero members", () => {
    const result = calculateCapacity({
      ...defaultParams,
      quarterMembers: [],
    });

    expect(result.totalAvailable).toBe(0);
    expect(result.finalCapacity).toBe(0);
    expect(result.utilization).toBe(0);
  });

  it("clamps after-oncall to zero when oncall exceeds available", () => {
    const result = calculateCapacity({
      ...defaultParams,
      quarterMembers: [{ vacation_days: 60 }],
      oncallPerSprint: 2,
      sprintsPerQuarter: 6,
    });

    // totalAvailable = max(0, 65 - 60) = 5
    // oncallLoad = 2 * 6 * 10 = 120
    // afterOncall = max(0, 5 - 120) = 0
    expect(result.afterOncall).toBe(0);
    expect(result.finalCapacity).toBe(0);
  });

  it("handles zero buffer percentage", () => {
    const result = calculateCapacity({
      ...defaultParams,
      bufferPercentage: 0,
    });

    expect(result.buffer).toBe(0);
    // afterOncall = 195 - 60 = 135
    expect(result.finalCapacity).toBe(135);
  });

  it("handles 100% buffer percentage", () => {
    const result = calculateCapacity({
      ...defaultParams,
      bufferPercentage: 1,
    });

    // buffer = round(135 * 1.0) = 135
    // finalCapacity = max(0, 135 - 135) = 0
    expect(result.finalCapacity).toBe(0);
  });

  it("remaining never goes below zero", () => {
    const result = calculateCapacity({
      ...defaultParams,
      quarterMembers: [{ vacation_days: 0 }],
      assignedEpics: [{ size: "XL" }, { size: "XL" }, { size: "XL" }],
    });

    // finalCapacity will be small, used = 180, remaining should be 0
    expect(result.remaining).toBe(0);
  });
});

describe("wouldExceedCapacity", () => {
  const baseCapacity: CapacityResult = {
    totalAvailable: 195,
    oncallLoad: 60,
    afterOncall: 135,
    buffer: 27,
    finalCapacity: 108,
    usedCapacity: 100,
    remaining: 8,
    utilization: 100 / 108,
  };

  it("returns false when epic fits", () => {
    expect(wouldExceedCapacity(baseCapacity, "XS")).toBe(false); // 100 + 5 = 105 <= 108
  });

  it("returns true when epic would exceed capacity", () => {
    expect(wouldExceedCapacity(baseCapacity, "S")).toBe(true); // 100 + 10 = 110 > 108
  });

  it("returns false when epic exactly fills capacity", () => {
    const capacity = { ...baseCapacity, usedCapacity: 98 }; // 98 + 10 = 108
    expect(wouldExceedCapacity(capacity, "S")).toBe(false);
  });

  it("returns true for any size when capacity is zero", () => {
    const zeroCapacity = { ...baseCapacity, finalCapacity: 0, usedCapacity: 0 };
    expect(wouldExceedCapacity(zeroCapacity, "XS")).toBe(true);
  });
});
