import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ColorDialogProps } from "./ColorDialog";
import { activeGradientFillDialogId, PropertyPanel } from "./PropertyPanel";

const capture = vi.hoisted(() => ({
  props: undefined as ColorDialogProps | undefined,
  backgroundProps: undefined as ColorDialogProps | undefined,
  selectionProps: undefined as ColorDialogProps | undefined,
  strokeProps: undefined as ColorDialogProps | undefined,
  effectProps: undefined as ColorDialogProps | undefined,
}));

vi.mock("./ColorDialog", () => ({
  COLOR_DIALOG_NESTED_EFFECT_SIDE_OFFSET: 100,
  ColorDialog: (props: ColorDialogProps) => {
    capture.props = props;
    const trigger = props.trigger as ReactElement<{ ariaLabel?: string }>;
    if (trigger.props.ariaLabel?.startsWith("Background")) capture.backgroundProps = props;
    if (trigger.props.ariaLabel?.startsWith("Selection")) capture.selectionProps = props;
    if (trigger.props.ariaLabel?.startsWith("Stroke")) capture.strokeProps = props;
    if (trigger.props.ariaLabel?.startsWith("Effect")) capture.effectProps = props;
    return <div data-test-dialog="fill-color">{props.trigger as ReactElement}</div>;
  },
}));

