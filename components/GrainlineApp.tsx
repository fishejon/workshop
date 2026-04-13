"use client";

import { useState } from "react";
import { BuyListPanel } from "@/components/BuyListPanel";
import { CutPlanner } from "@/components/CutPlanner";
import { DresserPlanner } from "@/components/DresserPlanner";
import { PartsTable } from "@/components/PartsTable";
import { ProjectSetupBar } from "@/components/ProjectSetupBar";
import { useProject } from "@/components/ProjectContext";
import { formatImperial } from "@/lib/imperial";

const PRESETS = [
  {
    id: "dresser" as const,
    title: "Dresser",
    tag: "Case + drawers",
    blurb: "Columns, row mix, slide clearances, and a live front schematic with box sizes per cell.",
  },
  {
    id: "board" as const,
    title: "Board cut list",
    tag: "1D pack",
    blurb: "Hardwood stick layout with kerf and the length you actually haul home.",
  },
  {
    id: "soon-tv" as const,
    title: "TV console",
    tag: "Soon",
    blurb: "Openings, shelves, and wire management templates.",
    disabled: true,
  },
  {
    id: "soon-cab" as const,
    title: "Standing cabinet",
    tag: "Soon",
    blurb: "Doors, fixed shelves, and hinge deductions.",
    disabled: true,
  },
];

type PresetId = (typeof PRESETS)[number]["id"];

export function GrainlineApp() {
  const [preset, setPreset] = useState<PresetId>("dresser");
  const { project } = useProject();
  const active = PRESETS.find((p) => p.id === preset);

  const explainAllowance = `Project milling allowance: ${formatImperial(project.millingAllowanceInches)} per axis on non-manual rough dims.`;

  return (
    <div className="relative min-h-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-[var(--gl-copper)]/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-[var(--gl-teal)]/15 blur-[90px]" />

      <div className="relative mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-6 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gl-copper-bright)] uppercase">
              Grainline
            </p>
            <h1 className="font-display mt-2 text-4xl tracking-tight text-[var(--gl-cream)] sm:text-5xl">
              Furniture presets, shop math
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--gl-muted)]">
              Start from a piece you recognize. Build a joinery-aware parts list and buy plan on the right while you
              sketch the case on the left.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={Boolean(p.disabled)}
                onClick={() => !p.disabled && setPreset(p.id)}
                className={`rounded-full border px-4 py-2 text-left text-sm transition ${
                  preset === p.id
                    ? "border-[var(--gl-copper-bright)] bg-[var(--gl-copper)]/20 text-[var(--gl-cream)]"
                    : "border-white/15 bg-white/[0.04] text-[var(--gl-muted)] hover:border-white/25 hover:text-[var(--gl-cream-soft)]"
                } ${p.disabled ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <span className="block font-medium text-[var(--gl-cream)]">{p.title}</span>
                <span className="text-xs text-[var(--gl-muted)]">{p.tag}</span>
              </button>
            ))}
          </div>
        </header>

        <ProjectSetupBar />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
          <div className="min-w-0 space-y-6">
            {active ? <p className="text-sm text-[var(--gl-muted)]">{active.blurb}</p> : null}
            {preset === "dresser" ? <DresserPlanner /> : null}
            {preset === "board" ? <CutPlanner /> : null}
            {preset === "soon-tv" || preset === "soon-cab" ? (
              <p className="text-[var(--gl-muted)]">This preset is queued—use Dresser or Board cuts for now.</p>
            ) : null}
          </div>

          <aside className="min-w-0 space-y-6 lg:sticky lg:top-6">
            <PartsTable explainAllowanceText={explainAllowance} />
            <BuyListPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
