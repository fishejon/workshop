"use client";

import { useState } from "react";
import { BuyListPanel } from "@/components/BuyListPanel";
import { DecisionStrip } from "@/components/DecisionStrip";
import { IssuesPanel } from "@/components/IssuesPanel";
import { AppShellTabs, type AppShellTabId } from "@/components/AppShellTabs";
import { CutPlanner } from "@/components/CutPlanner";
import { DresserPlanner } from "@/components/DresserPlanner";
import { CutListYardSummary } from "@/components/CutListYardSummary";
import { PartsTable } from "@/components/PartsTable";
import { ProjectSetupBar } from "@/components/ProjectSetupBar";
import { SideboardPlanner } from "@/components/SideboardPlanner";
import { TvConsoleStub } from "@/components/TvConsoleStub";
import { useProject } from "@/components/ProjectContext";
import { cutListExportCheckpointsReady } from "@/lib/cut-list-scope";
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
  const checkpointsReady = cutListExportCheckpointsReady(project);
  const canExportOrPrint = canExportOrPrintProject(checkpointsReady, validationIssues);
  const hasBlockingIssues = blockingValidationIssues.length > 0;
  const hasWarnings = warningValidationIssues.length > 0;

  const decisionStrip = (() => {
    const health = hasBlockingIssues
      ? "Blocked by validation issues"
      : !checkpointsReady
        ? "Awaiting review"
        : hasWarnings
          ? "Warnings need review"
          : "Ready to export";

    let recommendation: string;
    if (hasBlockingIssues) {
      recommendation =
        "Fix blocking issues first (open Cut list → Show validation issues, or Review). Export stays locked until those clear.";
    } else if (appTab === "setup") {
      recommendation =
        "You are on Project: defaults and backups. Next, use Plan to describe the piece and add rows to the cut list.";
    } else if (appTab === "build") {
      recommendation =
        "You are on Plan: presets and intent. When numbers look right, generate parts so they appear on Cut list, then check lumber there.";
    } else if (appTab === "shop") {
      recommendation = !checkpointsReady
        ? "You are on Cut list: parts and optional buy list. When this looks right, go to Review and acknowledge material assumptions before print or CSV."
        : hasWarnings
          ? "You are on Cut list: resolve or accept warnings, then finish Review before treating outputs as final."
          : "Cut list looks consistent; use Review when you are ready to hand off.";
    } else {
      recommendation = !checkpointsReady
        ? "You are on Review: confirm material assumptions when the cut list matches your intent."
        : hasWarnings
          ? "Review: warnings still need a pass before shop handoff."
          : "Review: checkpoint satisfied and no blockers—export or print from Cut list when ready.";
    }

    const ctaLabel =
      appTab === "setup"
        ? "Next: Plan"
        : appTab === "build"
          ? "Next: Cut list"
          : appTab === "shop"
            ? "Next: Review"
            : !checkpointsReady || hasBlockingIssues || hasWarnings
              ? "Back to Cut list"
              : "Open Cut list";

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

  const planPanel = (
    <>
      <div className="gl-panel-muted p-4 text-sm text-[var(--gl-muted)]">
        Pick a preset and enter sizes; dresser and console archetypes keep the shared cut list in sync with the planner
        math (debounced). Board cut list stays in its own 1D tool until you add rows under Source parts.
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
      <h2 className="font-display text-xl text-[var(--gl-cream)]">Review before shop</h2>
      <p>
        Before exporting or printing, acknowledge that material assumptions on the cut list match what you will buy
        and mill.
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
            I reviewed rough vs finished sizes, material labels, thickness category, waste factor, and transport limits
            on the cut list.
          </span>
        </label>
      </div>
      <p
        className={`text-xs ${
          canExportOrPrint ? "text-[var(--gl-accent)]" : "text-[var(--gl-muted)]"
        }`}
        aria-live="polite"
      >
        {canExportOrPrint
          ? "Export and print are unlocked."
          : checkpointsReady
            ? "Export and print are blocked by high-severity validation issues."
            : "Export and print stay locked until you acknowledge the checklist above."}
      </p>
      <p>Checkpoints reset when relevant project data changes so each export matches current assumptions.</p>
      <p className="text-xs text-[var(--gl-muted)]">
        Flow: Project → Plan → Cut list → Review. Joinery experiments:{" "}
        <a className="text-[var(--gl-copper-bright)] underline-offset-2 hover:underline" href="/labs">
          /labs
        </a>
        .
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
                Cut lists & lumber math
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--gl-muted)]">
                Plan the piece, validate the cut list, then review once before CSV or shop print.
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

        <AppShellTabs
          active={appTab}
          onChange={setAppTab}
          setupPanel={setupPanel}
          issuesPanel={issuesPanel}
          planPanel={planPanel}
          cutListPartsTable={
            <div className="space-y-4">
              <CutListYardSummary />
              <details className="gl-panel border border-[var(--gl-border)] p-4">
                <summary className="cursor-pointer text-sm font-medium text-[var(--gl-cream-soft)]">
                  Source parts &amp; CSV export
                </summary>
                <div className="mt-4">
                  <PartsTable explainAllowanceText={explainAllowance} />
                </div>
              </details>
            </div>
          }
          cutListBuyListPanel={<BuyListPanel showDresserSummary={preset === "dresser"} />}
          aboutPanel={aboutPanel}
          blockingValidationIssues={blockingValidationIssues}
          decisionStrip={decisionStrip}
        />
      </div>
    </div>
  );
}
