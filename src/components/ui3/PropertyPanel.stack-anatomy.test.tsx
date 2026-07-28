import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { PanelEntry } from "./Panel";
import { Dropdown } from "./Dropdown";
import { NumericComboInput, NumericInput } from "./Input";
import {
  PropertyPanel,
  SizingComboField,
  type ElementEffectSetting,
  type ElementFillSetting,
  type ElementStrokeSetting,
} from "./PropertyPanel";

// Inspector stackable-section + value-field anatomy conformance (#449, #460).
//
// These lock the *canonical* anatomy the rest of the inspector already uses:
//  - Fill · Stroke · Effects entries render through ONE shared row primitive
//    (PanelEntry) so their grip / eye / remove controls stay identical (#460).
//  - The Effects type selector (inspector) reserves the row's trailing slot by
//    filling the content column rather than hugging its content (#460).
//  - Opacity renders a trailing `%` suffix and reserves its leading-icon slot (#449).
//  - Width/Height sizing shows its mode in the trigger and its menu keeps the
//    leading-icon column and the checkmark column as separate slots (#449).

const fills: ElementFillSetting[] = [
  { id: "f1", color: "#171717", opacity: 100, visible: true },
];
const strokes: ElementStrokeSetting[] = [
  { id: "s1", color: "#000000", opacity: 100, visible: true, weight: 1, align: "inside" },
];
const effects: ElementEffectSetting[] = [
  { id: "e1", type: "Drop shadow", visible: true } as ElementEffectSetting,
];

function renderPanel() {
  let renderer: ReactTestRenderer;
  act(() => {
    renderer = create(
      <PropertyPanel
        elementType="shape"
        opacity={42}
        fills={fills}
        onRemoveFill={() => undefined}
        onToggleFill={() => undefined}
        strokes={strokes}
        onRemoveStroke={() => undefined}
        onToggleStroke={() => undefined}
        effects={effects}
        onRemoveEffect={() => undefined}
        onToggleEffect={() => undefined}
      />,
    );
  });
  return renderer!;
}

describe("#460 — Fill/Stroke/Effects share one canonical entry anatomy", () => {
  it("renders Fill, Stroke, and Effects entries through the shared PanelEntry primitive", () => {
    const renderer = renderPanel();
    const removeLabels = renderer.root
      .findAllByType(PanelEntry)
      .map(entry => entry.props.removeLabel);
    // One PanelEntry per stackable entry, each carrying its section-specific
    // remove label — proving all three sections flow through the same primitive.
    expect(removeLabels).toEqual(expect.arrayContaining(["Remove fill", "Remove stroke", "Remove effect"]));
    act(() => renderer.unmount());
  });

  it("gives every stackable entry an always-present eye + remove control", () => {
    const renderer = renderPanel();
    for (const entry of renderer.root.findAllByType(PanelEntry)) {
      expect(typeof entry.props.onToggleVisible).toBe("function");
      expect(typeof entry.props.onRemove).toBe("function");
    }
    act(() => renderer.unmount());
  });

  it("reserves the row's trailing slot on the Effects type selector by filling the content column, not hugging", () => {
    const renderer = renderPanel();
    const effectDropdown = renderer.root
      .findAllByType(Dropdown)
      .find(node => node.props.ariaLabel?.startsWith("Effect type:"))!;
    expect(effectDropdown.props.fullWidth).toBe(true);
    expect(effectDropdown.props.hug).toBeFalsy();
    act(() => renderer.unmount());
  });
});

describe("#449 — Opacity value-field anatomy", () => {
  it("renders the opacity unit as a trailing % suffix and reserves the leading-icon slot", () => {
    const renderer = renderPanel();
    const opacity = renderer.root
      .findAllByType(NumericInput)
      .find(node => node.props.ariaLabel === "Opacity")!;
    expect(opacity.props.suffix).toBe("%");
    // Leading-icon slot occupied → text/value aligns with sibling value controls.
    expect(opacity.props.iconLead).toBeTruthy();
    act(() => renderer.unmount());
  });
});

describe("#449 — Width/Height mode trigger + menu anatomy", () => {
  it("shows the active Hug mode in the trigger rather than collapsing to a bare chevron", () => {
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(
        <SizingComboField axis="width" value={120} mode="hug" availableModes={["fixed", "hug", "fill"]} />,
      );
    });
    const combo = renderer!.root.findByType(NumericComboInput);
    expect(combo.props.idleLabel).toBe("Hug");
    act(() => renderer!.unmount());
  });

  it("keeps the leading-icon column and the checkmark column as separate menu slots", () => {
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(
        <SizingComboField axis="width" value={120} mode="fixed" availableModes={["fixed", "hug", "fill"]} />,
      );
    });
    const combo = renderer!.root.findByType(NumericComboInput);
    const menu = combo.props.menu(() => undefined);
    const rows = (Array.isArray(menu.props.children) ? menu.props.children : [menu.props.children]).flat(Infinity);
    const modeRows = rows.filter(
      (row: { props?: { label?: string } }) =>
        row?.props?.label === "Hug contents" || String(row?.props?.label ?? "").startsWith("Fixed width"),
    );
    expect(modeRows.length).toBeGreaterThanOrEqual(2);
    for (const row of modeRows) {
      // A checkmark row reserves its own check slot AND carries a leading icon —
      // the two live in independent columns (Menu.tsx renders them separately).
      expect(row.props.type).toBe("checkmark");
      expect(row.props.leading).toBeTruthy();
    }
    act(() => renderer!.unmount());
  });
});
