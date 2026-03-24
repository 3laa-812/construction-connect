import { describe, it, expect } from "vitest";

describe("GoodsReceivedNote", () => {
  it("exports GoodsReceivedNote", async () => {
    const mod = await import("./GoodsReceivedNote");
    expect(mod.GoodsReceivedNote).toBeDefined();
  });
});
