import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ColorDialog, COLOR_DIALOG_REFERENCE_GEOMETRY, type ColorDialogProps } from "./ColorDialog";

vi.mock("./InspectorDialog", () => ({
  InspectorDialog: ({ trigger, children, width, className }: {
    trigger: ReactElement; children: ReactNode; width: number; className?: string;
  }) => <div data-dialog-width={width} data-dialog-class={className}>{trigger}{children}</div>,
}));

const render = (props: Partial<ColorDialogProps> = {}) => renderToStaticMarkup(
  <ColorDialog open onClose={() => undefined} trigger={<button>Fill</button>} {...props} />,
);

describe("ColorDialog Editor-Study fidelity geometry", () => {
  it("records the exact 240px Solid, Gradient, and Image reference grid", () => {
    expect(COLOR_DIALOG_REFERENCE_GEOMETRY).toEqual({
      width: 240,
      headerHeight: 40,
      toolbarHeight: 41,
      solid: { height: 489, bodyHeight: 408, pickerSize: 208, formatRowHeight: 40 },
      gradient: { height: 297, bodyHeight: 216, typeRowHeight: 48, barWidth: 208, barHeight: 32, stopRowHeight: 32 },
      image: { height: 577, bodyHeight: 496, fitRowHeight: 48, previewSize: 208, adjustmentRowHeight: 32, adjustmentSliderWidth: 120 },
    });
  });

  it("renders Solid on the 489px reference cadence and keeps selection native only in inputs", () => {
    const html = render({ fillType: "solid" });
    expect(html).toContain('data-dialog-width="240"');
    expect(html).toContain("h-[40px]");
    expect(html).toContain("h-[41px]");
    expect(html).toContain("h-[408px]");
    expect(html).toContain("data-composa-color-picker");
    expect(html).toContain("height:208px;width:208px");
    expect(html).toContain("data-composa-solid-format-row");
    expect(html).toContain("h-[40px]");
    expect(html).toContain('aria-label="Color format: Hex"');
    expect(html).toContain('aria-label="Color hex"');
    expect(html).toContain('type="text"');
    expect(html).toContain("select-none");
  });

  it("renders one Gradient summary with the authored stops and reference rows", () => {
    const html = render({
      fillType: "linear",
      gradientStops: [
        { id: "a", position: 0, color: "112233", opacity: 100 },
        { id: "b", position: 100, color: "0D99FF", opacity: 72 },
      ],
      onFlipGradient: () => undefined,
      onRotateGradient: () => undefined,
    });
    expect(html).toContain("max-h-[560px]");
    expect(html).toContain('aria-label="Gradient type"');
    expect(html).toContain("data-composa-gradient-preview");
    expect(html).toContain("h-[32px]");
    expect(html).toContain("#112233 0%");
    expect(html).toContain("#0D99FF 100%");
    expect(html).not.toContain("Linear gradient");
    expect(html).toContain('aria-label="Flip gradient"');
    expect(html).toContain('aria-label="Rotate gradient"');
    expect(html.match(/data-composa-gradient-stop-row=/g)).toHaveLength(2);
    expect(html).not.toContain("data-composa-gradient-color-picker");
    expect(html).not.toContain("data-composa-gradient-swatches");
  });

  it.each([false, true])("keeps %s bound Image media on the 208px preview contract", bound => {
    const html = render({
      fillType: "image",
      mediaFit: "crop",
      onMediaFitChange: () => undefined,
      onChooseImage: () => undefined,
      onRotateMedia: () => undefined,
      imageSourceLabel: bound ? "cover.png" : undefined,
      imagePreviewUrl: bound ? "blob:cover" : undefined,
      onImageAdjustmentChange: bound ? () => undefined : undefined,
    });
    expect(html).toContain("data-composa-media-fit-row");
    expect(html).toContain("h-[48px]");
    expect(html).toContain("size-[208px]");
    expect(html).toContain(`aria-label="${bound ? "Replace" : "Choose"} media…"`);
    expect(html).toContain('aria-label="Rotate image 90 degrees"');
    if (bound) {
      expect(html).toContain("h-[496px]");
      expect(html.match(/data-composa-image-adjustment-row=/g)).toHaveLength(7);
      expect(html).toContain("w-[120px]");
    } else {
      expect(html).toContain('data-state="empty"');
      expect(html).not.toContain("data-composa-image-adjustments");
    }
  });

  it("keeps adjustment and playback controls out of unbound media placeholders", () => {
    const image = render({ fillType: "image", onChooseImage: () => undefined, onImageAdjustmentChange: () => undefined });
    const video = render({ fillType: "video", capabilities: { videoFill: true }, onChooseVideo: () => undefined,
      videoPlayback: { loop: true, playSound: false, autoplay: true, showPlaybackControls: true }, onVideoPlaybackChange: () => undefined });
    expect(image).not.toContain("data-composa-image-adjustments");
    expect(video).not.toContain("data-composa-video-playback-controls");
    expect(image).toContain("Choose media…");
    expect(video).toContain("Choose media…");
  });
});
