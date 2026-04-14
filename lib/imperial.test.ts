import { describe, expect, it } from "vitest";
import { formatImperial, formatImperialInput, parseInches } from "./imperial";

describe("imperial helpers", () => {
  it("formats fraction-first values for output and input fields", () => {
    expect(formatImperial(34.5, 16)).toBe('34 1/2"');
    expect(formatImperialInput(34.5, 16)).toBe("34 1/2");
    expect(formatImperialInput(0.75, 16)).toBe("3/4");
  });

  it("parses common inch suffixes without changing numeric semantics", () => {
    expect(parseInches('34 1/2"')).toBeCloseTo(34.5, 6);
    expect(parseInches("34 1/2 in")).toBeCloseTo(34.5, 6);
    expect(parseInches("7/8 inches")).toBeCloseTo(0.875, 6);
  });
});
