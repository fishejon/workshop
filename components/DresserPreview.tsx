"use client";

import type { ReactNode } from "react";
import type { DresserColumnCount } from "@/lib/dresser-engine";
import { formatShopImperial } from "@/lib/imperial";

type Props = {
  outerW: number;
  outerH: number;
  outerD: number;
  columnCount: DresserColumnCount;
  rowCount: number;
  /** Opening height per row in inches (same order as drawer rows). */
  rowOpeningHeightsInches: number[];
  /**
   * Clear opening width per column (inside stiles/dividers). When omitted, a simple estimate is used for labels only.
   */
  columnOpeningWidthInches?: number | null;
  kickH: number;
  topBand: number;
  bottomBand: number;
  rail: number;
  materialT: number;
  className?: string;
};

/**
 * Schematic dresser preview in three orthographic views (proportional only).
 */
export function DresserPreview({
  outerW,
  outerH,
  outerD,
  columnCount,
  rowCount,
  rowOpeningHeightsInches,
  columnOpeningWidthInches,
  kickH,
  topBand,
  bottomBand,
  rail,
  materialT,
  className = "",
}: Props) {
  return (
    <div
      className={`mx-auto flex w-full flex-wrap items-start justify-center gap-4 ${className}`}
      role="img"
      aria-label="Dresser orthographic preview: front shows drawer opening width by height per cell; side and top views"
    >
      <ViewShell title="Front">
        <FrontView
          outerW={outerW}
          outerH={outerH}
          columnCount={columnCount}
          rowCount={rowCount}
          rowOpeningHeightsInches={rowOpeningHeightsInches}
          columnOpeningWidthInches={columnOpeningWidthInches}
          kickH={kickH}
          topBand={topBand}
          bottomBand={bottomBand}
          rail={rail}
          materialT={materialT}
        />
      </ViewShell>
      <ViewShell title="Side">
        <SideView outerD={outerD} outerH={outerH} kickH={kickH} topBand={topBand} bottomBand={bottomBand} />
      </ViewShell>
      <ViewShell title="Top">
        <TopView outerW={outerW} outerD={outerD} materialT={materialT} columnCount={columnCount} />
      </ViewShell>
    </div>
  );
}

function ViewShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full max-w-[260px] rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-3">
      <p className="mb-2 text-center text-xs font-medium tracking-wide text-[var(--gl-muted)] uppercase">{title}</p>
      <div className="flex justify-center">{children}</div>
    </div>
  );
}

/** Used by front-view labels and optional parts-linked preview when planner width is unavailable. */
export function estimateDresserColumnOpeningWidthInches(
  outerW: number,
  columnCount: number,
  materialT: number
): number {
  if (!Number.isFinite(outerW) || outerW <= 0 || columnCount < 1) return 0;
  const inner = outerW - 2 * materialT;
  const divs = Math.max(0, columnCount - 1);
  /** Schematic: assume divider thickness ≈ side thickness for label math when planner value is absent. */
  const opening = (inner - divs * materialT) / columnCount;
  return Math.max(0, opening);
}

