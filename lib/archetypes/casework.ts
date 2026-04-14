/**
 * Thin casework archetype layer: typed inputs delegate to dresser engine/carcass math unchanged.
 */

import { buildDresserCarcassParts, type DresserCarcassInput, type DresserCarcassResult } from "@/lib/dresser-carcass";
import {
  computeDresser,
  type DresserEngineInput,
  type DresserEngineError,
  type DresserEngineResult,
} from "@/lib/dresser-engine";
import type { Part } from "@/lib/project-types";
import { formatImperial } from "@/lib/imperial";
import { DRESSER_PRIMARY_HARDWOOD_4_4 } from "@/lib/archetypes/assemblies";

export type DresserCaseworkCarcassInput = DresserCarcassInput;
export type DresserCaseworkEngineInput = DresserEngineInput;

/** Carcass cut list — same behavior as `buildDresserCarcassParts`. */
export function buildDresserCaseworkCarcass(input: DresserCaseworkCarcassInput): DresserCarcassResult {
  return buildDresserCarcassParts(input);
}

/** Opening + drawer box math — same behavior as `computeDresser`. */
export function computeDresserCaseworkEngine(
  input: DresserCaseworkEngineInput
): DresserEngineResult | DresserEngineError {
  return computeDresser(input);
}

/** Dresser-facing API grouped for callers that want one import surface. */
export const dresserCasework = {
  buildCarcass: buildDresserCaseworkCarcass,
  computeEngine: computeDresserCaseworkEngine,
} as const;

/** Back-set from full depth for fixed shelf (matches legacy TV console stub). */
export const CONSOLE_SHELL_SHELF_DEPTH_BACKSET_IN = 0.25;

export type ConsoleShellCaseworkInput = {
  outerWidth: number;
  outerHeight: number;
  outerDepth: number;
  materialThickness: number;
  /** Defaults to {@link CONSOLE_SHELL_SHELF_DEPTH_BACKSET_IN}. */
  shelfDepthBacksetInches?: number;
};

export type ConsoleShellCaseworkResult =
  | { ok: true; parts: Omit<Part, "id">[] }
  | { ok: false; reason: string };

/**
 * Minimal open console shell: top, pair of sides, one fixed shelf (same geometry as legacy stub).
 */
export function buildConsoleShellCasework(input: ConsoleShellCaseworkInput): ConsoleShellCaseworkResult {
  const W = input.outerWidth;
  const H = input.outerHeight;
  const D = input.outerDepth;
  const t = input.materialThickness;
  const backset = input.shelfDepthBacksetInches ?? CONSOLE_SHELL_SHELF_DEPTH_BACKSET_IN;

  if (!Number.isFinite(W) || W <= 0 || !Number.isFinite(H) || H <= 0 || !Number.isFinite(D) || D <= 0) {
    return { ok: false, reason: "Overall width, height, and depth must be positive numbers." };
  }
  if (!Number.isFinite(t) || t <= 0) {
    return { ok: false, reason: "Stock thickness must be positive." };
  }

  const innerW = W - 2 * t;
  if (innerW <= 0) {
    return { ok: false, reason: "Sides consume the full width—increase width or reduce thickness." };
  }

  const shelfDepth = Math.max(D - backset, t);
  const material = DRESSER_PRIMARY_HARDWOOD_4_4;

  const parts: Omit<Part, "id">[] = [
    {
      name: "Console top",
      assembly: "Case",
      quantity: 1,
      finished: { t, w: W, l: D },
      rough: { t: 0, w: 0, l: 0, manual: false },
      material,
      grainNote: "Grain along length (depth).",
      status: "solid",
    },
    {
      name: "Console side",
      assembly: "Case",
      quantity: 2,
      finished: { t, w: H, l: D },
      rough: { t: 0, w: 0, l: 0, manual: false },
      material,
      grainNote: "Vertical grain; pair.",
      status: "solid",
    },
    {
      name: "Fixed shelf",
      assembly: "Case",
      quantity: 1,
      finished: { t, w: innerW, l: shelfDepth },
      rough: { t: 0, w: 0, l: 0, manual: false },
      material,
      grainNote: `Nominal inside width ${formatImperial(innerW)}; stub — adjust for dados.`,
      status: "solid",
    },
  ];

  return { ok: true, parts };
}