describe("PropertyPanel Fill/Color controlled contract", () => {
  it("keeps canvas gradient chrome scoped to an open gradient dialog on the current selection", () => {
    const gradient = { id: "gradient", color: "#000000", opacity: 100, visible: true, fillType: "linear" as const };
    const image = { id: "image", color: "#000000", opacity: 100, visible: true, fillType: "image" as const };
    expect(activeGradientFillDialogId("fill-color:gradient", [gradient])).toBe("gradient");
    expect(activeGradientFillDialogId("fill-color:image", [image])).toBeNull();
    // Replacing the inspector entries is how selection changes reach this
    // component; its old dialog id must no longer keep a canvas editor alive.
    expect(activeGradientFillDialogId("fill-color:gradient", [image])).toBeNull();
    expect(activeGradientFillDialogId(null, [gradient])).toBeNull();
  });

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
    const onTileScale = vi.fn();
    const onEditCrop = vi.fn();
    const onDropZone = vi.fn();
    const onActiveDialog = vi.fn();
    const onFillEyedropper = vi.fn();
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
          mediaFit: "crop", mediaTileScale: 64,
          imageAdjustments: { exposure: 12, contrast: -4, saturation: 9, temperature: 3, tint: 2, highlights: -8, shadows: 6 },
          dropZoneSourceId: "track:video",
        }]}
        onFillTypeChange={onType}
        onActiveFillDialogChange={onActiveDialog}
        onFillEyedropperActivate={onFillEyedropper}
        activeFillEyedropperId="fill-1"
        onFillGradientStopsChange={onStops}
        onFlipFillGradient={onFlipGradient}
        onRotateFillGradient={onRotateGradient}
        onRotateFillMedia={onRotateMedia}
        onChooseFillImage={onImage}
        onChooseFillVideo={onVideo}
        onFillImageAdjustmentChange={onAdjust}
        onFillMediaFitChange={onFit}
        onFillMediaTileScaleChange={onTileScale}
        onEditFillCrop={onEditCrop}
        fillDropZoneSources={[{ id: "track:video", label: "Master video" }]}
        onSelectFillDropZoneSource={onDropZone}
      />);
    });

    const props = capture.props!;
    act(() => (props.trigger as ReactElement<{ onSwatchClick?: () => void }>).props.onSwatchClick?.());
    expect(onActiveDialog).toHaveBeenLastCalledWith("fill-1");
    act(() => props.onClose());
    expect(onActiveDialog).toHaveBeenLastCalledWith(null);
    expect(props.fillType).toBe("linear");
    expect(props.gradientStops).toEqual(stops);
    expect(props.eyedropperActive).toBe(true);
    expect(props.gradientStopKeyframes).toEqual({ a: { position: stopPosition, color: stopColor, opacity: stopOpacity } });
    expect(props.imageSourceLabel).toBe("cover.png");
    expect(props.imagePreviewUrl).toBe("blob:image-preview");
    expect(props.videoSourceLabel).toBe("clip.mp4");
    expect(props.videoPreviewUrl).toBe("blob:video-preview");
    expect(props.mediaFit).toBe("crop");
    expect(props.mediaTileScale).toBe(64);
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
    act(() => props.onMediaTileScaleChange?.(72));
    act(() => props.onEditCrop?.());
    act(() => props.onSelectDropZoneSource?.("track:video"));
    act(() => props.onEyedropperActivate?.("a"));

    expect(onType).toHaveBeenCalledWith("fill-1", "diamond");
    expect(onStops).toHaveBeenCalledWith("fill-1", stops.slice().reverse());
    expect(onFlipGradient).toHaveBeenCalledWith("fill-1");
    expect(onRotateGradient).toHaveBeenCalledWith("fill-1");
    expect(onRotateMedia).toHaveBeenCalledWith("fill-1");
    expect(onImage).toHaveBeenCalledWith("fill-1");
    expect(onVideo).toHaveBeenCalledWith("fill-1");
    expect(onAdjust).toHaveBeenCalledWith("fill-1", "contrast", 22);
    expect(onFit).toHaveBeenCalledWith("fill-1", "fit");
    expect(onTileScale).toHaveBeenCalledWith("fill-1", 72);
    expect(onEditCrop).toHaveBeenCalledWith("fill-1");
    expect(onDropZone).toHaveBeenCalledWith("fill-1", "track:video");
    expect(onFillEyedropper).toHaveBeenCalledWith("fill-1", "a");

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

  it("keeps a gradient as one controlled Selection colors entry", () => {
    const onUpdate = vi.fn();
    const onEyedropper = vi.fn();
    const stops = [{ id: "a", position: 0, color: "ff0000", opacity: 100 }, { id: "b", position: 100, color: "0000ff", opacity: 100 }];
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel mode="slide" selectionColors={[{
      id: "gradient:one", color: "#ff0000", opacity: 80, usageCount: 2,
      fillType: "linear", gradientStops: stops, gradientPreview: "linear-gradient(90deg,#f00,#00f)",
    }]} onUpdateSelectionColor={onUpdate} onSelectionColorEyedropperActivate={onEyedropper}
      activeSelectionColorEyedropperId="gradient:one" />); });
    expect(capture.selectionProps).toMatchObject({ fillType: "linear", gradientStops: stops, opacity: 80, eyedropperActive: true });
    act(() => capture.selectionProps?.onStopsChange?.(stops.slice().reverse()));
    act(() => capture.selectionProps?.onEyedropperActivate?.("b"));
    expect(onUpdate).toHaveBeenCalledWith("gradient:one", { gradientStops: stops.slice().reverse() });
    expect(onEyedropper).toHaveBeenCalledWith("gradient:one", "b");
    act(() => renderer.unmount());
  });

  it("keeps the shared solid picker live for stroke and effect colors", () => {
    const onStrokeEyedropper = vi.fn(), onEffectEyedropper = vi.fn();
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="shape"
      strokes={[{ id: "stroke-1", color: "#000000", opacity: 100, visible: true, weight: 1, align: "inside" }]}
      effects={[{ id: "effect-1", type: "Drop shadow", visible: true, color: "#000000", opacity: 25 }]}
      onStrokeEyedropperActivate={onStrokeEyedropper} activeStrokeEyedropperId="stroke-1"
      onEffectEyedropperActivate={onEffectEyedropper} activeEffectEyedropperId="effect-1" />); });
    expect(capture.strokeProps).toMatchObject({ solidOnly: true, eyedropperActive: true });
    act(() => capture.strokeProps?.onEyedropperActivate?.());
    expect(onStrokeEyedropper).toHaveBeenCalledWith("stroke-1");
    if (capture.effectProps) {
      expect(capture.effectProps).toMatchObject({ solidOnly: true, eyedropperActive: true });
      act(() => capture.effectProps?.onEyedropperActivate?.());
      expect(onEffectEyedropper).toHaveBeenCalledWith("effect-1");
    }
    act(() => renderer.unmount());
  });

  it("forwards slide background gradient and media commands without inventing mutations", () => {
    const onType = vi.fn();
    const onGradientType = vi.fn();
    const onStops = vi.fn();
    const onFlipGradient = vi.fn();
    const onRotateGradient = vi.fn();
    const onRotateMedia = vi.fn();
    const onImage = vi.fn();
    const onVideo = vi.fn();
    const onFit = vi.fn();
    const onTileScale = vi.fn();
    const onEditCrop = vi.fn();
    const onDropZone = vi.fn();
    const onEyedropper = vi.fn();
    const onDialogOpen = vi.fn();
    const stops = [{ id: "a", position: 0, color: "ff0000", opacity: 100 }, { id: "b", position: 100, color: "0000ff", opacity: 100 }];
    let renderer!: ReactTestRenderer;

    act(() => { renderer = create(<PropertyPanel
      mode="slide"
      slideBackgroundType="gradient"
      slideBackgroundGradientType="radial"
      slideBackgroundGradientStops={stops}
      slideBackgroundImageSourceLabel="cover.png"
      slideBackgroundImagePreviewUrl="blob:cover"
      slideBackgroundVideoSourceLabel="clip.mp4"
      slideBackgroundVideoPreviewUrl="blob:clip"
      slideBackgroundMediaFit="crop"
      slideBackgroundMediaTileScale={62}
      slideBackgroundDropZoneSources={[{ id: "master-video", label: "Master video" }]}
      slideBackgroundDropZoneSourceId="master-video"
      slideBackgroundSwatches={["#ff0000"]}
      capabilities={{ videoFill: true, dropZone: true }}
      onSlideBackgroundTypeChange={onType}
      onSlideBackgroundGradientTypeChange={onGradientType}
      onSlideBackgroundGradientStopsChange={onStops}
      onChooseSlideBackgroundImage={onImage}
      onChooseSlideBackgroundVideo={onVideo}
      onSlideBackgroundMediaFitChange={onFit}
      onSlideBackgroundMediaTileScaleChange={onTileScale}
      onEditSlideBackgroundCrop={onEditCrop}
      onSelectSlideBackgroundDropZoneSource={onDropZone}
      onSlideBackgroundEyedropperActivate={onEyedropper}
      slideBackgroundEyedropperActive
      onSlideBackgroundFillDialogChange={onDialogOpen}
      onFlipSlideBackgroundGradient={onFlipGradient}
      onRotateSlideBackgroundGradient={onRotateGradient}
      onRotateSlideBackgroundMedia={onRotateMedia}
    />); });
    act(() => (capture.backgroundProps!.trigger as ReactElement<{ onSwatchClick?: () => void }>).props.onSwatchClick?.());
    expect(onDialogOpen).toHaveBeenLastCalledWith(true);
    act(() => capture.backgroundProps?.onClose());
    expect(onDialogOpen).toHaveBeenLastCalledWith(false);
    act(() => capture.backgroundProps?.onFlipGradient?.());
    act(() => capture.backgroundProps?.onRotateGradient?.());
    act(() => capture.backgroundProps?.onFillTypeChange?.("diamond"));
    act(() => capture.backgroundProps?.onStopsChange?.(stops.slice().reverse()));
    act(() => capture.backgroundProps?.onChooseImage?.());
    act(() => capture.backgroundProps?.onChooseVideo?.());
    act(() => capture.backgroundProps?.onMediaFitChange?.("fit"));
    act(() => capture.backgroundProps?.onMediaTileScaleChange?.(70));
    act(() => capture.backgroundProps?.onEditCrop?.());
    act(() => capture.backgroundProps?.onSelectDropZoneSource?.("master-video"));
    act(() => capture.backgroundProps?.onEyedropperActivate?.());
    expect(onFlipGradient).toHaveBeenCalledOnce();
    expect(onRotateGradient).toHaveBeenCalledOnce();
    expect(onType).toHaveBeenCalledWith("gradient");
    expect(onGradientType).toHaveBeenCalledWith("diamond");
    expect(onStops).toHaveBeenCalledWith(stops.slice().reverse());
    expect(onImage).toHaveBeenCalledOnce();
    expect(onVideo).toHaveBeenCalledOnce();
    expect(onFit).toHaveBeenCalledWith("fit");
    expect(onTileScale).toHaveBeenCalledWith(70);
    expect(onEditCrop).toHaveBeenCalledOnce();
    expect(onDropZone).toHaveBeenCalledWith("master-video");
    expect(onEyedropper).toHaveBeenCalledOnce();
    expect(capture.backgroundProps).toMatchObject({
      fillType: "radial", gradientStops: stops,
      imageSourceLabel: "cover.png", imagePreviewUrl: "blob:cover",
      videoSourceLabel: "clip.mp4", videoPreviewUrl: "blob:clip",
      mediaFit: "crop", mediaTileScale: 62,
      dropZoneSourceId: "master-video", swatches: ["#ff0000"], eyedropperActive: true,
    });

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
