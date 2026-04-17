"use client";

import type { BoardPlan, CutPiece } from "@/lib/optimize-cuts";
import { formatShopImperial } from "@/lib/imperial";
import { parseRoughInstanceId } from "@/lib/rough-instance-id";

const SKINS = {
  rough: {
    li: "rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-4",
    strip: "mt-3 flex h-12 w-full overflow-hidden rounded-lg bg-[var(--gl-surface-inset)] ring-1 ring-[var(--gl-border)]",
    ol: "mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--gl-muted)]",
    minSeg: "min-w-[2.5rem]",
    copperBorder: "border-[var(--gl-copper)]/20",
    copperGrad: "from-[var(--gl-copper)]/35 to-[var(--gl-copper)]/15",
  },
  planner: {
    li: "rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-5",
    strip: "mt-4 flex h-14 w-full overflow-hidden rounded-lg bg-[var(--gl-surface-inset)] ring-1 ring-[var(--gl-border)]",
    ol: "mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--gl-muted)]",
    minSeg: "min-w-[2.5rem]",
    copperBorder: "border-[var(--gl-copper)]/20",
    copperGrad: "from-[var(--gl-copper)]/35 to-[var(--gl-copper)]/15",
  },
  yard: {
    li: "rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] p-3",
    strip: "mt-2 flex h-10 w-full overflow-hidden rounded-md bg-[var(--gl-surface-muted)] ring-1 ring-[var(--gl-border)]",
    ol: "mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--gl-muted)]",
    minSeg: "min-w-[2rem]",
    copperBorder: "border-[var(--gl-copper)]/25",
    copperGrad: "from-[var(--gl-copper)]/35 to-[var(--gl-copper)]/12",
  },
} as const;

export type PackedStickSkin = keyof typeof SKINS;

export type PackedStickCutBoardListProps = {
  boards: BoardPlan[];
  skin?: PackedStickSkin;
  /** `stockCuts` matches yard summary (stock length + cut count); default shows waste remainder. */
  boardMeta?: "waste" | "stockCuts";
  shopLabelByRoughInstanceId?: Map<string, string>;
  /** When false, hide the part/component label and show only the shop shorthand label. */
  showPartLabel?: boolean;
  cutProgressByRoughInstanceId?: Record<string, "cut">;
  onToggleCut?: (roughInstanceId: string) => void;
  listClassName?: string;
};

function segmentClasses(
  skin: PackedStickSkin,
  done: boolean,
  interactive: boolean
): string {
  const s = SKINS[skin];
  const base = `flex ${s.minSeg} flex-col justify-center border-r px-1 text-center last:border-r-0 ${s.copperBorder}`;
  if (done) {
    const cur = interactive ? "cursor-pointer" : "cursor-default";
    return `${base} ${cur} bg-gradient-to-b from-[var(--gl-success-bg)] to-[color-mix(in_srgb,var(--gl-success-bg)_65%,var(--gl-surface-inset))] text-[var(--gl-success)]`;
  }
  return `${base} ${interactive ? "cursor-pointer" : ""} bg-gradient-to-b ${s.copperGrad} text-[var(--gl-cream)]`;
}