function FrontView({
  outerW,
  outerH,
  columnCount,
  rowCount,
  rowOpeningHeightsInches,
  columnOpeningWidthInches,
  kickH,
  topBand,
  bottomBand,
  rail,
  materialT,
}: Omit<Props, "outerD" | "className">) {
  const vbW = 210;
  const vbH = 230;
  const pad = 14;
  const innerW = vbW - 2 * pad;
  const innerH = vbH - 2 * pad;
  const scale = Math.min(innerW / Math.max(outerW, 1), innerH / Math.max(outerH, 1));
  const caseW = outerW * scale;
  const caseH = outerH * scale;
  const ox = pad + (innerW - caseW) / 2;
  const oy = pad + (innerH - caseH) / 2;
  const kickScaled = (kickH / Math.max(outerH, 1)) * caseH;
  const topScaled = (topBand / Math.max(outerH, 1)) * caseH;
  const bottomScaled = (bottomBand / Math.max(outerH, 1)) * caseH;
  const railScaled = (rail / Math.max(outerH, 1)) * caseH;
  const heights = rowOpeningHeightsInches.slice(0, rowCount);
  while (heights.length < rowCount) heights.push(0);
  const openingHs = heights.map((inch) => (inch / Math.max(outerH, 1)) * caseH);
  const colW = caseW / columnCount;
  const openingWInches =
    columnOpeningWidthInches !== undefined &&
    columnOpeningWidthInches !== null &&
    Number.isFinite(columnOpeningWidthInches) &&
    columnOpeningWidthInches > 0
      ? columnOpeningWidthInches
      : estimateDresserColumnOpeningWidthInches(outerW, columnCount, materialT);

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} className="h-auto w-full max-w-[220px]">
      <rect x={ox} y={oy} width={caseW} height={caseH} rx={3} fill="rgba(232,223,204,0.92)" stroke="rgba(55,48,40,0.35)" />
      {kickScaled > 0.25 ? (
        <rect x={ox} y={oy + caseH - kickScaled} width={caseW} height={kickScaled} fill="rgba(60,52,44,0.45)" />
      ) : null}
      <rect x={ox + 2} y={oy + 2} width={caseW - 4} height={Math.max(topScaled - 2, 0)} fill="rgba(80,70,60,0.12)" />
      <rect
        x={ox + 2}
        y={oy + caseH - kickScaled - bottomScaled}
        width={caseW - 4}
        height={Math.max(bottomScaled - 1, 0)}
        fill="rgba(80,70,60,0.1)"
      />
      {columnCount > 1
        ? Array.from({ length: columnCount - 1 }, (_, i) => {
            const x = ox + colW * (i + 1) - (materialT / Math.max(outerW, 1)) * caseW * 0.5;
            const w = Math.max(((materialT * 2) / Math.max(outerW, 1)) * caseW, 1);
            return (
              <rect
                key={`div-${i}`}
                x={x}
                y={oy + topScaled}
                width={w}
                height={caseH - topScaled - kickScaled - bottomScaled}
                fill="rgba(55,48,40,0.2)"
              />
            );
          })
        : null}
      {(() => {
        let yCursor = oy + topScaled;
        const nodes: ReactNode[] = [];
        for (let r = 0; r < rowCount; r++) {
          const h = openingHs[r] ?? 0;
          for (let c = 0; c < columnCount; c++) {
            const inset = 3;
            nodes.push(
              <rect
                key={`d-${r}-${c}`}
                x={ox + c * colW + inset}
                y={yCursor + inset * 0.5}
                width={colW - inset * 2}
                height={Math.max(h - inset, 2)}
                rx={2}
                fill="rgba(255,255,255,0.4)"
                stroke="rgba(55,48,40,0.35)"
                strokeWidth={0.75}
              />
            );
            const cx = ox + c * colW + colW / 2;
            const hInches = rowOpeningHeightsInches[r] ?? 0;
            nodes.push(
              <text
                key={`t-${r}-${c}`}
                x={cx}
                y={yCursor + h / 2}
                textAnchor="middle"
                fill="rgba(45,40,36,0.78)"
                fontSize={6}
                fontFamily="var(--font-geist-sans), system-ui, sans-serif"
              >
                <tspan x={cx} dy="-3">
                  {formatShopImperial(openingWInches)} W
                </tspan>
                <tspan x={cx} dy="9">
                  {formatShopImperial(hInches)} H
                </tspan>
              </text>
            );
          }
          yCursor += h;
          if (r < rowCount - 1) {
            // Omit zero-height rail bands (hairline artifacts) but still advance layout for sub-pixel rails.
            if (railScaled >= 0.5) {
              nodes.push(
                <rect
                  key={`rail-${r}`}
                  x={ox + 4}
                  y={yCursor}
                  width={caseW - 8}
                  height={railScaled}
                  fill="rgba(55,48,40,0.22)"
                />
              );
            }
            yCursor += railScaled;
          }
        }
        return nodes;
      })()}
    </svg>
  );
}

