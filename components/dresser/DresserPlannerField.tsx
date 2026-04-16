import type { ReactNode } from "react";

export function DresserPlannerField({
  label,
  children,
  hint,
  source,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  source?: "manual";
}) {
  return (
    <label className="flex h-full flex-col gap-1.5 text-sm">
      <span className="flex min-h-[2.8rem] flex-wrap content-start items-start gap-2 font-medium text-[var(--gl-cream-soft)]">
        {label}
        {source === "manual" ? (
          <span className="rounded border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-1.5 py-0.5 text-[10px] font-normal tracking-wide text-[var(--gl-muted)] uppercase">
            Your input
          </span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="min-h-[2.3rem] text-xs leading-snug text-[var(--gl-muted)]">{hint}</span> : null}
    </label>
  );
}
