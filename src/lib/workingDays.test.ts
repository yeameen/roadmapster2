import { describe, it, expect } from "vitest";
import { calculateWorkingDays } from "./workingDays";

describe("calculateWorkingDays", () => {
  it("counts weekdays in a full week (Mon-Sun)", () => {
    // 2026-03-09 is Monday, 2026-03-15 is Sunday
    expect(calculateWorkingDays("2026-03-09", "2026-03-15")).toBe(5);
  });

  it("counts weekdays in a single work week (Mon-Fri)", () => {
    expect(calculateWorkingDays("2026-03-09", "2026-03-13")).toBe(5);
  });

  it("returns 0 for a weekend-only range", () => {
    // 2026-03-14 is Saturday, 2026-03-15 is Sunday
    expect(calculateWorkingDays("2026-03-14", "2026-03-15")).toBe(0);
  });

  it("returns 1 for a single weekday", () => {
    expect(calculateWorkingDays("2026-03-09", "2026-03-09")).toBe(1);
  });

  it("returns 0 for a single weekend day", () => {
    expect(calculateWorkingDays("2026-03-14", "2026-03-14")).toBe(0);
  });

  it("subtracts holidays from the count", () => {
    // 5 weekdays minus 1 holiday = 4
    expect(calculateWorkingDays("2026-03-09", "2026-03-13", ["2026-03-11"])).toBe(4);
  });

  it("ignores holidays that fall on weekends", () => {
    // Holiday on Saturday doesn't reduce the count
    expect(calculateWorkingDays("2026-03-09", "2026-03-15", ["2026-03-14"])).toBe(5);
  });

  it("ignores holidays outside the date range", () => {
    expect(calculateWorkingDays("2026-03-09", "2026-03-13", ["2026-04-01"])).toBe(5);
  });

  it("handles multiple holidays", () => {
    // 5 weekdays minus 2 holidays = 3
    expect(calculateWorkingDays("2026-03-09", "2026-03-13", ["2026-03-10", "2026-03-12"])).toBe(3);
  });

  it("returns 0 when end is before start", () => {
    expect(calculateWorkingDays("2026-03-13", "2026-03-09")).toBe(0);
  });

  it("returns 0 for invalid dates", () => {
    expect(calculateWorkingDays("invalid", "2026-03-09")).toBe(0);
    expect(calculateWorkingDays("2026-03-09", "invalid")).toBe(0);
  });

  it("calculates a full quarter (~13 weeks)", () => {
    // 2026-04-01 (Wed) to 2026-06-30 (Tue) = ~65 weekdays
    expect(calculateWorkingDays("2026-04-01", "2026-06-30")).toBe(65);
  });

  it("calculates a full quarter with holidays", () => {
    // 65 weekdays minus 3 holidays = 62
    expect(calculateWorkingDays("2026-04-01", "2026-06-30", [
      "2026-05-25", // Memorial Day (Monday)
      "2026-04-03", // Good Friday (Friday)
      "2026-06-19", // Juneteenth (Friday)
    ])).toBe(62);
  });
});
