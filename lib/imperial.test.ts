import { describe, expect, it } from "vitest";
import {
  formatImperial,
  formatImperialInput,
  formatShopImperial,
  formatShopImperialInput,
  parseInches,
} from "./imperial";

describe("imperial helpers", () => {
  it("formats fraction-first values for output and input fields", () => {
    expect(formatImperial(34.5, 16)).toBe('34 1/2"');
    expect(formatImperialInput(34.5, 16)).toBe("34 1/2");
    expect(formatImperialInput(0.75, 16)).toBe("3/4");
  });

  it("formatShopImperial uses 1/16″ rounding for shop-facing strings", () => {
    expect(formatShopImperial(3.5)).toBe('3 1/2"');
    expect(formatShopImperialInput(3.5)).toBe("3 1/2");
    expect(formatShopImperial(34.5)).toBe('34 1/2"');
    expect(formatShopImperialInput(0.75)).toBe("3/4");
    // Finer than default 1/4″ step: 1/32″ rounds to nearest 1/16″
    expect(formatShopImperial(1 / 32)).toBe('1/16"');
  });

  it("parses common inch suffixes without changing numeric semantics", () => {
    expect(parseInches('34 1/2"')).toBeCloseTo(34.5, 6);
    expect(parseInches("34 1/2 in")).toBeCloseTo(34.5, 6);
    expect(parseInches("7/8 inches")).toBeCloseTo(0.875, 6);
  });
});
