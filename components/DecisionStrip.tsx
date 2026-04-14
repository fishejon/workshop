"use client";

type DecisionStripTone = "neutral" | "warning" | "blocked" | "ready";

type DecisionStripProps = {
  health: string;
  recommendation: string;
  ctaLabel: string;
  onCta: () => void;
  tone?: DecisionStripTone;
};

const TONE_STYLES: Record<DecisionStripTone, string> = {
  neutral: "border-white/15 bg-white/[0.04] text-[var(--gl-cream-soft)]",
  warning: "border-amber-300/35 bg-amber-300/10 text-amber-100",
  blocked: "border-red-300/35 bg-red-500/10 text-red-100",
  ready: "border-emerald-300/35 bg-emerald-500/10 text-emerald-100",
};

export function DecisionStrip({ health, recommendation, ctaLabel, onCta, tone = "neutral" }: DecisionStripProps) {
  return (
    <section
      className={`rounded-xl border p-4 ${TONE_STYLES[tone]}`}
      aria-label="Decision strip"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase">Project health: {health}</p>
          <p className="text-sm">Recommendation: {recommendation}</p>
        </div>
        <button
          type="button"
          onClick={onCta}
          className="rounded-lg border border-white/25 bg-black/25 px-3 py-2 text-xs font-medium text-[var(--gl-cream)] hover:border-white/40"
        >
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
