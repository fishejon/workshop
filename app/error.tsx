"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 text-center">
        <h2 className="font-display text-2xl text-[var(--gl-cream)]">Something went wrong</h2>
        <p className="mt-3 text-sm text-[var(--gl-muted)]">
          Grainline logged this error so we can fix it. Try the action again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg border border-[var(--gl-border-strong)] px-4 py-2 text-sm text-[var(--gl-cream)] hover:bg-[var(--gl-surface-muted)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
