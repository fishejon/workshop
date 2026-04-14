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
  neutral: "border-[var(--gl-border)] bg-[var(--gl-surface-muted)] text-[var(--gl-text-soft)]",
  warning: "border-[color-mix(in_srgb,var(--gl-warning)_35%,var(--gl-border))] bg-[var(--gl-warning-bg)] text-[var(--gl-warning)]",
  blocked: "border-[color-mix(in_srgb,var(--gl-danger)_35%,var(--gl-border))] bg-[var(--gl-danger-bg)] text-[var(--gl-danger)]",
  ready: "border-[color-mix(in_srgb,var(--gl-success)_35%,var(--gl-border))] bg-[var(--gl-success-bg)] text-[var(--gl-success)]",
};

export function DecisionStrip({ health, recommendation, ctaLabel, onCta, tone = "neutral" }: DecisionStripProps) {
  return (
    <section
      className={`rounded-2xl border p-4 ${TONE_STYLES[tone]}`}
      aria-label="Decision strip"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide uppercase opacity-95">{health}</p>
          <p className="text-sm opacity-95">{recommendation}</p>
        </div>
        <button type="button" onClick={onCta} className="gl-btn gl-btn-primary shrink-0">
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