function CutSegment({
  cut,
  board,
  index,
  skin,
  shopLabel,
  done,
  onToggleCut,
  showPartLabel,
}: {
  cut: CutPiece;
  board: BoardPlan;
  index: number;
  skin: PackedStickSkin;
  shopLabel?: string;
  done: boolean;
  onToggleCut?: (roughInstanceId: string) => void;
  showPartLabel: boolean;
}) {
  const pct = Math.max(skin === "yard" ? 5 : 4, (cut.lengthInches / board.stockLengthInches) * 100);
  const rid = cut.roughInstanceId;
  const interactive = Boolean(rid && onToggleCut);
  const len = formatShopImperial(cut.lengthInches);
  const titleBits = [shopLabel, showPartLabel ? cut.label : undefined, len].filter(Boolean);
  const title = titleBits.join(" — ");

  const inner = (
    <>
      {shopLabel ? (
        <span
          className={`font-mono text-[10px] font-semibold leading-tight sm:text-[11px] ${done ? "text-[var(--gl-success)]" : "text-[var(--gl-copper)]"}`}
        >
          {shopLabel}
        </span>
      ) : null}
      <span className="text-xs font-medium leading-tight">{len}</span>
      {showPartLabel && cut.label ? (
        <span
          className={`hidden truncate text-xs leading-tight sm:block ${done ? "text-[color-mix(in_srgb,var(--gl-success)_80%,var(--gl-muted))]" : "text-[var(--gl-muted)]"}`}
        >
          {cut.label}
        </span>
      ) : null}
    </>
  );

  if (interactive && rid) {
    return (
      <button
        key={`${board.index}-${index}-${cut.lengthInches}-${rid}`}
        type="button"
        style={{ width: `${pct}%` }}
        className={segmentClasses(skin, done, true)}
        title={title}
        aria-pressed={done}
        aria-label={`Rough cut ${len}${showPartLabel && cut.label ? `, ${cut.label}` : ""}${shopLabel ? `, label ${shopLabel}` : ""}. ${done ? "Marked cut." : "Not marked cut."} Press to toggle.`}
        onClick={() => onToggleCut?.(rid)}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      key={`${board.index}-${index}-${cut.lengthInches}-${cut.label ?? ""}`}
      style={{ width: `${pct}%` }}
      className={segmentClasses(skin, done, false)}
      title={title}
    >
      {inner}
    </div>
  );
}

/**
 * 1D stick pack visualization: tap segments when a rough piece is cut (progress follows part instance, not stick slot).
 */
export function PackedStickCutBoardList({
  boards,
  skin = "rough",
  boardMeta = "waste",
  shopLabelByRoughInstanceId,
  showPartLabel = true,
  cutProgressByRoughInstanceId,
  onToggleCut,
  listClassName = "space-y-4",
}: PackedStickCutBoardListProps) {
  const s = SKINS[skin];
  return (
    <ul className={listClassName}>
      {boards.map((board) => (
        <li key={board.index} className={s.li}>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--gl-muted)]">
            <span className="font-medium text-[var(--gl-cream)]">Board {board.index}</span>
            {boardMeta === "stockCuts" ? (
              <span>
                Stock {formatShopImperial(board.stockLengthInches)} — cuts {board.cuts.length}
              </span>
            ) : (
              <span>
                Waste ~ <span className="text-[var(--gl-cream)]">{formatShopImperial(board.wasteInches)}</span>
              </span>
            )}
          </div>
          <div className={s.strip}>
            {board.cuts.map((cut, i) => {
              const rid = cut.roughInstanceId;
              const shopLabel = (() => {
                if (!rid) return undefined;
                const direct = shopLabelByRoughInstanceId?.get(rid);
                if (direct) return direct;
                // Lane-suffixed ids (`part:inst#lane`) should display the base shop label.
                const parsed = parseRoughInstanceId(rid);
                if (!parsed) return undefined;
                const base = `${parsed.partId}:${parsed.instanceIndex}`;
                return shopLabelByRoughInstanceId?.get(base);
              })();
              const done = Boolean(rid && cutProgressByRoughInstanceId?.[rid] === "cut");
              return (
                <CutSegment
                  key={`${board.index}-seg-${i}-${rid ?? cut.lengthInches}`}
                  cut={cut}
                  board={board}
                  index={i}
                  skin={skin}
                  shopLabel={shopLabel}
                  done={done}
                  onToggleCut={onToggleCut}
                  showPartLabel={showPartLabel}
                />
              );
            })}
          </div>
          <ol className={s.ol}>
            {board.cuts.map((cut, i) => {
              const rid = cut.roughInstanceId;
              const shopLabel = (() => {
                if (!rid) return undefined;
                const direct = shopLabelByRoughInstanceId?.get(rid);
                if (direct) return direct;
                const parsed = parseRoughInstanceId(rid);
                if (!parsed) return undefined;
                const base = `${parsed.partId}:${parsed.instanceIndex}`;
                return shopLabelByRoughInstanceId?.get(base);
              })();
              const done = Boolean(rid && cutProgressByRoughInstanceId?.[rid] === "cut");
              return (
                <li key={`${board.index}-list-${i}-${rid ?? i}`}>
                  {i + 1}. {shopLabel ? <span className="font-mono text-[var(--gl-copper)]">{shopLabel} · </span> : null}
                  {formatShopImperial(cut.lengthInches)}
                  {showPartLabel && cut.label ? ` — ${cut.label}` : ""}
                  {done ? " · cut" : ""}
                </li>
              );
            })}
          </ol>
        </li>
      ))}
    </ul>
  );
}
