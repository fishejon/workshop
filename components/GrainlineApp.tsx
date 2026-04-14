"use client";

import { useState } from "react";
import { BuyListPanel } from "@/components/BuyListPanel";
import { DecisionStrip } from "@/components/DecisionStrip";
import { IssuesPanel } from "@/components/IssuesPanel";
import { JoineryPanel } from "@/components/JoineryPanel";
import { RoughStickLayout } from "@/components/RoughStickLayout";
import { AppShellTabs, type AppShellTabId } from "@/components/AppShellTabs";
import { WorkshopFlowGuide } from "@/components/WorkshopFlowGuide";
import { CutPlanner } from "@/components/CutPlanner";
import { DresserPlanner } from "@/components/DresserPlanner";
import { PartsTable } from "@/components/PartsTable";
import { ProjectSetupBar } from "@/components/ProjectSetupBar";
import { SideboardPlanner } from "@/components/SideboardPlanner";
import { TvConsoleStub } from "@/components/TvConsoleStub";
import { useProject } from "@/components/ProjectContext";
import { formatShopImperial } from "@/lib/imperial";
import { canExportOrPrintProject } from "@/lib/validation";

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
    id: "sideboard-console" as const,
    title: "Sideboard console",
    tag: "Casework family",
    blurb: "Archetype-backed sideboard shell with workshop defaults and geometry warnings.",
  },
  {
    id: "tv-console" as const,
    title: "TV console",
    tag: "Experimental",
    blurb: "Experimental open-shelf shell: top, sides, and a fixed shelf from overall W × H × D.",
    experimental: true,
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
  const [appTab, setAppTab] = useState<AppShellTabId>("build");
  const [showExperimentalPresets, setShowExperimentalPresets] = useState(false);
  const {
    project,
    blockingValidationIssues,
    warningValidationIssues,
    validationIssues,
    setCheckpointReviewed,
  } = useProject();
  const active = PRESETS.find((p) => p.id === preset);
  const visiblePresets = PRESETS.filter((p) => !p.experimental || showExperimentalPresets);
  const checkpointsReady =
    project.checkpoints.materialAssumptionsReviewed && project.checkpoints.joineryReviewed;
  const canExportOrPrint = canExportOrPrintProject(checkpointsReady, validationIssues);
  const hasBlockingIssues = blockingValidationIssues.length > 0;
  const hasWarnings = warningValidationIssues.length > 0;

  const decisionStrip = (() => {
    const health = hasBlockingIssues
      ? "Blocked by validation issues"
      : !checkpointsReady
        ? "Awaiting release review"
        : hasWarnings
          ? "Warnings need review"
          : "Ready for release";

    let recommendation: string;
    if (hasBlockingIssues) {
      recommendation =
        "Fix blocking issues first (open Materials → Show validation issues, or Review). Exports stay locked until those clear.";
    } else if (appTab === "setup") {
      recommendation =
        "You are on Setup: project and shop defaults. Next, use Build to describe the piece and generate parts into the shared project.";
    } else if (appTab === "build") {
      recommendation =
        "You are on Build: intent and presets. When numbers look right, use Generate / handoff so parts appear on Materials, then validate procurement there.";
    } else if (appTab === "shop") {
      recommendation = !checkpointsReady
        ? "You are on Materials: parts and buy guidance. When this looks right, go to Review and check both handoff boxes before print or CSV."
        : hasWarnings
          ? "You are on Materials: resolve or accept warnings, then finish Review before treating outputs as final."
          : "Materials look consistent; use Review for checkpoints and shop print when you are ready to hand off.";
    } else {
      recommendation = !checkpointsReady
        ? "You are on Review: confirm checkpoints when Materials assumptions and joinery match your intent."
        : hasWarnings
          ? "Review tab: warnings still need a pass before shop handoff."
          : "Review tab: checkpoints satisfied and no blockers—export or print from Materials when ready.";
    }

    const ctaLabel =
      appTab === "setup"
        ? "Next: Build"
        : appTab === "build"
          ? "Next: Materials"
          : appTab === "shop"
            ? "Next: Review"
            : !checkpointsReady || hasBlockingIssues || hasWarnings
              ? "Back to Materials"
              : "Open Materials";

    function handleDecisionCta() {
      if (appTab === "setup") {
        setAppTab("build");
        return;
      }
      if (appTab === "build") {
        setAppTab("shop");
        return;
      }
      if (appTab === "shop") {
        setAppTab("about");
        return;
      }
      setAppTab("shop");
    }

    return (
      <DecisionStrip
        health={health}
        recommendation={recommendation}
        ctaLabel={ctaLabel}
        onCta={handleDecisionCta}
        tone={hasBlockingIssues ? "blocked" : !checkpointsReady || hasWarnings ? "warning" : "ready"}
      />
    );
  })();

  const explainAllowance = `Project milling allowance: ${formatShopImperial(project.millingAllowanceInches)} per axis on non-manual rough dims.`;

  const shopMaterialsLeft = <PartsTable explainAllowanceText={explainAllowance} />;
  const shopMaterialsRight = (
    <>
      <BuyListPanel />
      <details className="gl-panel p-5">
        <summary className="cursor-pointer text-sm font-medium text-[var(--gl-cream-soft)]">
          Advanced materials tools
        </summary>
        <p className="mt-2 text-xs text-[var(--gl-muted)]">
          Open when needed for joinery rule history and rough stick nesting diagnostics.
        </p>
        <div className="mt-4 space-y-4">
          <JoineryPanel />
          <RoughStickLayout />
        </div>
      </details>
    </>
  );

  const buildLeft = (
    <>
      <div className="gl-panel-muted p-4 text-sm text-[var(--gl-muted)]">
        Define intent by selecting a preset and shaping target geometry before procurement validation.
      </div>
      {active ? <p className="text-sm text-[var(--gl-muted)]">{active.blurb}</p> : null}
      <div id="build-planner-section">
        {preset === "dresser" ? <DresserPlanner /> : null}
        {preset === "board" ? <CutPlanner /> : null}
        {preset === "sideboard-console" ? <SideboardPlanner /> : null}
        {preset === "tv-console" ? <TvConsoleStub /> : null}
      </div>
      {preset === "soon-cab" ? (
        <p className="text-[var(--gl-muted)]">This preset is queued. Use Dresser or Board cuts for now.</p>
      ) : null}
    </>
  );

  const setupPanel = <ProjectSetupBar />;
  const issuesPanel = <IssuesPanel title="Project issues and warnings" />;

  const aboutPanel = (
    <div
      id="review-checkpoints-section"
      className="gl-panel max-w-2xl space-y-4 p-8 text-sm leading-relaxed text-[var(--gl-muted)]"
    >
      <h2 className="font-display text-xl text-[var(--gl-cream)]">Release to shop checkpoints</h2>
      <p>
        Before exporting or printing, acknowledge both checkpoints so intent and procurement assumptions are explicitly
        released to shop.
      </p>
      {issuesPanel}
      <div className="gl-panel-muted space-y-3 p-4">
        <label className="flex items-start gap-2 text-sm text-[var(--gl-cream-soft)]">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={project.checkpoints.materialAssumptionsReviewed}
            onChange={(e) => setCheckpointReviewed("materialAssumptionsReviewed", e.target.checked)}
            aria-label="Acknowledge material assumptions review"
          />
          <span>
            I reviewed material assumptions (rough dimensions, thickness category, waste factor, and transport limits).
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-[var(--gl-cream-soft)]">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={project.checkpoints.joineryReviewed}
            onChange={(e) => setCheckpointReviewed("joineryReviewed", e.target.checked)}
            aria-label="Acknowledge joinery review"
          />
          <span>I reviewed joinery deltas/history and confirmed finished dimensions before export/print.</span>
        </label>
      </div>
      <p
        className={`text-xs ${
          canExportOrPrint ? "text-[var(--gl-accent)]" : "text-[var(--gl-muted)]"
        }`}
        aria-live="polite"
      >
        {canExportOrPrint
          ? "Export and print are unlocked for release to shop."
          : checkpointsReady
            ? "Export and print are blocked by high-severity validation issues."
            : "Export and print stay locked until both release checkpoints are acknowledged."}
      </p>
      <p>
        Checkpoints auto-reset when relevant data changes so each export reflects current assumptions.
      </p>
      <p className="text-xs text-[var(--gl-muted)]">
        Guided flow: Setup / Build (Define intent) / Materials (Validate procurement) / Review (Release to shop).
      </p>
    </div>
  );

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="relative mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-6 border-b border-[var(--gl-border)] pb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gl-copper-bright)] uppercase">
                Grainline
              </p>
              <h1 className="font-display mt-2 text-4xl tracking-tight text-[var(--gl-cream)] sm:text-5xl">
                Furniture presets, shop math
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--gl-muted)]">
                Start from a piece you recognize, then follow the workshop flow: Build for intent and generated parts,
                Materials for the cut list and buy guidance, Review for checkpoints and shop print.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {visiblePresets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={Boolean(p.disabled)}
                  onClick={() => !p.disabled && setPreset(p.id)}
                  className={`rounded-full border px-4 py-2 text-left text-sm transition ${
                    preset === p.id
                      ? "border-[var(--gl-accent)] bg-[color-mix(in_srgb,var(--gl-accent)_12%,var(--gl-surface))] text-[var(--gl-text)]"
                      : "border-[var(--gl-border)] bg-[var(--gl-surface)] text-[var(--gl-muted)] hover:border-[var(--gl-border-strong)] hover:text-[var(--gl-text-soft)]"
                  } ${p.disabled ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  <span className="block font-medium text-[var(--gl-cream)]">{p.title}</span>
                  <span className="text-xs text-[var(--gl-muted)]">{p.tag}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end border-t border-[var(--gl-border)] pt-4">
            <div className="flex max-w-xl items-start gap-2 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-xs text-[var(--gl-muted)]">
              <input
                id="show-experimental-presets"
                type="checkbox"
                className="mt-0.5"
                checked={showExperimentalPresets}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setShowExperimentalPresets(checked);
                  if (!checked && preset === "tv-console") {
                    setPreset("dresser");
                  }
                }}
              />
              <label htmlFor="show-experimental-presets" className="cursor-pointer leading-relaxed">
                Show experimental presets (early access, not production-ready).
              </label>
            </div>
          </div>
        </header>

        <div className="mb-6">
          <WorkshopFlowGuide
            active={appTab}
            onGoTo={setAppTab}
            projectName={project.name}
            partCount={project.parts.length}
            materialAssumptionsReviewed={project.checkpoints.materialAssumptionsReviewed}
            joineryReviewed={project.checkpoints.joineryReviewed}
            canExportOrPrint={canExportOrPrint}
          />
        </div>

        <AppShellTabs
          active={appTab}
          onChange={setAppTab}
          setupPanel={setupPanel}
          issuesPanel={issuesPanel}
          buildLeft={buildLeft}
          shopMaterialsLeft={shopMaterialsLeft}
          shopMaterialsRight={shopMaterialsRight}
          aboutPanel={aboutPanel}
          canExportOrPrint={canExportOrPrint}
          blockingValidationIssues={blockingValidationIssues}
          decisionStrip={decisionStrip}
        />
      </div>
    </div>
  );
}
