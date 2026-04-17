"use client";

import { useProject } from "@/components/ProjectContext";
import { formatShopImperial } from "@/lib/imperial";
import { LUMBER_PROFILE_IDS, type LumberProfileId, type OffcutModeId } from "@/lib/project-types";
import { NominalStockWidthSelect } from "@/components/NominalStockWidthSelect";

const OFFCUT_MODE_LABELS: Record<OffcutModeId, string> = {
  none: "Do not preserve offcuts",
  keep_serviceable: "Preserve serviceable offcuts",
};
const TRANSPORT_LENGTH_PRESETS = [72, 96, 120];
const WASTE_PERCENT_PRESETS = [10, 15, 20];

export function ProjectSetupBar() {
  const {
    project,
    setProjectName,
    setMillingAllowanceInches,
    setMaxTransportLengthInches,
    setMaxPurchasableBoardWidthInches,
    setWasteFactorPercent,
    setWorkshopLumberProfile,
    setWorkshopOffcutMode,
  } = useProject();

  return (
    <section id="project-setup-section" className="gl-panel mb-8 w-full min-w-0 p-5" aria-labelledby="project-setup-title">
      <div className="flex w-full min-w-0 flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] xl:items-start xl:gap-8">
        <div className="min-w-0 space-y-3">
          <p id="project-setup-title" className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Project</p>
          <label className="block text-sm">
            <span className="text-[var(--gl-cream-soft)]">Name</span>
            <input className="input-wood mt-1 max-w-md" value={project.name} onChange={(e) => setProjectName(e.target.value)} />
          </label>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm">
              <span className="text-[var(--gl-cream-soft)]">Milling allowance (in)</span>
              <input type="number" step="any" min={0} inputMode="decimal" className="input-wood mt-1" value={project.millingAllowanceInches} onChange={(e) => setMillingAllowanceInches(Math.max(0, Number.parseFloat(e.target.value) || 0))} />
              <span className="mt-0.5 block text-xs text-[var(--gl-muted)]">Default rough = finished + {formatShopImperial(project.millingAllowanceInches)} per axis</span>
            </label>
            <label className="text-sm">
              <span className="text-[var(--gl-cream-soft)]">Max transport length (in)</span>
              <input type="number" step="any" min={1} inputMode="decimal" className="input-wood mt-1" value={project.maxTransportLengthInches} onChange={(e) => setMaxTransportLengthInches(Math.max(1, Number.parseFloat(e.target.value) || 96))} />
              <div className="mt-1 flex flex-wrap gap-1">
                {TRANSPORT_LENGTH_PRESETS.map((preset) => (
                  <button key={preset} type="button" className="rounded border border-[var(--gl-border)] px-2 py-1 text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream-soft)]" onClick={() => setMaxTransportLengthInches(preset)}>
                    {preset}&quot;
                  </button>
                ))}
              </div>
            </label>
            <div className="text-sm">
              <span className="text-[var(--gl-cream-soft)]">Widest board you buy (nominal size)</span>
              <div className="mt-1">
                <NominalStockWidthSelect
                  variant="nominalOnly"
                  valueInches={project.maxPurchasableBoardWidthInches}
                  onChangeInches={(n) => setMaxPurchasableBoardWidthInches(Math.max(0.0001, n))}
                  selectId="setup-max-board-nominal"
                  customInputId="setup-max-board-custom-in"
                  helperText="Pick the nominal rack size you actually bring home."
                />
              </div>
            </div>
            <label className="text-sm">
              <span className="text-[var(--gl-cream-soft)]">Waste factor (%)</span>
              <input type="number" step="1" min={0} inputMode="numeric" className="input-wood mt-1" value={project.wasteFactorPercent} onChange={(e) => setWasteFactorPercent(Math.max(0, Number.parseFloat(e.target.value) || 0))} />
              <div className="mt-1 flex flex-wrap gap-1">
                {WASTE_PERCENT_PRESETS.map((preset) => (
                  <button key={preset} type="button" className="rounded border border-[var(--gl-border)] px-2 py-1 text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream-soft)]" onClick={() => setWasteFactorPercent(preset)}>
                    {preset}%
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:max-w-2xl">
            <label className="text-sm">
              <span className="text-[var(--gl-cream-soft)]">Lumber profile memory</span>
              <select className="input-wood mt-1" value={project.workshop.lumberProfile} onChange={(e) => setWorkshopLumberProfile(e.target.value as LumberProfileId)}>
                {LUMBER_PROFILE_IDS.map((profileId) => (
                  <option key={profileId} value={profileId}>{profileId.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-[var(--gl-cream-soft)]">Offcut mode</span>
              <select className="input-wood mt-1" value={project.workshop.offcutMode} onChange={(e) => setWorkshopOffcutMode(e.target.value as OffcutModeId)}>
                {Object.entries(OFFCUT_MODE_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
