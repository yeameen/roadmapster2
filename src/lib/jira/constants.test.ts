import { describe, it, expect } from "vitest";
import {
  suggestSizeFromPoints,
  mapJiraPriority,
  mapStatusCategory,
} from "./constants";

describe("suggestSizeFromPoints", () => {
  it("returns M for null points", () => {
    expect(suggestSizeFromPoints(null)).toBe("M");
  });

  it("returns XS for 0 points", () => {
    expect(suggestSizeFromPoints(0)).toBe("XS");
  });

  it("returns XS for 1 point", () => {
    expect(suggestSizeFromPoints(1)).toBe("XS");
  });

  it("returns XS for 3 points", () => {
    expect(suggestSizeFromPoints(3)).toBe("XS");
  });

  it("returns S for 4 points", () => {
    expect(suggestSizeFromPoints(4)).toBe("S");
  });

  it("returns S for 5 points", () => {
    expect(suggestSizeFromPoints(5)).toBe("S");
  });

  it("returns S for 8 points", () => {
    expect(suggestSizeFromPoints(8)).toBe("S");
  });

  it("returns M for 9 points", () => {
    expect(suggestSizeFromPoints(9)).toBe("M");
  });

  it("returns M for 13 points", () => {
    expect(suggestSizeFromPoints(13)).toBe("M");
  });

  it("returns L for 14 points", () => {
    expect(suggestSizeFromPoints(14)).toBe("L");
  });

  it("returns L for 21 points", () => {
    expect(suggestSizeFromPoints(21)).toBe("L");
  });

  it("returns XL for 22 points", () => {
    expect(suggestSizeFromPoints(22)).toBe("XL");
  });

  it("returns XL for 40 points", () => {
    expect(suggestSizeFromPoints(40)).toBe("XL");
  });

  it("returns XL for 100 points", () => {
    expect(suggestSizeFromPoints(100)).toBe("XL");
  });
});

describe("mapJiraPriority", () => {
  it("returns P2 for null priority", () => {
    expect(mapJiraPriority(null)).toBe("P2");
  });

  it("maps Highest to P0", () => {
    expect(mapJiraPriority("Highest")).toBe("P0");
  });

  it("maps highest (lowercase) to P0", () => {
    expect(mapJiraPriority("highest")).toBe("P0");
  });

  it("maps Critical to P0", () => {
    expect(mapJiraPriority("Critical")).toBe("P0");
  });

  it("maps critical (lowercase) to P0", () => {
    expect(mapJiraPriority("critical")).toBe("P0");
  });

  it("maps High to P1", () => {
    expect(mapJiraPriority("High")).toBe("P1");
  });

  it("maps high (lowercase) to P1", () => {
    expect(mapJiraPriority("high")).toBe("P1");
  });

  it("maps Medium to P2", () => {
    expect(mapJiraPriority("Medium")).toBe("P2");
  });

  it("maps medium (lowercase) to P2", () => {
    expect(mapJiraPriority("medium")).toBe("P2");
  });

  it("maps Low to P3", () => {
    expect(mapJiraPriority("Low")).toBe("P3");
  });

  it("maps Lowest to P3", () => {
    expect(mapJiraPriority("Lowest")).toBe("P3");
  });

  it("maps unknown priority to P3", () => {
    expect(mapJiraPriority("Trivial")).toBe("P3");
  });
});

describe("mapStatusCategory", () => {
  it("maps 'new' to 'new'", () => {
    expect(mapStatusCategory("new")).toBe("new");
  });

  it("maps 'done' to 'done'", () => {
    expect(mapStatusCategory("done")).toBe("done");
  });

  it("maps 'indeterminate' to 'indeterminate'", () => {
    expect(mapStatusCategory("indeterminate")).toBe("indeterminate");
  });

  it("maps unknown key to 'indeterminate'", () => {
    expect(mapStatusCategory("in_progress")).toBe("indeterminate");
  });

  it("maps empty string to 'indeterminate'", () => {
    expect(mapStatusCategory("")).toBe("indeterminate");
  });
});
