import { describe, it, expect } from "vitest";

describe("BidComparisonTable", () => {
  it("exports BidComparisonTable", async () => {
    const mod = await import("./BidComparisonTable");
    expect(mod.BidComparisonTable).toBeDefined();
  });
});
