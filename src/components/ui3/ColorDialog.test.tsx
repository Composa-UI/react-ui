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

  it("offers Video only with a host-backed picker and uses the shared square empty preview", () => {
    const unavailable = renderToStaticMarkup(
      <ColorDialog open onClose={() => undefined} trigger={<button>Color</button>}
        capabilities={{ videoFill: true }} />,
    );
    expect(unavailable).not.toContain('aria-label="Video"');

    const available = renderToStaticMarkup(
      <ColorDialog open onClose={() => undefined} trigger={<button>Color</button>}
        capabilities={{ videoFill: true }} fillType="video" onChooseVideo={() => undefined} />,
    );
    expect(available).toContain('aria-label="Video"');
    expect(available).toContain('data-composa-media-fill-preview="video"');
    expect(available).toContain('data-state="empty"');
    expect(available).toContain("aspect-square");
    expect(available).toContain("lucide-square-play");
    expect(available).toContain(">Select video<");
  });

  it.each([
    { kind: "image" as const, previewUrl: "blob:image-preview", sourceLabel: "cover.png" },
    { kind: "video" as const, previewUrl: "blob:video-preview", sourceLabel: "intro.mp4" },
  ])("renders a real bound $kind in the same square replace surface", ({ kind, previewUrl, sourceLabel }) => {
    const html = renderToStaticMarkup(
      <ColorDialog open onClose={() => undefined} trigger={<button>Color</button>}
        capabilities={{ videoFill: true }} fillType={kind}
        imageSourceLabel={kind === "image" ? sourceLabel : undefined}
        imagePreviewUrl={kind === "image" ? previewUrl : undefined}
        onChooseImage={kind === "image" ? () => undefined : undefined}
        videoSourceLabel={kind === "video" ? sourceLabel : undefined}
        videoPreviewUrl={kind === "video" ? previewUrl : undefined}
        onChooseVideo={kind === "video" ? () => undefined : undefined} />,
    );
    expect(html).toContain(`data-composa-media-fill-preview="${kind}"`);
    expect(html).toContain('data-state="bound"');
    expect(html).toContain("aspect-square");
    expect(html).toContain(`src="${previewUrl}"`);
    expect(html).toContain(sourceLabel);
    expect(html).toContain(`>Replace ${kind}<`);
  });

  it("projects persisted renderer-backed fit modes into both media previews", () => {
    const image = renderToStaticMarkup(
      <ColorDialog open onClose={() => undefined} trigger={<button>Color</button>}
        fillType="image" mediaFit="fit" onMediaFitChange={() => undefined}
        imageSourceLabel="cover.png" imagePreviewUrl="blob:image-preview" onChooseImage={() => undefined} />,
    );
    expect(image).toContain('aria-label="Image fit"');
    expect(image).toContain('data-fit="fit"');
    expect(image).toContain("object-contain");

    const video = renderToStaticMarkup(
      <ColorDialog open onClose={() => undefined} trigger={<button>Color</button>}
        capabilities={{ videoFill: true }} fillType="video" mediaFit="crop" onMediaFitChange={() => undefined}
        videoSourceLabel="clip.mp4" videoPreviewUrl="blob:video-preview" onChooseVideo={() => undefined} />,
    );
    expect(video).toContain('aria-label="Video fit"');
    expect(video).toContain('data-fit="crop"');
    expect(video).toContain("object-cover");
  });
});
