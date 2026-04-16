"use client";

import { useMemo } from "react";
import { DresserPreview, estimateDresserColumnOpeningWidthInches } from "@/components/DresserPreview";
import { useProject } from "@/components/ProjectContext";
import { buildCaseOutlineFromProject } from "@/lib/geometry/case-outline-from-project";
import { showDresserPartsLinkedOutline } from "@/lib/gl-dresser-outline-flag";

/**
 * Optional dresser schematic derived from saved cut-list parts (CAD-lite slice 1).
 * Not mounted on Plan by default — avoids diverging from live inputs (grain text can lag rail edits).
 * Mount where you want a parts-only check (e.g. Materials) and set `NEXT_PUBLIC_GL_DRESSER_PARTS_OUTLINE=1`.
 */
export function DresserPartsLinkedOutline() {
  const { project } = useProject();
  const enabled = showDresserPartsLinkedOutline();

  const outline = useMemo(() => buildCaseOutlineFromProject(project), [project]);
  const columnOpeningWidthInches = useMemo(() => {
    if (!outline) return null;
    return estimateDresserColumnOpeningWidthInches(outline.outerW, outline.columnCount, outline.materialT);
  }, [outline]);

  if (!enabled) return null;

  if (!outline) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--gl-border)] bg-[var(--gl-surface-muted)]/40 p-4">
        <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
          Cut list–linked schematic (opt-in)
        </p>
        <p className="mt-2 text-xs text-[var(--gl-muted)]">
          No dresser carcass pattern detected on the cut list yet, or stack metadata is missing. Generate dresser
          case parts to preview proportions from saved rows.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)]/60 p-5">
      <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
        Cut list–linked schematic (opt-in)
      </p>
      <p className="mt-2 text-xs text-[var(--gl-muted)]">
        Proportions inferred from <strong className="text-[var(--gl-cream-soft)]">Case top / sides / back</strong> and
        drawer row labels. Openings split evenly inside the drawer zone for display only — use Plan for exact row
        heights.
      </p>
      <DresserPreview
        className="mt-4"
        outerW={outline.outerW}
        outerH={outline.outerH}
        outerD={outline.outerD}
        columnCount={outline.columnCount}
        rowCount={outline.rowCount}
        rowOpeningHeightsInches={outline.rowOpeningHeightsInches}
        columnOpeningWidthInches={columnOpeningWidthInches}
        kickH={outline.kickH}
        topBand={outline.topBand}
        bottomBand={outline.bottomBand}
        rail={outline.rail}
        materialT={outline.materialT}
      />
    </div>
  );
}
