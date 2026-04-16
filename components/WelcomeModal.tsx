"use client";

import { useState } from "react";

const STORAGE_KEY = "grainline-welcome-seen";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) !== "true";
  });
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  function closeModal(alwaysHide: boolean) {
    if (typeof window !== "undefined" && (alwaysHide || dontShowAgain)) {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
    setIsOpen(false);
  }

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to Grainline",
      content:
        "Grainline turns furniture intent into a cut list and buy guidance you can trust in the shop.",
    },
    {
      title: "How the flow works",
      content:
        "Start in Project, model in Plan, then confirm Materials. Labs is for advanced experiments and optional joinery audits.",
    },
    {
      title: "Start fast",
      content:
        "Use the Dresser preset first. Once dimensions look right, review Materials and print your shop packet.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 shadow-xl">
        <h2 className="font-display text-2xl text-[var(--gl-cream)]">{steps[step]?.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--gl-muted)]">{steps[step]?.content}</p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i === step ? "bg-[var(--gl-copper-bright)]" : "bg-[var(--gl-border-strong)]"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((n) => Math.max(0, n - 1))}
                className="rounded-lg border border-[var(--gl-border)] px-3 py-1.5 text-xs text-[var(--gl-muted)]"
              >
                Back
              </button>
            ) : null}
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((n) => Math.min(steps.length - 1, n + 1))}
                className="rounded-lg border border-[var(--gl-border-strong)] px-3 py-1.5 text-xs text-[var(--gl-cream)]"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={() => closeModal(true)}
                className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)] px-3 py-1.5 text-xs text-[var(--gl-cream)]"
              >
                Get started
              </button>
            )}
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-xs text-[var(--gl-muted)]">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          Don&apos;t show this again
        </label>
      </div>
    </div>
  );
}