function SideView({
  outerD,
  outerH,
  kickH,
  topBand,
  bottomBand,
}: {
  outerD: number;
  outerH: number;
  kickH: number;
  topBand: number;
  bottomBand: number;
}) {
  const vbW = 210;
  const vbH = 230;
  const pad = 14;
  const innerW = vbW - 2 * pad;
  const innerH = vbH - 2 * pad;
  const scale = Math.min(innerW / Math.max(outerD, 1), innerH / Math.max(outerH, 1));
  const caseW = outerD * scale;
  const caseH = outerH * scale;
  const ox = pad + (innerW - caseW) / 2;
  const oy = pad + (innerH - caseH) / 2;
  const kickScaled = (kickH / Math.max(outerH, 1)) * caseH;
  const topScaled = (topBand / Math.max(outerH, 1)) * caseH;
  const bottomScaled = (bottomBand / Math.max(outerH, 1)) * caseH;
  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} className="h-auto w-full max-w-[220px]">
      <rect x={ox} y={oy} width={caseW} height={caseH} rx={3} fill="rgba(226,215,195,0.9)" stroke="rgba(55,48,40,0.35)" />
      {kickScaled > 0.25 ? (
        <rect x={ox} y={oy + caseH - kickScaled} width={caseW} height={kickScaled} fill="rgba(60,52,44,0.45)" />
      ) : null}
      <rect x={ox + 2} y={oy + 2} width={caseW - 4} height={Math.max(topScaled - 2, 0)} fill="rgba(80,70,60,0.13)" />
      <rect
        x={ox + 2}
        y={oy + caseH - kickScaled - bottomScaled}
        width={caseW - 4}
        height={Math.max(bottomScaled - 1, 0)}
        fill="rgba(80,70,60,0.1)"
      />
      <text
        x={ox + caseW / 2}
        y={oy + caseH + 12}
        textAnchor="middle"
        fill="rgba(75,68,60,0.9)"
        fontSize={8}
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
      >
        D {formatShopImperial(outerD)}
      </text>
      <text
        x={ox - 6}
        y={oy + caseH / 2}
        textAnchor="middle"
        transform={`rotate(-90 ${ox - 6} ${oy + caseH / 2})`}
        fill="rgba(75,68,60,0.9)"
        fontSize={8}
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
      >
        H {formatShopImperial(outerH)}
      </text>
    </svg>
  );
}

function TopView({
  outerW,
  outerD,
  materialT,
  columnCount,
}: {
  outerW: number;
  outerD: number;
  materialT: number;
  columnCount: DresserColumnCount;
}) {
  const vbW = 210;
  const vbH = 230;
  const pad = 14;
  const innerW = vbW - 2 * pad;
  const innerH = vbH - 2 * pad;
  const scale = Math.min(innerW / Math.max(outerW, 1), innerH / Math.max(outerD, 1));
  const caseW = outerW * scale;
  const caseD = outerD * scale;
  const ox = pad + (innerW - caseW) / 2;
  const oy = pad + (innerH - caseD) / 2;
  const colW = caseW / columnCount;
  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} className="h-auto w-full max-w-[220px]">
      <rect x={ox} y={oy} width={caseW} height={caseD} rx={3} fill="rgba(233,223,203,0.9)" stroke="rgba(55,48,40,0.35)" />
      {columnCount > 1
        ? Array.from({ length: columnCount - 1 }, (_, i) => {
            const x = ox + colW * (i + 1) - (materialT / Math.max(outerW, 1)) * caseW * 0.5;
            const w = Math.max(((materialT * 2) / Math.max(outerW, 1)) * caseW, 1);
            return <rect key={`top-div-${i}`} x={x} y={oy + 2} width={w} height={caseD - 4} fill="rgba(55,48,40,0.2)" />;
          })
        : null}
      <text
        x={ox + caseW / 2}
        y={oy + caseD + 12}
        textAnchor="middle"
        fill="rgba(75,68,60,0.9)"
        fontSize={8}
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
      >
        W {formatShopImperial(outerW)}
      </text>
      <text
        x={ox - 6}
        y={oy + caseD / 2}
        textAnchor="middle"
        transform={`rotate(-90 ${ox - 6} ${oy + caseD / 2})`}
        fill="rgba(75,68,60,0.9)"
        fontSize={8}
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
      >
        D {formatShopImperial(outerD)}
      </text>
    </svg>
  );
}
