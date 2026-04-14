import { describe, expect, it } from "vitest";
import { computeDresser } from "@/lib/dresser-engine";
import { computeDrawerJoineryAllowances } from "./drawer-allowances";

describe("computeDrawerJoineryAllowances", () => {
  it("returns zero deduction for butt preset", () => {
    const result = computeDrawerJoineryAllowances({
      preset: "butt",
      materialThickness: 0.75,
    });
    expect(result.widthAllowance).toBeCloseTo(0, 5);
    expect(result.heightAllowance).toBeCloseTo(0, 5);
  });

  it("uses 2 × thickness for dovetail full-overlap", () => {
    const result = computeDrawerJoineryAllowances({
      preset: "dovetail_full_overlap",
      materialThickness: 0.625,
    });
    expect(result.widthAllowance).toBeCloseTo(1.25, 5);
    expect(result.heightAllowance).toBeCloseTo(0, 5);
  });

  it("uses default half-thickness for dovetail half-lap", () => {
    const result = computeDrawerJoineryAllowances({
      preset: "dovetail_half_lap",
      materialThickness: 0.75,
    });
    expect(result.widthAllowance).toBeCloseTo(0.75, 5);
  });

  it("allows half-lap ratio override", () => {
    const result = computeDrawerJoineryAllowances({
      preset: "dovetail_half_lap",
      materialThickness: 0.75,
      halfLapRatio: 0.4,
    });
    expect(result.widthAllowance).toBeCloseTo(0.6, 5);
  });

  it("allows explicit half-lap depth override", () => {
    const result = computeDrawerJoineryAllowances({
      preset: "dovetail_half_lap",
      materialThickness: 0.75,
      halfLapRatio: 0.4,
      halfLapDepth: 0.2,
    });
    expect(result.widthAllowance).toBeCloseTo(0.4, 5);
  });

  it("keeps simple rabbet continuity formula", () => {
    const result = computeDrawerJoineryAllowances({
      preset: "rabbet",
      materialThickness: 0.75,
    });
    expect(result.widthAllowance).toBeCloseTo(0.75, 5);
    expect(result.heightAllowance).toBeCloseTo(0, 5);
  });
});

describe("computeDresser joinery preset integration", () => {
  const baseInput = {
    outerWidth: 40,
    outerHeight: 30,
    outerDepth: 20,
    materialThickness: 0.75,
    columnCount: 1 as const,
    rowCount: 1,
    rowOpeningHeightsInches: [20],
    kickHeight: 0,
    topAssemblyHeight: 5,
    bottomPanelThickness: 5,
    railBetweenDrawers: 0,
    backThickness: 0.25,
    rearClearanceForBox: 0.5,
    slideLengthNominal: 16,
    slideWidthClearance: 0.5,
    slideHeightClearance: 0.25,
  };

  it("is backward compatible when no joinery preset is provided", () => {
    const result = computeDresser({
      ...baseInput,
      drawerJoineryWidthAllowance: 0.125,
      drawerJoineryHeightAllowance: 0.0625,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.cells[0]?.boxWidth).toBeCloseTo(37.875, 5);
    expect(result.cells[0]?.boxHeight).toBeCloseTo(19.6875, 5);
  });

  it("applies slide plus preset joinery deductions", () => {
    const result = computeDresser({
      ...baseInput,
      drawerJoineryPreset: "dovetail_full_overlap",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.cells[0]?.boxWidth).toBeCloseTo(36.5, 5);
    expect(result.cells[0]?.boxHeight).toBeCloseTo(19.75, 5);
  });

  it("adds legacy allowances on top of preset deduction", () => {
    const result = computeDresser({
      ...baseInput,
      drawerJoineryPreset: "dovetail_half_lap",
      drawerJoineryHalfLapDepth: 0.2,
      drawerJoineryWidthAllowance: 0.1,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.cells[0]?.boxWidth).toBeCloseTo(37.5, 5);
  });
});
