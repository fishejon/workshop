"use client";

import { useCallback, useState } from "react";
import { DecisionStrip } from "@/components/DecisionStrip";
import { AppShellTabs, type AppShellTabId } from "@/components/AppShellTabs";
import { CutPlanner } from "@/components/CutPlanner";
import { DresserPlanner } from "@/components/DresserPlanner";
import { CutListYardSummary } from "@/components/CutListYardSummary";
import { PartsTable } from "@/components/PartsTable";
import { ProjectSetupBar } from "@/components/ProjectSetupBar";
import { ProjectToolbar } from "@/components/ProjectToolbar";
import { TvConsoleStub } from "@/components/TvConsoleStub";
import { CaseworkPlanner } from "@/components/casework/CaseworkPlanner";
import { TemplateLibrary } from "@/components/templates/TemplateLibrary";
import { useProject } from "@/components/ProjectContext";
import { formatShopImperial } from "@/lib/imperial";
import {
  FURNITURE_TEMPLATES,
  getTemplateById,
} from "@/lib/templates/furniture-templates";
import { templateStorageService } from "@/lib/services/TemplateStorageService";
import type { FurnitureConfig } from "@/lib/types/furniture-config";
import { caseworkGenerationService } from "@/lib/services/CaseworkGenerationService";

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
    id: "console-template" as const,
    title: "Console template",
    tag: "Casework family",
    blurb: "Template-driven console using shared casework generation and validation.",
  },
  {
    id: "bookshelf-template" as const,
    title: "Bookshelf template",
    tag: "Casework family",
    blurb: "Template-driven bookshelf with adjustable shelf support.",
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
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [activeFurnitureConfig, setActiveFurnitureConfig] = useState<FurnitureConfig | null>(null);
  const [loadedConsoleConfig, setLoadedConsoleConfig] = useState<FurnitureConfig | undefined>();
  const [loadedBookshelfConfig, setLoadedBookshelfConfig] = useState<FurnitureConfig | undefined>();
  const {
    project,
    blockingValidationIssues,
    warningValidationIssues,
    replacePartsInAssemblies,
  } = useProject();
  const active = PRESETS.find((p) => p.id === preset);
  const visiblePresets = PRESETS.filter((p) => !p.experimental || showExperimentalPresets);
  const hasBlockingIssues = blockingValidationIssues.length > 0;
  const hasWarnings = warningValidationIssues.length > 0;

  const decisionStrip = (() => {
    const health = hasBlockingIssues
      ? "Blocked by validation issues"
      : hasWarnings
        ? "Warnings — verify Plan and Materials"
        : "Ready for materials";

    let recommendation: string;
    if (hasBlockingIssues) {
      recommendation =
        "Fix blocking issues in Plan first. Materials stays locked until blockers clear.";
    } else if (appTab === "setup") {
      recommendation =
        "You are on Project: choose preset and defaults. Next, use Plan to set dimensions.";
    } else if (appTab === "build") {
      recommendation =
        "You are on Plan: update intent and geometry. Materials updates from your configuration automatically.";
    } else {
      recommendation = hasWarnings
        ? "You are on Materials: check warnings and cut layout."
        : "You are on Materials: cut list is ready.";
    }

    const ctaLabel =
      appTab === "setup"
        ? "Next: Plan"
        : appTab === "build"
          ? "Next: Materials"
          : "Back to Plan";

    function handleDecisionCta() {
      if (appTab === "setup") {
        setAppTab("build");
        return;
      }
      if (appTab === "build") {
        setAppTab("shop");
        return;
      }
      setAppTab("build");
    }

    return (
      <DecisionStrip
        health={health}
        recommendation={recommendation}
        ctaLabel={ctaLabel}
        onCta={handleDecisionCta}
        tone={hasBlockingIssues ? "blocked" : hasWarnings ? "warning" : "ready"}
      />
    );
  })();

  const explainAllowance = `Project milling allowance: ${formatShopImperial(project.millingAllowanceInches)} per axis on non-manual rough dims.`;

  const syncTemplatePartsToProject = useCallback(
    (config: FurnitureConfig) => {
      setActiveFurnitureConfig(config);
      const generatedParts = caseworkGenerationService.generateParts(config);
      replacePartsInAssemblies(["Case", "Drawers", "Base", "Back", "Doors", "Other"], generatedParts);
    },
    [replacePartsInAssemblies]
  );

  const setupPanel = (
    <div className="space-y-4">
      <div className="gl-panel-muted p-4 text-sm text-[var(--gl-muted)]">
        Choose the project type here, then move to Plan to set dimensions. This keeps presets scoped to the first step
        instead of floating across every tab.
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePresets.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={Boolean(p.disabled)}
            onClick={() => !p.disabled && setPreset(p.id)}
            className={`rounded-xl border p-3 text-left transition ${
              preset === p.id
                ? "border-[var(--gl-accent)] bg-[color-mix(in_srgb,var(--gl-accent)_12%,var(--gl-surface))] text-[var(--gl-text)]"
                : "border-[var(--gl-border)] bg-[var(--gl-surface)] text-[var(--gl-muted)] hover:border-[var(--gl-border-strong)] hover:text-[var(--gl-text-soft)]"
            } ${p.disabled ? "cursor-not-allowed opacity-40" : ""}`}
          >
            <span className="block font-medium text-[var(--gl-cream)]">{p.title}</span>
            <span className="block text-xs text-[var(--gl-muted)]">{p.tag}</span>
            <span className="mt-1 block text-xs text-[var(--gl-muted)]">{p.blurb}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-end border-t border-[var(--gl-border)] pt-4">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
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
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-[var(--gl-border)] px-3 py-1.5 text-xs text-[var(--gl-cream-soft)]"
              onClick={() => setShowTemplateLibrary(true)}
            >
              Load template
            </button>
            <button
              type="button"
              className="rounded-md border border-[var(--gl-border)] px-3 py-1.5 text-xs text-[var(--gl-cream-soft)]"
              onClick={() => {
                if (!activeFurnitureConfig) return;
                templateStorageService.saveTemplate(activeFurnitureConfig);
              }}
              disabled={!activeFurnitureConfig}
            >
              Save as template
            </button>
          </div>
        </div>
      </div>
      <ProjectSetupBar />
    </div>
  );
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
        {preset === "console-template" ? (
          <CaseworkPlanner
            key={`console-template-${loadedConsoleConfig?.id ?? "default"}`}
            template={getTemplateById("console-table") ?? FURNITURE_TEMPLATES[0]}
            initialConfig={loadedConsoleConfig}
            onConfigChange={syncTemplatePartsToProject}
          />
        ) : null}
        {preset === "bookshelf-template" ? (
          <CaseworkPlanner
            key={`bookshelf-template-${loadedBookshelfConfig?.id ?? "default"}`}
            template={getTemplateById("bookshelf-adjustable") ?? FURNITURE_TEMPLATES[0]}
            initialConfig={loadedBookshelfConfig}
            onConfigChange={syncTemplatePartsToProject}
          />
        ) : null}
        {preset === "tv-console" ? <TvConsoleStub /> : null}
      </div>
      {preset === "soon-cab" ? (
        <p className="text-[var(--gl-muted)]">This preset is queued. Use Dresser or Board cuts for now.</p>
      ) : null}
    </>
  );

  const activeTab: AppShellTabId = hasBlockingIssues && appTab === "shop" ? "build" : appTab;

  function handleAppTabChange(next: AppShellTabId) {
    if (next === "shop" && hasBlockingIssues) {
      setAppTab("build");
      return;
    }
    setAppTab(next);
  }

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
                Plan the piece and review the materials cut list.
              </p>
            </div>
            <ProjectToolbar />
          </div>
        </header>

        <AppShellTabs
          active={activeTab}
          onChange={handleAppTabChange}
          setupPanel={setupPanel}
          planPanel={planPanel}
          cutListPartsTable={
            <div className="space-y-4">
              <CutListYardSummary />
              <PartsTable explainAllowanceText={explainAllowance} />
            </div>
          }
          blockingValidationIssues={blockingValidationIssues}
          decisionStrip={decisionStrip}
          disableShopTab={hasBlockingIssues}
        />
      </div>
      {showTemplateLibrary ? (
        <TemplateLibrary
          onClose={() => setShowTemplateLibrary(false)}
          onSelectTemplate={(config) => {
            if (config.type === "console") {
              setLoadedConsoleConfig(config);
              setPreset("console-template");
            }
            if (config.type === "bookshelf") {
              setLoadedBookshelfConfig(config);
              setPreset("bookshelf-template");
            }
            if (config.type === "dresser") setPreset("dresser");
          }}
        />
      ) : null}
    </div>
  );
}
