import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { ColorInput } from "./Input";
import { PropertyPanel } from "./PropertyPanel";

vi.mock("./ColorDialog", () => ({
  ColorDialog: ({ open, trigger }: { open: boolean; trigger: ReactElement }) =>
    <div data-test-dialog="color" data-open={open}>{trigger}</div>,
}));
vi.mock("./StrokeSettingsDialog", async importOriginal => {
  const original = await importOriginal<typeof import("./StrokeSettingsDialog")>();
  return {
    ...original,
    StrokeSettingsDialog: ({ open, trigger }: { open: boolean; trigger: ReactElement }) =>
      <div data-test-dialog="stroke-settings" data-open={open}>{trigger}</div>,
  };
});
vi.mock("./EffectDetailsDialog", () => ({
  EffectDetailsDialog: ({ open, trigger }: { open: boolean; trigger: ReactElement }) =>
    <div data-test-dialog="effect" data-open={open}>{trigger}</div>,
}));
vi.mock("./TypeSettingsDialog", async importOriginal => {
  const original = await importOriginal<typeof import("./TypeSettingsDialog")>();
  return {
    ...original,
    TypeSettingsDialog: ({ open, trigger }: { open: boolean; trigger: ReactElement }) =>
      <div data-test-dialog="type-settings" data-open={open}>{trigger}</div>,
  };
});

describe("PropertyPanel stroke-dialog coordination", () => {
  it("keeps Type, Fill, Stroke, and Effect inspector siblings mutually exclusive", () => {
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(<PropertyPanel
        elementType="text"
        fills={[{ id: "fill", color: "#fff", opacity: 100, visible: true }]}
        strokes={[{ id: "stroke", color: "#000", opacity: 100, visible: true, weight: 2, align: "center", style: "solid", join: "miter", cap: "none" }]}
        effects={[{ id: "effect", type: "Drop shadow", visible: true }]}
      />);
    });

    const dialogOpen = (kind: string) => renderer!.root.findAll(node => node.props["data-test-dialog"] === kind).some(node => node.props["data-open"]);
    const typeSettings = renderer!.root.findAllByType("button").find(button => button.props["aria-label"] === "Type settings")!;
    act(() => typeSettings.props.onClick());
    expect(dialogOpen("type-settings")).toBe(true);

    const settings = renderer!.root.findAllByType("button").find(button => button.props["aria-label"] === "Stroke settings")!;
    act(() => settings.props.onClick());
    expect(dialogOpen("type-settings")).toBe(false);
    expect(dialogOpen("stroke-settings")).toBe(true);

    const strokeColor = renderer!.root.findAllByType(ColorInput).find(input => input.props.ariaLabel === "Stroke color")!;
    act(() => strokeColor.props.onSwatchClick());
    expect(dialogOpen("stroke-settings")).toBe(false);
    expect(dialogOpen("color")).toBe(true);

    const effectDialog = renderer!.root.findAll(node => node.props["data-test-dialog"] === "effect")[0];
    const triggerButton = effectDialog.findByType("button");
    act(() => triggerButton.props.onClick({}));
    expect(dialogOpen("color")).toBe(false);
    expect(dialogOpen("effect")).toBe(true);
  });
});
