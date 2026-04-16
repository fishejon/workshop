import { budgetForRowOpeningHeights } from "@/lib/dresser-engine";
import { formatImperial, parseInches } from "@/lib/imperial";

function parsePositive(s: string): number | null {
  const n = parseInches(s);
  if (n === null || n <= 0) return null;
  return n;
}

export function DresserRowOpeningBudgetHint({
  outerH,
  kick,
  topAsm,
  bottomPanel,
  rail,
  rowCount,
  rowStrings,
  fractionDenominator,
}: {
  outerH: string;
  kick: string;
  topAsm: string;
  bottomPanel: string;
  rail: string;
  rowCount: number;
  rowStrings: string[];
  fractionDenominator: number;
}) {
  const h = parsePositive(outerH);
  const k = parseInches(kick.trim() === "" ? "0" : kick);
  const top = parseInches(topAsm);
  const bot = parseInches(bottomPanel);
  const r = parseInches(rail);
  if (
    h === null ||
    k === null ||
    k < 0 ||
    top === null ||
    top < 0 ||
    bot === null ||
    bot < 0 ||
    r === null ||
    r < 0 ||
    !Number.isFinite(rowCount) ||
    rowCount < 1
  ) {
    return null;
  }
  const budget = budgetForRowOpeningHeights({
    outerHeight: h,
    kickHeight: k,
    topAssemblyHeight: top,
    bottomPanelThickness: bot,
    rowCount,
    railBetweenDrawers: r,
  });
  if (budget === null) return null;
  const values = rowStrings.slice(0, rowCount).map((s) => parseInches(s.trim()));
  const allValid = values.every((v) => v !== null && v > 0);
  const currentSum = allValid ? values.reduce<number>((a, b) => a + (b as number), 0) : null;
  const format = (inches: number) => formatImperial(inches, fractionDenominator);

  return (
    <p className="mt-2 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-xs text-[var(--gl-muted)]">
      Opening heights must sum to <strong className="text-[var(--gl-cream)]">{format(budget)}</strong>
      {currentSum !== null ? (
        <>
          {" "}
          · Current sum: <strong className="text-[var(--gl-cream)]">{format(currentSum)}</strong>
          {Math.abs(currentSum - budget) > 1 / 32 ? (
            <span className="text-[var(--gl-warning)]">
              {" "}
              — off by {format(Math.abs(currentSum - budget))} (±{format(1 / 32)} allowed)
            </span>
          ) : (
            <span className="text-[var(--gl-success)]"> — balanced</span>
          )}
        </>
      ) : (
        <span> · Fill every row to check the sum.</span>
      )}
    </p>
  );
}
