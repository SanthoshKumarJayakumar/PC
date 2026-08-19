import { describe, expect, it } from "vitest";
import { useBuildStore } from "./buildStore.js";

describe("build store", () => {
  it("starts empty", () => {
    const s = useBuildStore.getState();
    expect(s.components.cpu).toBeNull();
    expect(s.rgb.mode).toBe("static");
  });
});
