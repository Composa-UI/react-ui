import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { ColorInput, InputField, NumericInput } from "./Input";
import { Dropdown } from "./Dropdown";
import { GeneratedControlsDialog, GeneratedControlsSection, type GeneratedControlsValue } from "./GeneratedControlsDialog";
import { Switch } from "./Switch";

vi.mock("./InspectorDialog", async () => {
  const actual = await vi.importActual<typeof import("./InspectorDialog")>("./InspectorDialog");
  return {
    ...actual,
    InspectorDialog: ({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) => <div data-inspector-dialog>{trigger}{children}</div>,
  };
});

const value: GeneratedControlsValue = {
  id: "hero-controls",
  title: "Hero controls",
  controls: [
    { id: "distance", label: "Distance", kind: "number", value: 120, min: 0, max: 500, unit: "px" },
    { id: "accent", label: "Accent", kind: "color", value: "#ff0000" },
    { id: "headline", label: "Headline", kind: "text", value: "Hello" },
    { id: "enabled", label: "Enabled", kind: "boolean", value: true },
    { id: "alignment", label: "Alignment", kind: "enum", value: "left", options: [
      { value: "left", label: "Left" }, { value: "center", label: "Center" },
    ] },
    { id: "artwork", label: "Artwork", kind: "asset", value: "asset-1", displayValue: "cover.png" },
  ],
};

describe("GeneratedControlsDialog", () => {
  it("projects the six bounded control kinds through standard UI primitives", () => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<GeneratedControlsDialog value={value} open trigger={<button>Open</button>} onClose={() => undefined} />); });
    expect(renderer!.root.findAllByType(NumericInput)).toHaveLength(1);
    expect(renderer!.root.findAllByType(ColorInput)).toHaveLength(1);
    expect(renderer!.root.findAllByType(InputField)).toHaveLength(1);
    expect(renderer!.root.findAllByType(Switch)).toHaveLength(1);
    expect(renderer!.root.findAllByType(Dropdown)).toHaveLength(1);
    expect(renderer!.root.findAllByType(Button).filter(node => node.props.label === "cover.png")).toHaveLength(1);
  });

  it("emits values and asset intent without owning document state", () => {
    const onChange = vi.fn(), onChooseAsset = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<GeneratedControlsDialog value={value} open trigger={<button>Open</button>} onClose={() => undefined}
      onChange={onChange} onChooseAsset={onChooseAsset} />); });
    act(() => renderer!.root.findByType(NumericInput).props.onChange(240));
    act(() => renderer!.root.findByType(Switch).props.onCheckedChange(false));
    const asset = renderer!.root.findAllByType(Button).find(node => node.props.label === "cover.png")!;
    act(() => asset.props.onClick());
    expect(onChange).toHaveBeenCalledWith("distance", 240);
    expect(onChange).toHaveBeenCalledWith("enabled", false);
    expect(onChooseAsset).toHaveBeenCalledWith("artwork");
  });

  it("renders the compact summary row and opens through the controlled seam", () => {
    const onOpenChange = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<GeneratedControlsSection value={value} open={false} onOpenChange={onOpenChange} />); });
    const trigger = renderer!.root.findByProps({ "aria-label": "Open Hero controls" });
    act(() => trigger.props.onClick());
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
