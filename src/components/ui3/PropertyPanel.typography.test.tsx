import { renderToStaticMarkup } from "react-dom/server";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_FONT_WEIGHTS, type FontEntry } from "./FontPickerDialog";
import { ComboInput, NumericInput } from "./Input";
import { PopoverMenu } from "./Menu";
import { DEFAULT_FONT_SIZES, PropertyPanel, type ElementTypographySettings } from "./PropertyPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** A style-free selection, so the Typography section shows the family/weight/size
 *  controls rather than the applied-style branch. */
function typography(patch: Partial<ElementTypographySettings> = {}): ElementTypographySettings {
  return {
    fontFamily: "Inter", fontWeight: "Medium", fontSize: 16, lineHeight: 24, letterSpacing: 0,
    align: "left", verticalAlign: "top", weight: 500, ...patch,
  };
}

/** The Font size field itself — not "some ComboInput somewhere in the panel". */
function fontSizeField(root: ReactTestInstance) {
  const field = root.findAllByType(ComboInput).find(instance => instance.props.ariaLabel === "Font size");
  if (!field) throw new Error("Typography section rendered no Font size field");
  return field;
}

/** The Font weight dropdown, located by its trigger's aria-label. */
function fontWeightPopover(root: ReactTestInstance) {
  const popover = root.findAllByType(PopoverMenu).find(instance => {
    const label = (instance.props.trigger as { props?: { ariaLabel?: string } } | undefined)?.props?.ariaLabel;
    return typeof label === "string" && label.startsWith("Font weight:");
  });
  if (!popover) throw new Error("Typography section rendered no Font weight dropdown");
  return popover;
}

/** Flattened MenuRow elements of a `(close) => <Menu>` render prop. */
function menuRows(menu: (close: () => void) => unknown, close: () => void = () => undefined) {
  const rendered = menu(close) as { props: { children: unknown } };
  return [rendered.props.children].flat(Infinity) as Array<{ props: { label?: string; checked?: boolean; onClick?: () => void } }>;
}

describe("Typography — font size presets (Composa#661: nothing dropped down)", () => {
  it("gives the font-size chevron a real menu of sizes, checked on the current one", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="text" typography={typography({ fontSize: 24 })} />); });

    const field = fontSizeField(renderer!.root);
    expect(field.props.dropdownAriaLabel).toBe("Font size presets");
    expect(typeof field.props.menu).toBe("function");

    const rows = menuRows(field.props.menu);
    expect(rows.map(row => row.props.label)).toEqual(DEFAULT_FONT_SIZES.map(String));
    expect(rows.filter(row => row.props.checked).map(row => row.props.label)).toEqual(["24"]);
    act(() => renderer!.unmount());
  });

  it("applies the chosen size and closes the menu", () => {
    const patches: Array<Partial<ElementTypographySettings>> = [];
    let closed = 0;
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <PropertyPanel elementType="text" typography={typography({ fontSize: 16 })} onTypographyChange={patch => patches.push(patch)} />,
      );
    });

    const rows = menuRows(fontSizeField(renderer!.root).props.menu, () => { closed += 1; });
    const row = rows.find(candidate => candidate.props.label === "48");
    expect(row?.props.onClick).toBeTypeOf("function");
    act(() => row!.props.onClick!());

    expect(patches).toEqual([{ fontSize: 48 }]);
    expect(closed).toBe(1);
    act(() => renderer!.unmount());
  });

  it("lets the host replace the preset roster", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="text" typography={typography()} fontSizes={[10, 20, 30]} />); });

    expect(menuRows(fontSizeField(renderer!.root).props.menu).map(row => row.props.label)).toEqual(["10", "20", "30"]);
    act(() => renderer!.unmount());
  });
});

describe("Typography — truthful numeric keyframes", () => {
  it("binds exact numeric font weight, size, line height, and letter spacing", () => {
    const controls = {
      fontWeight: { active: false, onToggle: vi.fn() },
      fontSize: { active: true, onToggle: vi.fn() },
      lineHeight: { active: false, onToggle: vi.fn() },
      letterSpacing: { active: false, onToggle: vi.fn() },
    };
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="text" typography={typography()} keyframeControls={controls} />); });

    expect(fontSizeField(renderer!.root).props.keyframe).toBe(controls.fontSize);
    expect(renderer!.root.findAllByType(NumericInput).find(node => node.props.ariaLabel === "Line height")?.props.keyframe).toBe(controls.lineHeight);
    expect(renderer!.root.findAllByType(NumericInput).find(node => node.props.ariaLabel === "Letter spacing")?.props.keyframe).toBe(controls.letterSpacing);
    expect(renderToStaticMarkup(<PropertyPanel elementType="text" typography={typography()} keyframeControls={controls} />)).toContain('aria-label="Font weight keyframe"');
    act(() => renderer!.unmount());
  });
});

