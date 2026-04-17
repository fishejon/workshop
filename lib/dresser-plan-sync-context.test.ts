/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  DresserPlanSyncProvider,
  useDresserPlanSync,
} from "@/components/DresserPlanSyncContext";

function Consumer({
  onReady,
}: {
  onReady: (api: ReturnType<typeof useDresserPlanSync>) => void;
}) {
  const api = useDresserPlanSync();
  onReady(api);
  return null;
}

describe("DresserPlanSyncContext", () => {
  it("invokes the registered flush when flushDresserPartsNow runs", () => {
    let captured: ReturnType<typeof useDresserPlanSync> | null = null;
    let flushCount = 0;

    function Parent() {
      return createElement(
        DresserPlanSyncProvider,
        null,
        createElement(Consumer, {
          onReady: (api: ReturnType<typeof useDresserPlanSync>) => {
            captured = api;
          },
        }),
        createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              captured?.flushDresserPartsNow();
            },
          },
          "flush"
        )
      );
    }

    render(createElement(Parent));

    captured!.setDresserPartsFlush(() => {
      flushCount += 1;
    });

    fireEvent.click(screen.getByRole("button", { name: "flush" }));
    expect(flushCount).toBe(1);
  });

  it("unregistering clears the flush target", () => {
    let captured: ReturnType<typeof useDresserPlanSync> | null = null;
    let flushCount = 0;

    render(
      createElement(
        DresserPlanSyncProvider,
        null,
        createElement(Consumer, {
          onReady: (api: ReturnType<typeof useDresserPlanSync>) => {
            captured = api;
          },
        })
      )
    );

    captured!.setDresserPartsFlush(() => {
      flushCount += 1;
    });
    captured!.setDresserPartsFlush(null);
    captured!.flushDresserPartsNow();
    expect(flushCount).toBe(0);
  });
});
