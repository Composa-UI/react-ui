import { renderToStaticMarkup } from "react-dom/server";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
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
    expect(available).toContain("size-[208px]");
    expect(available).toContain("lucide-square-play");
    expect(available).toContain('aria-label="Choose media…"');
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
    expect(html).toContain("size-[208px]");
    expect(html).toContain(`src="${previewUrl}"`);
    expect(html).toContain(sourceLabel);
    expect(html).toContain('aria-label="Replace media…"');
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

  it("renders Figma's controlled Tile scale and applies it to the repeated preview", () => {
    const onScale = vi.fn();
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(
      <ColorDialog open onClose={() => undefined} trigger={<button>Color</button>}
        fillType="image" mediaFit="tile" mediaTileScale={50}
        mediaTileScaleKeyframe={{ active: true, onToggle: () => undefined }}
        onMediaFitChange={() => undefined} onMediaTileScaleChange={onScale}
        imageSourceLabel="pattern.png" imagePreviewUrl="blob:pattern" />,
    ); });
    const input = renderer.root.findByProps({ "aria-label": "Tile scale" });
    expect(input.props.value).toBe("50");
    act(() => input.props.onChange({ target: { value: "75" } }));
    expect(onScale).toHaveBeenCalledWith(75);
    const html = renderToStaticMarkup(
      <ColorDialog open onClose={() => undefined} trigger={<button>Color</button>}
        fillType="image" mediaFit="tile" mediaTileScale={50}
        mediaTileScaleKeyframe={{ active: true, onToggle: () => undefined }}
        onMediaFitChange={() => undefined} onMediaTileScaleChange={() => undefined}
        imageSourceLabel="pattern.png" imagePreviewUrl="blob:pattern" />,
    );
    expect(html).toContain("background-size:50% auto");
    expect(html).toContain('aria-label="Tile scale keyframe"');
    expect(html).toContain('aria-pressed="true"');
  });

  it("does not add a second Edit crop entry point after Crop is selected", () => {
    const onEditCrop = vi.fn(), onClose = vi.fn();
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<ColorDialog open onClose={onClose} trigger={<button>Color</button>} fillType="image" mediaFit="crop"
      onMediaFitChange={() => undefined} imageSourceLabel="cover.png" imagePreviewUrl="blob:image" onEditCrop={onEditCrop} />); });
    expect(renderer.root.findAll(node => node.props["aria-label"] === "Edit crop")).toHaveLength(0);
    expect(onEditCrop).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not append the full picker or eyedropper after compact gradient stop rows", () => {
    const onEyedropperActivate = vi.fn();
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(
      <ColorDialog open onClose={() => undefined} trigger={<button>Color</button>}
        fillType="linear"
        gradientStops={[
          { id: "start", position: 0, color: "111111", opacity: 100 },
          { id: "end", position: 100, color: "EEEEEE", opacity: 100 },
        ]}
        onEyedropperActivate={onEyedropperActivate} />,
    ); });
    expect(renderer.root.findAll(node => node.props["aria-label"] === "Sample color")).toHaveLength(0);
    expect(onEyedropperActivate).not.toHaveBeenCalled();
  });

  it("synchronizes the shared picker when a controlled host switches Solid to Gradient in place", () => {
    const onStopsChange = vi.fn();
    const onHexChange = vi.fn();
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<ColorDialog open onClose={() => undefined} trigger={<button>Color</button>} fillType="solid" hex="171717" />); });
    act(() => renderer.update(<ColorDialog open onClose={() => undefined} trigger={<button>Color</button>} fillType="linear"
      gradientStops={[
        { id: "start", position: 0, color: "123456", opacity: 100 },
        { id: "end", position: 100, color: "ABCDEF", opacity: 100 },
      ]} onStopsChange={onStopsChange} onHexChange={onHexChange} />));
    const activeHex = renderer.root.findByProps({ "aria-label": "Stop 1 hex" });
    expect(activeHex.props.value).toBe("123456");
    act(() => activeHex.props.onFocus({ currentTarget: { select: () => undefined } }));
    act(() => activeHex.props.onChange({ target: { value: "654321" } }));
    act(() => activeHex.props.onBlur());
    expect(onStopsChange).toHaveBeenLastCalledWith([
      { id: "start", position: 0, color: "654321", opacity: 100 },
      { id: "end", position: 100, color: "ABCDEF", opacity: 100 },
    ]);
    expect(onHexChange).not.toHaveBeenCalled();
  });
});
