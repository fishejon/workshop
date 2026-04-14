"use client";

import { useState } from "react";
import { BuyListPanel } from "@/components/BuyListPanel";
import { DecisionStrip } from "@/components/DecisionStrip";
import { IssuesPanel } from "@/components/IssuesPanel";
import { JoineryPanel } from "@/components/JoineryPanel";
import { RoughStickLayout } from "@/components/RoughStickLayout";
import { AppShellTabs, type AppShellTabId } from "@/components/AppShellTabs";
import { CutPlanner } from "@/components/CutPlanner";
import { DresserPlanner } from "@/components/DresserPlanner";
import { PartsTable } from "@/components/PartsTable";
import { ProjectSetupBar } from "@/components/ProjectSetupBar";
import { SideboardPlanner } from "@/components/SideboardPlanner";
import { TvConsoleStub } from "@/components/TvConsoleStub";
import { useProject } from "@/components/ProjectContext";
import { formatImperial } from "@/lib/imperial";
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

  const decisionStrip = (
    <DecisionStrip
      health={
        hasBlockingIssues
          ? "Blocked by validation issues"
          : !checkpointsReady
            ? "Awaiting release review"
            : hasWarnings
              ? "Warnings need review"
              : "Ready for release"
      }
      recommendation={
        hasBlockingIssues
          ? "Resolve blocking issues before releasing to shop."
          : !checkpointsReady
            ? "Finish procurement validation, then acknowledge Review checkpoints."
            : hasWarnings
              ? "Review warnings in Materials and Joinery before release."
              : "Procurement is validated; release to shop when ready."
      }
      ctaLabel={
        appTab === "build"
          ? "Next: Validate procurement"
          : !checkpointsReady || hasBlockingIssues || hasWarnings
            ? "Next: Release to shop"
            : "Open release checklist"
      }
      onCta={() => {
        if (appTab === "build") {
          setAppTab("shop");
          return;
        }
        setAppTab("about");
      }}
      tone={hasBlockingIssues ? "blocked" : !checkpointsReady || hasWarnings ? "warning" : "ready"}
    />
  );

  const explainAllowance = `Project milling allowance: ${formatImperial(project.millingAllowanceInches)} per axis on non-manual rough dims.`;

  const shopMaterialsLeft = <PartsTable explainAllowanceText={explainAllowance} />;
  const shopMaterialsRight = (
    <>
      <BuyListPanel />
      <JoineryPanel />
      <RoughStickLayout />
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
          canExportOrPrint ? "text-[var(--gl-copper-bright)]" : "text-[var(--gl-muted)]"
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
      <div
        className="gl-noise pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div className="gl-glow pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-[var(--gl-copper)]/20 blur-[100px]" />
      <div className="gl-glow pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-[var(--gl-teal)]/15 blur-[90px]" />

      <div className="relative mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-6 border-b border-white/10 pb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
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
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {visiblePresets.map((p) => (
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
          </div>
          <div className="flex justify-end border-t border-white/10 pt-4">
            <div className="flex max-w-xl items-start gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs text-[var(--gl-cream-soft)]">
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
