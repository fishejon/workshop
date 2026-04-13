"use client";

import { useProject } from "@/components/ProjectContext";
import { formatImperial } from "@/lib/imperial";

export function ProjectSetupBar() {
  const {
    project,
    setProjectName,
    setMillingAllowanceInches,
    setMaxTransportLengthInches,
    setWasteFactorPercent,
    resetProject,
  } = useProject();

  return (
    <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1 space-y-3">
          <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Project</p>
          <label className="block text-sm">
            <span className="text-[var(--gl-cream-soft)]">Name</span>
            <input
              className="input-wood mt-1 max-w-md"
              value={project.name}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </label>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="text-[var(--gl-cream-soft)]">Milling allowance (in)</span>
            <input
              type="number"
              step="any"
              min={0}
              className="input-wood mt-1"
              value={project.millingAllowanceInches}
              onChange={(e) => setMillingAllowanceInches(Math.max(0, Number.parseFloat(e.target.value) || 0))}
            />
            <span className="mt-0.5 block text-[10px] text-[var(--gl-muted)]">
              Default rough = finished + {formatImperial(project.millingAllowanceInches)} per axis
            </span>
          </label>
          <label className="text-sm">
            <span className="text-[var(--gl-cream-soft)]">Max transport length (in)</span>
            <input
              type="number"
              step="any"
              min={1}
              className="input-wood mt-1"
              value={project.maxTransportLengthInches}
              onChange={(e) =>
                setMaxTransportLengthInches(Math.max(1, Number.parseFloat(e.target.value) || 96))
              }
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--gl-cream-soft)]">Waste factor (%)</span>
            <input
              type="number"
              step="1"
              min={0}
              className="input-wood mt-1"
              value={project.wasteFactorPercent}
              onChange={(e) =>
                setWasteFactorPercent(Math.max(0, Number.parseFloat(e.target.value) || 0))
              }
            />
          </label>
        </div>
        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-2 text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream)]"
          onClick={() => {
            if (confirm("Reset project to defaults? Parts will be cleared.")) resetProject();
          }}
        >
          Reset project
        </button>
      </div>
    </section>
  );
}
