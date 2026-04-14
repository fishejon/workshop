import { describe, expect, it } from "vitest";
import { widthRipMultiplier } from "./width-fit";

describe("widthRipMultiplier", () => {
  it("returns 1 when width fits stock", () => {
    expect(widthRipMultiplier(18, 20)).toBe(1);
  });

  it("returns ceil ratio when wider than stock", () => {
    expect(widthRipMultiplier(24, 20)).toBe(2);
    expect(widthRipMultiplier(41, 20)).toBe(3);
  });
});
