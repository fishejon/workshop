"use client";

import Link from "next/link";
import { JoineryPanel } from "@/components/JoineryPanel";
import { RoughStickLayout } from "@/components/RoughStickLayout";
export function LabsPageContent() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm">
        <Link
          href="/"
          className="text-[var(--gl-copper)] underline decoration-[var(--gl-copper)]/40 underline-offset-2 hover:decoration-[var(--gl-copper)]"
        >
          Back to planner
        </Link>
      </p>

      <header className="space-y-2 border-b border-[var(--gl-border)] pb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gl-copper-bright)] uppercase">Grainline labs</p>
        <h1 className="font-display text-3xl text-[var(--gl-cream)]">Joinery & stick layout</h1>
        <p className="text-sm text-[var(--gl-muted)]">
          Experiments only. Edits save to the same <code className="text-[var(--gl-cream-soft)]">localStorage</code>{" "}
          project as the planner. By default, <strong className="text-[var(--gl-cream-soft)]">Materials</strong> (cut
          list, CSV, shop print) and cut-list validation use{" "}
          <strong className="text-[var(--gl-cream-soft)]">finished parts only</strong>—joinery history from this page is
          ignored until you intentionally enable integration.
        </p>
        <p className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-3 text-xs text-[var(--gl-muted)]">
          <strong className="text-[var(--gl-cream-soft)]">Labs vs Materials:</strong> joinery rules and stick packing
          you apply here stay in <code className="text-[var(--gl-cream-soft)]">project.joints</code> / layout helpers for
          exploration. To fold joinery assumptions into Materials, CSV, and print (and run full joinery validation), set{" "}
          <code className="text-[var(--gl-cream-soft)]">NEXT_PUBLIC_GL_MAIN_PATH_JOINERY=1</code> in{" "}
          <code className="text-[var(--gl-cream-soft)]">.env.local</code> during integration—default in production stays{" "}
          <strong>off</strong> until you ship the behavior.
        </p>
      </header>

      <div className="space-y-6">
        <JoineryPanel />
        <RoughStickLayout />
      </div>
    </div>
  );
}
