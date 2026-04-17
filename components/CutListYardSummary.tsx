"use client";

import { useMemo, useState } from "react";
import { PackedStickCutBoardList } from "@/components/PackedStickCutStrip";
import { useProject } from "@/components/ProjectContext";
import { groupPartsByMaterial } from "@/lib/board-feet";
import { formatLinearFeetShop, formatShopImperial } from "@/lib/imperial";
import { partsForHardwoodYardCutList } from "@/lib/cut-list-yard-parts";
import { buildLumberVehicleRows, type LumberVehicleRow } from "@/lib/lumber-vehicle-summary";
import { buildYardRoughInstanceLabelMap } from "@/lib/yard-cut-progress";

function boardsToBuyForRow(row: LumberVehicleRow): { display: string; title?: string } {
  if (row.totalLinealInches <= 0) {
    return { display: "0" };
  }
  if (row.packError) {
    return { display: "—", title: row.packError };
  }
  if (row.packedBoards) {
    return { display: String(row.packedBoards.length) };
  }
  return { display: "0" };
}

/**
 * Yard shopping strip: nominal lumber line, total lineal, board count, stick length, interactive cut layout.
 */
export function CutListYardSummary() {
  const { project, toggleCutProgress, setDrawerYardPackAxis } = useProject();
  const [isExpanded, setIsExpanded] = useState(true);
  const drawerPackAxis = project.drawerYardPackAxis ?? "width";

  const yardParts = useMemo(() => partsForHardwoodYardCutList(project), [project]);

  const shopLabelByRoughInstanceId = useMemo(
    () => buildYardRoughInstanceLabelMap(project),
    [project]
  );

  const groups = useMemo(
    () => groupPartsByMaterial(yardParts, project.wasteFactorPercent),
    [yardParts, project.wasteFactorPercent]
  );

  const rows = useMemo(
    () =>
      buildLumberVehicleRows(
        groups,
        yardParts,
        project.maxTransportLengthInches,
        {
          maxPurchasableBoardWidthInches: project.maxPurchasableBoardWidthInches,
          stockWidthByMaterialGroup: project.stockWidthByMaterialGroup,
        }
      , 0.125, { drawerPackAxis }),
    [
      groups,
      yardParts,
      project.maxTransportLengthInches,
      project.maxPurchasableBoardWidthInches,
      project.stockWidthByMaterialGroup,
      drawerPackAxis,
    ]
  );

  const vehicleMaxInches = project.maxTransportLengthInches;

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-4 text-sm text-[var(--gl-muted)]">
        Add parts on the Plan tab to see what dimensional sticks to buy.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)]">
      <div className="border-b border-[var(--gl-border)] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Cut list</h2>
            <p className="mt-1 text-xs text-[var(--gl-muted)]">
              One row per rack call (nominal 1× / 2× from your max board face width and thickness category). Board count
              packs each part&apos;s lengths at your max haul length of{" "}
              <strong className="text-[var(--gl-cream-soft)]">{formatShopImperial(vehicleMaxInches)}</strong> with{" "}
              <strong className="text-[var(--gl-cream-soft)]">⅛″ kerf</strong> between cuts on the same stick.
            </p>
            <p className="mt-1 text-xs text-[var(--gl-muted)]">
              Drawer bottoms (ply / hardboard) are excluded from hardwood stick and board-foot math here.
            </p>
            {project.omitDresserCaseBackFromHardwoodCutList ? (
              <p className="mt-1 text-xs text-[var(--gl-copper-bright)]">
                Case back is excluded from this hardwood stick list (toggle under Plan → dresser back panel).
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-md border border-[var(--gl-border)] px-2 py-1 text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream)]"
            aria-expanded={isExpanded}
            aria-controls="cut-list-collapsible-content"
            onClick={() => setIsExpanded((v) => !v)}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>
      {isExpanded ? (
        <div id="cut-list-collapsible-content">
      <div className="mx-4 mt-4 overflow-hidden rounded-xl border border-[var(--gl-border)] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <table className="gl-numeric w-full text-left text-sm text-neutral-900">
        <thead className="bg-neutral-100 text-xs text-neutral-600 uppercase tracking-wide">
          <tr>
            <th className="px-5 py-3 font-medium">Lumber type</th>
            <th className="px-5 py-3 text-right font-medium">Total lineal</th>
            <th className="px-5 py-3 text-right font-medium">Boards</th>
            <th className="px-5 py-3 text-right font-medium">Each board length</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {rows.map((row) => {
            const { display, title } = boardsToBuyForRow(row);
            return (
              <tr key={row.key}>
                <td className="px-5 py-3.5 font-medium text-neutral-900">{row.yardLumberLabel}</td>
                <td className="px-5 py-3.5 text-right tabular-nums text-neutral-800">
                  {formatLinearFeetShop(row.adjustedLinearFeet)}
                </td>
                <td
                  className="px-5 py-3.5 text-right text-lg font-semibold tabular-nums tracking-tight text-neutral-900"
                  title={title}
                >
                  {display}
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums text-neutral-700">
                  {formatShopImperial(vehicleMaxInches)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <div className="border-t border-[var(--gl-border)] px-4 py-3">
        <h3 className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Cut layout</h3>
        <p className="mt-1 text-xs text-[var(--gl-muted)]">
          Length-only nesting on each stick (packs each part’s <strong className="text-[var(--gl-cream-soft)]">rough length</strong>). Tap
          segments to mark rough pieces cut—same marks as the rough stick layout on Plan. Width and thickness changes won’t
          affect this layout unless they also change rough <em>length</em>; for width-aware planning use the 2D estimate on{" "}
          <strong className="text-[var(--gl-cream-soft)]">Lumber &amp; buy list</strong>.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--gl-muted)]">
            Drawer packing: default is <strong className="text-[var(--gl-cream-soft)]">width</strong> (grain horizontal on the stick). Switch to{" "}
            <strong className="text-[var(--gl-cream-soft)]">height</strong> if you prefer counting the tall axis as lineal.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] px-2 py-1">
            <span className="text-xs text-[var(--gl-muted)]">Drawers by</span>
            <select
              className="input-wood py-1 text-xs"
              value={drawerPackAxis}
              onChange={(e) => setDrawerYardPackAxis(e.target.value as "height" | "width")}
            >
              <option value="height">Height</option>
              <option value="width">Width</option>
            </select>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-4 pt-0">
        {rows.map((row) => (
          <div key={`vis-${row.key}`} className="space-y-2">
            <p className="text-sm font-medium text-[var(--gl-cream)]">{row.yardLumberLabel}</p>
            {row.packError ? (
              <p className="text-xs text-[var(--gl-warning)]">{row.packError}</p>
            ) : row.packedBoards && row.packedBoards.length > 0 ? (
              <PackedStickCutBoardList
                boards={row.packedBoards}
                skin="yard"
                boardMeta="stockCuts"
                listClassName="space-y-2"
                shopLabelByRoughInstanceId={shopLabelByRoughInstanceId}
                showPartLabel={false}
                cutProgressByRoughInstanceId={project.cutProgressByRoughInstanceId}
                onToggleCut={toggleCutProgress}
              />
            ) : (
              <p className="text-xs text-[var(--gl-muted)]">No rough lengths to pack for this type.</p>
            )}
          </div>
        ))}
      </div>
        </div>
      ) : null}
    </div>
  );
}
