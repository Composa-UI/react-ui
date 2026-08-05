import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ColorDialogProps } from "./ColorDialog";
import { PropertyPanel } from "./PropertyPanel";

const capture = vi.hoisted(() => ({
  props: undefined as ColorDialogProps | undefined,
  backgroundProps: undefined as ColorDialogProps | undefined,
}));

vi.mock("./ColorDialog", () => ({
  ColorDialog: (props: ColorDialogProps) => {
    capture.props = props;
    const trigger = props.trigger as ReactElement<{ ariaLabel?: string }>;
    if (trigger.props.ariaLabel?.startsWith("Background")) capture.backgroundProps = props;
    return <div data-test-dialog="fill-color">{props.trigger as ReactElement}</div>;
  },
}));

describe("PropertyPanel Fill/Color controlled contract", () => {
  it("forwards every detailed fill value and emits entry-scoped callbacks", () => {
    const onType = vi.fn();
    const onStops = vi.fn();
    const onFlipGradient = vi.fn();
    const onRotateGradient = vi.fn();
    const onRotateMedia = vi.fn();
    const onImage = vi.fn();
    const onVideo = vi.fn();
    const onAdjust = vi.fn();
    const onFit = vi.fn();
    const onEditCrop = vi.fn();
    const onDropZone = vi.fn();
    const stopPosition = { active: true, onToggle: vi.fn() };
    const stopColor = { active: false, onToggle: vi.fn() };
    const stopOpacity = { active: false, onToggle: vi.fn() };
    const paintOpacity = { active: true, onToggle: vi.fn() };
    const stops = [
      { id: "a", position: 0, color: "ff0000", opacity: 100 },
      { id: "b", position: 100, color: "0000ff", opacity: 70 },
    ];
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = create(<PropertyPanel
        elementType="shape"
        capabilities={{ videoFill: true, dropZone: true }}
        fills={[{
          id: "fill-1", color: "#ff0000", opacity: 80, visible: true,
          fillType: "linear", gradientStops: stops,
          keyframes: { opacity: paintOpacity, gradientStops: { a: { position: stopPosition, color: stopColor, opacity: stopOpacity } } },
          imageSourceLabel: "cover.png", videoSourceLabel: "clip.mp4",
          imagePreviewUrl: "blob:image-preview", videoPreviewUrl: "blob:video-preview",
          mediaFit: "crop",
          imageAdjustments: { exposure: 12, contrast: -4, saturation: 9, temperature: 3, tint: 2, highlights: -8, shadows: 6 },
          dropZoneSourceId: "track:video",
        }]}
        onFillTypeChange={onType}
        onFillGradientStopsChange={onStops}
        onFlipFillGradient={onFlipGradient}
        onRotateFillGradient={onRotateGradient}
        onRotateFillMedia={onRotateMedia}
        onChooseFillImage={onImage}
        onChooseFillVideo={onVideo}
        onFillImageAdjustmentChange={onAdjust}
        onFillMediaFitChange={onFit}
        onEditFillCrop={onEditCrop}
        fillDropZoneSources={[{ id: "track:video", label: "Master video" }]}
        onSelectFillDropZoneSource={onDropZone}
      />);
    });

    const props = capture.props!;
    expect(props.fillType).toBe("linear");
    expect(props.gradientStops).toEqual(stops);
    expect(props.gradientStopKeyframes).toEqual({ a: { position: stopPosition, color: stopColor, opacity: stopOpacity } });
    expect(props.imageSourceLabel).toBe("cover.png");
    expect(props.imagePreviewUrl).toBe("blob:image-preview");
    expect(props.videoSourceLabel).toBe("clip.mp4");
    expect(props.videoPreviewUrl).toBe("blob:video-preview");
    expect(props.mediaFit).toBe("crop");
    expect(props.imageExposure).toBe(12);
    expect(props.imageShadows).toBe(6);
    expect(props.dropZoneSources).toEqual([{ id: "track:video", label: "Master video" }]);
    expect(props.dropZoneSourceId).toBe("track:video");

    act(() => props.onFillTypeChange?.("diamond"));
    act(() => props.onStopsChange?.(stops.slice().reverse()));
    act(() => props.onFlipGradient?.());
    act(() => props.onRotateGradient?.());
    act(() => props.onRotateMedia?.());
    act(() => props.onChooseImage?.());
    act(() => props.onChooseVideo?.());
    act(() => props.onImageAdjustmentChange?.("contrast", 22));
    act(() => props.onMediaFitChange?.("fit"));
    act(() => props.onEditCrop?.());
    act(() => props.onSelectDropZoneSource?.("track:video"));

    expect(onType).toHaveBeenCalledWith("fill-1", "diamond");
    expect(onStops).toHaveBeenCalledWith("fill-1", stops.slice().reverse());
    expect(onFlipGradient).toHaveBeenCalledWith("fill-1");
    expect(onRotateGradient).toHaveBeenCalledWith("fill-1");
    expect(onRotateMedia).toHaveBeenCalledWith("fill-1");
    expect(onImage).toHaveBeenCalledWith("fill-1");
    expect(onVideo).toHaveBeenCalledWith("fill-1");
    expect(onAdjust).toHaveBeenCalledWith("fill-1", "contrast", 22);
    expect(onFit).toHaveBeenCalledWith("fill-1", "fit");
    expect(onEditCrop).toHaveBeenCalledWith("fill-1");
    expect(onDropZone).toHaveBeenCalledWith("fill-1", "track:video");

    act(() => renderer.unmount());
  });

  it("forwards stable fill-scoped adjustment diamonds", () => {
    const onToggle = vi.fn();
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="shape" fills={[{
        id: "image-fill", color: "#ffffff", opacity: 100, visible: true, fillType: "image",
        imageSourceLabel: "photo.jpg", imageAdjustments: { exposure: 12 },
        keyframes: { imageAdjustments: { exposure: { active: true, onToggle } } },
      }]} fillImageAdjustmentsReadOnly onFillImageAdjustmentChange={() => undefined} />); });
    expect(capture.props?.imageAdjustmentKeyframes?.exposure).toEqual({ active: true, onToggle });
    expect(capture.props?.imageAdjustmentsReadOnly).toBe(true);
    act(() => renderer.unmount());
  });

  it("forwards slide background gradient and media commands without inventing mutations", () => {
    const onFlipGradient = vi.fn();
    const onRotateGradient = vi.fn();
    const onRotateMedia = vi.fn();
    let renderer!: ReactTestRenderer;

    act(() => { renderer = create(<PropertyPanel
      mode="slide"
      slideBackgroundType="gradient"
      onFlipSlideBackgroundGradient={onFlipGradient}
      onRotateSlideBackgroundGradient={onRotateGradient}
      onRotateSlideBackgroundMedia={onRotateMedia}
    />); });
    act(() => capture.backgroundProps?.onFlipGradient?.());
    act(() => capture.backgroundProps?.onRotateGradient?.());
    expect(onFlipGradient).toHaveBeenCalledOnce();
    expect(onRotateGradient).toHaveBeenCalledOnce();

    act(() => renderer.update(<PropertyPanel
      mode="slide"
      slideBackgroundType="image"
      onFlipSlideBackgroundGradient={onFlipGradient}
      onRotateSlideBackgroundGradient={onRotateGradient}
      onRotateSlideBackgroundMedia={onRotateMedia}
    />));
    act(() => capture.backgroundProps?.onRotateMedia?.());
    expect(onRotateMedia).toHaveBeenCalledOnce();
    act(() => renderer.unmount());
  });
});
