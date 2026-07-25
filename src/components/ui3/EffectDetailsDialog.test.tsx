import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { EffectDetailsDialog } from "./EffectDetailsDialog";

vi.mock("./InspectorDialog", () => ({
  InspectorDialog: ({ width, sideOffset, className, children }: { width?: number; sideOffset?: number; className?: string; children: ReactNode }) =>
    <div data-width={width} data-side-offset={sideOffset} data-class-name={className}>{children}</div>,
}));

describe("EffectDetailsDialog", () => {
  it("uses the 240px, elevated inspector overlay contract", () => {
    const html = renderToStaticMarkup(
      <EffectDetailsDialog
        open={false}
        value={{ type: "Drop shadow", visible: true }}
        trigger={<button type="button">Open effect</button>}
        onClose={() => undefined}
      />,
    );

    expect(html).toContain('data-width="240"');
    expect(html).toContain('data-side-offset="48"');
    expect(html).toContain('data-class-name="shadow-c-400"');
  });
});
