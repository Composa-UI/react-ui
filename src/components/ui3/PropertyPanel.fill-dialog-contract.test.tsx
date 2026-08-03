import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ColorDialogProps } from "./ColorDialog";
import { PropertyPanel } from "./PropertyPanel";

const capture = vi.hoisted(() => ({ props: undefined as ColorDialogProps | undefined }));

vi.mock("./ColorDialog", () => ({
  ColorDialog: (props: ColorDialogProps) => {
    capture.props = props;
    return <div data-test-dialog="fill-color">{props.trigger as ReactElement}</div>;
  },
}));

describe("PropertyPanel Fill/Color controlled contract", () => {
  it("forwards every detailed fill value and emits entry-scoped callbacks", () => {
    const onType = vi.fn();
    const onStops = vi.fn();
    const onImage = vi.fn();
    const onVideo = vi.fn();
    const onAdjust = vi.fn();
    const onDropZone = vi.fn();
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
          imageSourceLabel: "cover.png", videoSourceLabel: "clip.mp4",
          imageAdjustments: { exposure: 12, contrast: -4, saturation: 9, temperature: 3, tint: 2, highlights: -8, shadows: 6 },
          dropZoneSourceId: "track:video",
        }]}
        onFillTypeChange={onType}
        onFillGradientStopsChange={onStops}
        onChooseFillImage={onImage}
        onChooseFillVideo={onVideo}
        onFillImageAdjustmentChange={onAdjust}
        fillDropZoneSources={[{ id: "track:video", label: "Master video" }]}
        onSelectFillDropZoneSource={onDropZone}
      />);
    });

    const props = capture.props!;
    expect(props.fillType).toBe("linear");
    expect(props.gradientStops).toEqual(stops);
    expect(props.imageSourceLabel).toBe("cover.png");
    expect(props.videoSourceLabel).toBe("clip.mp4");
    expect(props.imageExposure).toBe(12);
    expect(props.imageShadows).toBe(6);
    expect(props.dropZoneSources).toEqual([{ id: "track:video", label: "Master video" }]);
    expect(props.dropZoneSourceId).toBe("track:video");

    act(() => props.onFillTypeChange?.("diamond"));
    act(() => props.onStopsChange?.(stops.slice().reverse()));
    act(() => props.onChooseImage?.());
    act(() => props.onChooseVideo?.());
    act(() => props.onImageAdjustmentChange?.("contrast", 22));
    act(() => props.onSelectDropZoneSource?.("track:video"));

    expect(onType).toHaveBeenCalledWith("fill-1", "diamond");
    expect(onStops).toHaveBeenCalledWith("fill-1", stops.slice().reverse());
    expect(onImage).toHaveBeenCalledWith("fill-1");
    expect(onVideo).toHaveBeenCalledWith("fill-1");
    expect(onAdjust).toHaveBeenCalledWith("fill-1", "contrast", 22);
    expect(onDropZone).toHaveBeenCalledWith("fill-1", "track:video");

    act(() => renderer.unmount());
  });
});
