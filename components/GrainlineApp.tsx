"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { DecisionStrip } from "@/components/DecisionStrip";
import { AppShellTabs, type AppShellTabId } from "@/components/AppShellTabs";
import { AppNavDrawer } from "@/components/AppNavDrawer";
import { DresserPlanner } from "@/components/DresserPlanner";
import { CutListYardSummary } from "@/components/CutListYardSummary";
import { PartsTable } from "@/components/PartsTable";
import { ProjectSetupBar } from "@/components/ProjectSetupBar";
import { ProjectsHomeView } from "@/components/ProjectsHomeView";
import { ProjectWorkspaceBar } from "@/components/ProjectWorkspaceBar";
import { TvConsoleStub } from "@/components/TvConsoleStub";
import { CaseworkPlanner } from "@/components/casework/CaseworkPlanner";
import { TemplateLibrary } from "@/components/templates/TemplateLibrary";
import { useDresserPlanSync } from "@/components/DresserPlanSyncContext";
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

const PRESET_ICONS: Record<PresetId, ReactNode> = {
  dresser: (
    <svg className="h-9 w-9 shrink-0 text-[var(--gl-copper-bright)]" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="6" y="8" width="28" height="26" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 16h28M6 24h28" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="20" cy="12" r="1.2" fill="currentColor" />
    </svg>
  ),
  "console-template": (
    <svg className="h-9 w-9 shrink-0 text-[var(--gl-copper-bright)]" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M8 28V14c0-1.1.9-2 2-2h20c1.1 0 2 .9 2 2v14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M6 28h28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 18h12" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  "bookshelf-template": (
    <svg className="h-9 w-9 shrink-0 text-[var(--gl-copper-bright)]" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="10" y="6" width="20" height="28" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 14h20M10 22h20M10 30h20" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  "tv-console": (
    <svg className="h-9 w-9 shrink-0 text-[var(--gl-copper-bright)]" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="8" y="10" width="24" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 30h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "soon-cab": (
    <svg className="h-9 w-9 shrink-0 text-[var(--gl-muted)]" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="10" y="8" width="20" height="26" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 20h8M20 16v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

type ShellMode = "projects" | "workspace";

export function GrainlineApp() {
  const [shellMode, setShellMode] = useState<ShellMode>("projects");
  const [preset, setPreset] = useState<PresetId>("dresser");
  const [appTab, setAppTab] = useState<AppShellTabId>("setup");
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [activeFurnitureConfig, setActiveFurnitureConfig] = useState<FurnitureConfig | null>(null);
  const [layoutSaveNotice, setLayoutSaveNotice] = useState("");
  const [loadedConsoleConfig, setLoadedConsoleConfig] = useState<FurnitureConfig | undefined>();
  const [loadedBookshelfConfig, setLoadedBookshelfConfig] = useState<FurnitureConfig | undefined>();
  const {
    project,
    blockingValidationIssues,
    warningValidationIssues,
    replacePartsInAssemblies,
    resetProject,
    setProjectDescription,
    setProjectPhotos,
  } = useProject();
  const { flushDresserPartsNow } = useDresserPlanSync();
  const active = PRESETS.find((p) => p.id === preset);
  const visiblePresets = PRESETS.filter((p) => !p.experimental);
  const hasBlockingIssues = blockingValidationIssues.length > 0;
  const hasWarnings = warningValidationIssues.length > 0;
  useEffect(() => {
    if (!layoutSaveNotice) return;
    const t = window.setTimeout(() => setLayoutSaveNotice(""), 4000);
    return () => window.clearTimeout(t);
  }, [layoutSaveNotice]);

  const layoutCaseworkPreset = preset === "console-template" || preset === "bookshelf-template";
  const saveLayoutMode: "save" | "go-plan" | "disabled" = activeFurnitureConfig
    ? "save"
    : layoutCaseworkPreset
      ? "go-plan"
      : "disabled";

  const decisionStrip = (() => {
    const health = hasBlockingIssues
      ? "Blocked by validation issues"
      : hasWarnings
        ? "Warnings — verify Plan and Materials"
        : "Ready for materials";

    const recommendation = hasBlockingIssues
      ? "Fix blocking issues in Plan first. Materials stays locked until blockers clear."
      : hasWarnings
        ? "You are on Materials: check warnings and cut layout."
        : "You are on Materials: cut list is ready.";

    return (
      <DecisionStrip
        health={health}
        recommendation={recommendation}
        ctaLabel="Back to Plan"
        onCta={() => setAppTab("build")}
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
    <div className="space-y-5">
      <section className="gl-panel p-5">
        <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Project</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--gl-cream)]">Choose what you are building, then move to Plan.</h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--gl-muted)]">
          Use the menu (top left) for <strong className="text-[var(--gl-cream-soft)]">Projects</strong>. Save from the
          workspace bar or from the buttons at the bottom of Project and Plan.
        </p>
        <label className="mt-4 block max-w-2xl text-sm">
          <span className="text-[var(--gl-cream-soft)]">Project description</span>
          <span className="mt-0.5 block text-xs text-[var(--gl-muted)]">Optional notes for your shop or future you.</span>
          <textarea
            className="input-wood mt-1 min-h-[5rem] w-full resize-y text-sm"
            value={project.description ?? ""}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="e.g. Client: Erin. White oak, soft-close drawers, shop-built base…"
            rows={4}
          />
        </label>
        <div className="mt-4">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--gl-border)] px-3 py-1.5 text-xs text-[var(--gl-cream-soft)] hover:text-[var(--gl-cream)]">
            Add progress photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length === 0) return;
                const encoded = await Promise.all(
                  files.map(
                    (f) =>
                      new Promise<string>((resolve) => {
                        const r = new FileReader();
                        r.onload = () => resolve(typeof r.result === "string" ? r.result : "");
                        r.readAsDataURL(f);
                      })
                  )
                );
                const clean = encoded.filter((row) => row.startsWith("data:image/"));
                if (clean.length > 0) setProjectPhotos([...(project.photos ?? []), ...clean].slice(0, 12));
                e.currentTarget.value = "";
              }}
            />
          </label>
          {(project.photos ?? []).length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {(project.photos ?? []).map((src, i) => (
                <img
                  key={`${src.slice(0, 24)}-${i}`}
                  src={src}
                  alt={`Project progress ${i + 1}`}
                  className="h-14 w-14 rounded-md border border-[var(--gl-border)] object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>
        <p className="mt-4 text-xs text-[var(--gl-muted)]">
          Name and milling defaults live in <strong className="text-[var(--gl-cream-soft)]">Project defaults</strong>{" "}
          below. Current project:{" "}
          <strong className="text-[var(--gl-cream-soft)]">{project.name || "Untitled project"}</strong>
        </p>
      </section>

      <section className="gl-panel p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Choose what you are building</p>
          <p className="text-xs text-[var(--gl-muted)]">Selected: <span className="text-[var(--gl-cream-soft)]">{active?.title ?? "None"}</span></p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePresets.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={Boolean(p.disabled)}
              onClick={() => !p.disabled && setPreset(p.id)}
              className={`flex gap-3 rounded-xl border p-3 text-left transition ${
                preset === p.id
                  ? "border-[var(--gl-accent)] bg-[color-mix(in_srgb,var(--gl-accent)_12%,var(--gl-surface))] text-[var(--gl-text)]"
                  : "border-[var(--gl-border)] bg-[var(--gl-surface)] text-[var(--gl-muted)] hover:border-[var(--gl-border-strong)] hover:text-[var(--gl-text-soft)]"
              } ${p.disabled ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <span className="mt-0.5 shrink-0">{PRESET_ICONS[p.id]}</span>
              <span className="min-w-0">
                <span className="block font-medium text-[var(--gl-cream)]">{p.title}</span>
                <span className="block text-xs text-[var(--gl-muted)]">{p.tag}</span>
                <span className="mt-1 block text-xs text-[var(--gl-muted)]">{p.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <details open className="gl-panel w-full min-w-0 p-5">
        <summary className="cursor-pointer list-none text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase [&::-webkit-details-marker]:hidden">
          Project defaults &amp; library
        </summary>
        <p className="mt-2 text-xs text-[var(--gl-muted)]">
          Name, milling defaults, board width, waste, export, and full project templates (whole-file snapshots) live
          here. Open saved files from the menu → <strong className="text-[var(--gl-cream-soft)]">Projects</strong>.
        </p>
        <div className="mt-4 w-full min-w-0 space-y-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-xs text-[var(--gl-muted)]">
              Plan-only layouts (dresser / console / bookshelf). Stored in this browser; separate from full project
              templates in this section.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-[var(--gl-border)] px-3 py-1.5 text-xs text-[var(--gl-cream-soft)]"
                onClick={() => setShowTemplateLibrary(true)}
              >
                Load layout preset…
              </button>
              <button
                type="button"
                disabled={saveLayoutMode === "disabled"}
                title={
                  saveLayoutMode === "save"
                    ? "Save current console or bookshelf Plan layout to this browser"
                    : saveLayoutMode === "go-plan"
                      ? "Open Plan so the template can sync, then return here to save"
                      : "Layout save applies to console or bookshelf after Plan syncs; dresser uses the template library"
                }
                aria-label={
                  saveLayoutMode === "save"
                    ? "Save layout preset"
                    : saveLayoutMode === "go-plan"
                      ? "Open Plan to enable layout save"
                      : "Save layout preset (unavailable for this preset until Plan syncs)"
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--gl-border)] text-[var(--gl-cream-soft)] hover:border-[var(--gl-border-strong)] hover:text-[var(--gl-cream)] disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => {
                  if (saveLayoutMode === "save" && activeFurnitureConfig) {
                    templateStorageService.saveTemplate(activeFurnitureConfig);
                    setLayoutSaveNotice("Saved layout preset in this browser.");
                    return;
                  }
                  if (saveLayoutMode === "go-plan") {
                    setAppTab("build");
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinejoin="round" />
                  <path d="M17 21v-8H7v8M7 3v5h8" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
          {layoutSaveNotice ? (
            <p className="text-xs text-[var(--gl-cream-soft)]" role="status">
              {layoutSaveNotice}
            </p>
          ) : null}
          <ProjectSetupBar />
        </div>
      </details>
    </div>
  );
  const planPanel = (
    <>
      <div id="build-planner-section">
        {preset === "dresser" ? <DresserPlanner /> : null}
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
        <p className="text-[var(--gl-muted)]">This preset is queued. Use Dresser or another casework preset for now.</p>
      ) : null}
    </>
  );

  const activeTab: AppShellTabId = hasBlockingIssues && appTab === "shop" ? "build" : appTab;

  function handleAppTabChange(next: AppShellTabId) {
    if (next === "shop" && hasBlockingIssues) {
      setAppTab("build");
      return;
    }
    if (next === "shop" && preset === "dresser") {
      flushDresserPartsNow();
    }
    setAppTab(next);
  }

  function handleGoProjectsHome() {
    setShellMode("projects");
  }

  const setupTabFooter = (
    <div className="flex justify-center border-t border-[var(--gl-border)] pt-6">
      <button
        type="button"
        className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)] px-5 py-2.5 text-sm font-medium text-[var(--gl-cream)] hover:bg-[var(--gl-surface)]"
        onClick={() => setAppTab("build")}
      >
        Next: Plan
      </button>
    </div>
  );

  const buildTabFooter = (
    <div className="flex justify-center border-t border-[var(--gl-border)] pt-6">
      <button
        type="button"
        disabled={hasBlockingIssues}
        title={
          hasBlockingIssues
            ? "Clear blocking validation issues in Plan before opening Materials."
            : "Open Materials (cut list)"
        }
        className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)] px-5 py-2.5 text-sm font-medium text-[var(--gl-cream)] hover:bg-[var(--gl-surface)] disabled:cursor-not-allowed disabled:opacity-45"
        onClick={() => {
          if (hasBlockingIssues) return;
          if (preset === "dresser") flushDresserPartsNow();
          setAppTab("shop");
        }}
      >
        Next: Materials
      </button>
    </div>
  );

  function handleNewProject() {
    resetProject();
    setPreset("dresser");
    setLoadedConsoleConfig(undefined);
    setLoadedBookshelfConfig(undefined);
    setActiveFurnitureConfig(null);
    setAppTab("setup");
    setShellMode("workspace");
  }

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="relative mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 border-b border-[var(--gl-border)] pb-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            <AppNavDrawer onGoToProjects={handleGoProjectsHome} onNewProject={handleNewProject} />
            <div className="min-w-0 flex-1">
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
          </div>
          {shellMode === "workspace" ? <ProjectWorkspaceBar /> : null}
        </header>

        {shellMode === "projects" ? (
          <ProjectsHomeView
            onOpenWorkspace={() => setShellMode("workspace")}
            onNewProject={handleNewProject}
          />
        ) : (
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
            setupFooter={setupTabFooter}
            buildFooter={buildTabFooter}
            disableShopTab={hasBlockingIssues}
          />
        )}
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
            setShellMode("workspace");
          }}
        />
      ) : null}
    </div>
  );
}