describe("ComboInput chevron — present only when it does something", () => {
  it("renders no chevron button at all when given neither a menu nor a click handler", () => {
    const markup = renderToStaticMarkup(<ComboInput ariaLabel="Font size" value="48" />);
    // Positive control first: the field really rendered, so the absence below means something.
    expect(markup).toContain('aria-label="Font size"');
    expect(markup).not.toContain("<button");
  });

  it("renders a labelled menu trigger when given a menu", () => {
    const markup = renderToStaticMarkup(
      <ComboInput ariaLabel="Font size" value="48" dropdownAriaLabel="Font size presets" menu={() => null} />,
    );
    expect(markup).toMatch(/<button[^>]*aria-label="Font size presets"[^>]*aria-haspopup="menu"/);
  });

  it("still supports the plain click-handler chevron", () => {
    const markup = renderToStaticMarkup(
      <ComboInput ariaLabel="Font size" value="48" dropdownAriaLabel="Open sizes" onDropdownClick={() => undefined} />,
    );
    expect(markup).toMatch(/<button[^>]*aria-label="Open sizes"/);
    expect(markup).not.toContain('aria-haspopup="menu"');
  });
});

describe("Typography — font weight roster follows the family (Composa#661)", () => {
  const whyte: FontEntry = {
    name: "Whyte",
    stack: "'Whyte', sans-serif",
    weights: [
      { value: 100, label: "Thin" },
      { value: 400, label: "Regular" },
      { value: 900, label: "Black" },
    ],
  };

  it("offers the selected family's declared weights, not the fixed four", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="text" typography={typography({ fontFamily: "Whyte", fontWeight: "Black" })} fonts={[whyte]} />); });

    const rows = menuRows(fontWeightPopover(renderer!.root).props.children);
    expect(rows.map(row => row.props.label)).toEqual(["Thin", "Regular", "Black"]);
    expect(rows.filter(row => row.props.checked).map(row => row.props.label)).toEqual(["Black"]);
    act(() => renderer!.unmount());
  });

  it("emits the named weight together with its numeric value", () => {
    const patches: Array<Partial<ElementTypographySettings>> = [];
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <PropertyPanel elementType="text" typography={typography({ fontFamily: "Whyte", fontWeight: "Regular" })} fonts={[whyte]} onTypographyChange={patch => patches.push(patch)} />,
      );
    });

    const rows = menuRows(fontWeightPopover(renderer!.root).props.children);
    act(() => rows.find(row => row.props.label === "Thin")!.props.onClick!());

    expect(patches).toEqual([{ fontWeight: "Thin", weight: 100 }]);
    act(() => renderer!.unmount());
  });

  it("falls back to the host-wide roster, then to the DS default four", () => {
    const hostWide = [{ value: 300, label: "Light" }, { value: 700, label: "Bold" }];
    let withHostRoster: ReturnType<typeof create>;
    act(() => { withHostRoster = create(<PropertyPanel elementType="text" typography={typography({ fontFamily: "Georgia" })} fonts={[whyte]} fontWeights={hostWide} />); });
    expect(menuRows(fontWeightPopover(withHostRoster!.root).props.children).map(row => row.props.label)).toEqual(["Light", "Bold"]);
    act(() => withHostRoster!.unmount());

    let bare: ReturnType<typeof create>;
    act(() => { bare = create(<PropertyPanel elementType="text" typography={typography()} />); });
    expect(menuRows(fontWeightPopover(bare!.root).props.children).map(row => row.props.label))
      .toEqual(DEFAULT_FONT_WEIGHTS.map(option => option.label));
    act(() => bare!.unmount());
  });

  it("shows a weight the current roster does not list instead of blanking the field", () => {
    let renderer: ReturnType<typeof create>;
    // Semibold survives a family switch to one that ships only Thin/Regular/Black.
    act(() => { renderer = create(<PropertyPanel elementType="text" typography={typography({ fontFamily: "Whyte", fontWeight: "Semibold" })} fonts={[whyte]} />); });

    const trigger = fontWeightPopover(renderer!.root).props.trigger as { props: { ariaLabel: string; value: string } };
    expect(trigger.props.value).toBe("Semibold");
    expect(trigger.props.ariaLabel).toBe("Font weight: Semibold");
    act(() => renderer!.unmount());
  });
});
