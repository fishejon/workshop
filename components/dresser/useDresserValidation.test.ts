import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDresserValidation } from "@/components/dresser/useDresserValidation";

describe("useDresserValidation", () => {
  it("flags invalid small height", () => {
    const { result } = renderHook(() =>
      useDresserValidation({
        height: 10,
        width: 48,
        depth: 20,
        rows: 4,
        columns: 2,
        materialThickness: 0.75,
        kickHeight: 0,
        topThickness: 0.75,
      })
    );
    expect(result.current.isValid).toBe(false);
    expect(result.current.errors.some((e) => e.includes("Height must be at least"))).toBe(true);
  });

  it("accepts a valid baseline config", () => {
    const { result } = renderHook(() =>
      useDresserValidation({
        height: 34,
        width: 48,
        depth: 20,
        rows: 3,
        columns: 2,
        materialThickness: 0.75,
        kickHeight: 0,
        topThickness: 0.75,
      })
    );
    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toHaveLength(0);
  });
});
