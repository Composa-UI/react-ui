import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  COLOR_DIALOG_INSPECTOR_SIDE_OFFSET,
  COLOR_DIALOG_NESTED_EFFECT_SIDE_OFFSET,
  COLOR_DIALOG_WIDTH,
  ColorDialog,
} from "./ColorDialog";

vi.mock("./InspectorDialog", () => ({
  InspectorDialog: ({
    ariaLabel,
    width,
    sideOffset,
    align,
    elevation,
    className,
    trigger,
    children,
  }: {
    ariaLabel: string;
    width?: number;
    sideOffset?: number;
    align?: string;
    elevation?: number;
    className?: string;
    trigger: ReactElement;
    children: ReactNode;
  }) => (
    <div
      data-inspector-dialog={ariaLabel}
      data-width={width}
      data-side-offset={sideOffset}
      data-align={align}
      data-elevation={elevation}
      data-class-name={className}
    >
      {trigger}
      {children}
    </div>
  ),
}));

describe("ColorDialog anchored inspector contract", () => {
  it("uses the compact width, compensated inspector gutter, and canonical elevation", () => {
    const html = renderToStaticMarkup(
      <ColorDialog
        open={false}
        onClose={() => undefined}
        trigger={<button type="button">Open color</button>}
      />,
    );

    expect(COLOR_DIALOG_WIDTH).toBe(240);
    expect(COLOR_DIALOG_INSPECTOR_SIDE_OFFSET).toBe(24);
    expect(html).toContain('data-inspector-dialog="Color"');
    expect(html).toContain('data-width="240"');
    expect(html).toContain('data-side-offset="24"');
    expect(html).toContain('data-align="start"');
    expect(html).toContain('data-elevation="400"');
    expect(html).toContain('data-class-name="flex flex-col"');
    expect(html).toContain(">Open color</button>");
  });

  it("accepts the nested Effect offset without changing the dialog body contract", () => {
    const html = renderToStaticMarkup(
      <ColorDialog
        open
        onClose={() => undefined}
        trigger={<button type="button">Edit Effect color</button>}
        sideOffset={COLOR_DIALOG_NESTED_EFFECT_SIDE_OFFSET}
        align="end"
        solidOnly
        pickerSource="hex"
        hex="FF0000"
        opacity={40}
      />,
    );

    expect(COLOR_DIALOG_NESTED_EFFECT_SIDE_OFFSET).toBe(100);
    expect(html).toContain('data-side-offset="100"');
    expect(html).toContain('data-align="end"');
    expect(html).toContain(">Edit Effect color</button>");
    expect(html).not.toContain('aria-label="Gradient"');
    expect(html).not.toContain('aria-label="Image"');
  });

  it("offers the typed SquarePlay video fill only with a host-backed picker", () => {
    const unavailable = renderToStaticMarkup(
      <ColorDialog open onClose={() => undefined} trigger={<button>Color</button>}
        capabilities={{ videoFill: true }} />,
    );
    expect(unavailable).not.toContain('aria-label="Video"');

    const available = renderToStaticMarkup(
      <ColorDialog open onClose={() => undefined} trigger={<button>Color</button>}
        capabilities={{ videoFill: true }} fillType="video"
        videoSourceLabel="intro.mp4" onChooseVideo={() => undefined} />,
    );
    expect(available).toContain('aria-label="Video"');
    expect(available).toContain("lucide-square-play");
    expect(available).toContain("intro.mp4");
    expect(available).toContain(">Replace video<");
  });
});
