import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { EffectDetailsDialog } from "./EffectDetailsDialog";

vi.mock("./InspectorDialog", () => ({
  COMPACT_INSPECTOR_DIALOG_WIDTH: 240,
  EFFECTS_INSPECTOR_DIALOG_SIDE_OFFSET: 48,
  InspectorDialog: ({ ariaLabel, width, sideOffset, elevation, trigger, children }: {
    ariaLabel?: string;
    width?: number;
    sideOffset?: number;
    elevation?: number;
    trigger?: ReactNode;
    children: ReactNode;
  }) =>
    <div data-aria-label={ariaLabel} data-width={width} data-side-offset={sideOffset} data-elevation={elevation}>{trigger}{children}</div>,
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
    expect(html).toContain('data-elevation="400"');
    expect(html).toContain('data-aria-label="Color"');
    expect(html).toContain('data-side-offset="100"');
  });

  it("keeps shadow X/Y in one reference-aligned Position row with shrink-safe fields", () => {
    const html = renderToStaticMarkup(
      <EffectDetailsDialog
        open
        value={{ type: "Drop shadow", visible: true, x: 12, y: -8, blur: 24, spread: 3 }}
        trigger={<button type="button">Open effect</button>}
        onClose={() => undefined}
      />,
    );

    expect(html.match(/>Position</g)).toHaveLength(1);
    expect(html).toContain('aria-label="Position X"');
    expect(html).toContain('aria-label="Position Y"');
    expect(html.match(/min-w-0 flex-1/g)?.length).toBeGreaterThanOrEqual(4);
  });
});
