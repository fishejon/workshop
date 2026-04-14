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
          Experiments only. Edits save to the same project as the planner, but the main cut list, CSV, shop print, and
          validation currently ignore joinery records—numbers on the Cut list tab stay unchanged by anything you do
          here.
        </p>
      </header>

      <div className="space-y-6">
        <JoineryPanel />
        <RoughStickLayout />
      </div>
    </div>
  );
}
