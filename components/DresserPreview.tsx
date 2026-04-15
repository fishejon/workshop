"use client";

import type { ReactNode } from "react";
import type { DresserColumnCount } from "@/lib/dresser-engine";
import { formatShopImperial } from "@/lib/imperial";

type Props = {
  outerW: number;
  outerH: number;
  columnCount: DresserColumnCount;
  rowCount: number;
  /** Opening height per row in inches (same order as drawer rows). */
  rowOpeningHeightsInches: number[];
  kickH: number;
  topBand: number;
  bottomBand: number;
  rail: number;
  materialT: number;
  className?: string;
};

/**
 * Schematic front elevation (not to scale labels — proportions only).
 */
export function DresserPreview({
  outerW,
  outerH,
  columnCount,
  rowCount,
  rowOpeningHeightsInches,
  kickH,
  topBand,
  bottomBand,
  rail,
  materialT,
  className = "",
}: Props) {
  const vbW = 200;
  const vbH = 280;
  const pad = 8;
  const innerW = vbW - 2 * pad;
  const innerH = vbH - 2 * pad;

  const scaleX = innerW / Math.max(outerW, 1);
  const scaleY = innerH / Math.max(outerH, 1);
  const scale = Math.min(scaleX, scaleY);
  const caseW = outerW * scale;
  const caseH = outerH * scale;
  const ox = pad + (innerW - caseW) / 2;
  const oy = pad + (innerH - caseH) / 2;

  const kickScaled = (kickH / outerH) * caseH;
  const topScaled = (topBand / outerH) * caseH;
  const bottomScaled = (bottomBand / outerH) * caseH;
  const railScaled = (rail / outerH) * caseH;

  const heights = rowOpeningHeightsInches.slice(0, rowCount);
  while (heights.length < rowCount) heights.push(0);
  const openingHs = heights.map((inch) => (inch / outerH) * caseH);

  const colW = caseW / columnCount;

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      className={`h-auto w-full max-w-md overflow-visible ${className}`}
      role="img"
      aria-label="Dresser front schematic"
    >
      <defs>
        <linearGradient id="caseFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(245,240,232,0.95)" />
          <stop offset="100%" stopColor="rgba(212,197,170,0.9)" />
        </linearGradient>
        <linearGradient id="kickFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(68,60,52,0.35)" />
          <stop offset="100%" stopColor="rgba(40,36,32,0.5)" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect x={ox} y={oy} width={caseW} height={caseH} rx={3} fill="url(#caseFill)" filter="url(#softShadow)" />
      {kickScaled > 0.25 ? (
        <rect
          x={ox}
          y={oy + caseH - kickScaled}
          width={caseW}
          height={kickScaled}
          fill="url(#kickFill)"
          opacity={0.9}
        />
      ) : null}

      {/* Top / bottom bands (ghost) */}
      <rect
        x={ox + 2}
        y={oy + 2}
        width={caseW - 4}
        height={Math.max(topScaled - 2, 0)}
        rx={1}
        fill="rgba(120,110,98,0.12)"
      />
      <rect
        x={ox + 2}
        y={oy + caseH - kickScaled - bottomScaled}
        width={caseW - 4}
        height={Math.max(bottomScaled - 1, 0)}
        fill="rgba(120,110,98,0.1)"
      />

      {/* Column dividers */}
      {columnCount > 1
        ? Array.from({ length: columnCount - 1 }, (_, i) => {
            const x = ox + colW * (i + 1) - (materialT / outerW) * caseW * 0.5;
            const w = Math.max(((materialT * 2) / outerW) * caseW, 1);
            return (
              <rect
                key={`div-${i}`}
                x={x}
                y={oy + topScaled}
                width={w}
                height={caseH - topScaled - kickScaled - bottomScaled}
                fill="rgba(55,48,40,0.18)"
              />
            );
          })
        : null}

      {/* Drawer rows */}
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
                fill="rgba(255,255,255,0.35)"
                stroke="rgba(55,48,40,0.35)"
                strokeWidth={0.75}
              />
            );
            nodes.push(
              <text
                key={`t-${r}-${c}`}
                x={ox + c * colW + colW / 2}
                y={yCursor + h / 2 + 3}
                textAnchor="middle"
                fill="rgba(45,40,36,0.78)"
                fontSize={7}
                fontFamily="var(--font-geist-sans), system-ui, sans-serif"
              >
                {formatShopImperial(rowOpeningHeightsInches[r] ?? 0)}
              </text>
            );
          }
          yCursor += h;
          if (r < rowCount - 1) {
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
            yCursor += railScaled;
          }
        }
        return nodes;
      })()}

      <text
        x={ox + caseW / 2}
        y={oy - 2}
        textAnchor="middle"
        fill="rgba(90,82,72,0.88)"
        fontSize={8}
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
      >
        Front · proportional
      </text>
    </svg>
  );
}
