import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { EffectDetailsDialog } from "./EffectDetailsDialog";

vi.mock("./InspectorDialog", () => ({
  COMPACT_INSPECTOR_DIALOG_WIDTH: 240,
  EFFECTS_INSPECTOR_DIALOG_SIDE_OFFSET: 8,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR: "[data-composa-inspector-surface]",
  InspectorDialog: ({ ariaLabel, width, sideOffset, anchorSurfaceSelector, elevation, trigger, children }: {
    ariaLabel?: string;
    width?: number;
    sideOffset?: number;
    anchorSurfaceSelector?: string;
    elevation?: number;
    trigger?: ReactNode;
    children: ReactNode;
  }) =>
    <div data-aria-label={ariaLabel} data-width={width} data-side-offset={sideOffset} data-anchor-surface={anchorSurfaceSelector} data-elevation={elevation}>{trigger}{children}</div>,
}));

/**
 * The opening tag of ONE dialog. The effect dialog nests the colour dialog, so a
 * whole-document `toContain('data-side-offset="8"')` would pass off either one —
 * every placement assertion has to name the dialog it is about.
 */
function dialogTag(html: string, ariaLabel: string): string {
  const tag = html.match(new RegExp(`<div data-aria-label="${ariaLabel}"[^>]*>`))?.[0];
  expect(tag, `${ariaLabel} dialog rendered`).toBeTruthy();
  return tag!;
}

/**
 * The one numeric field whose input carries `ariaLabel`. Its icon lead lives in
 * the same `data-composa-numeric-input` box, so this scopes glyph assertions to a
 * single field instead of the whole dialog (where Blur's glyph would satisfy an
 * assertion written about Spread).
 */
function numericField(html: string, ariaLabel: string): string {
  const fields: string[] = html.match(/<div data-composa-numeric-input=""[\s\S]*?<\/div>/g) ?? [];
  const field = fields.find(candidate => candidate.includes(`aria-label="${ariaLabel}"`));
  expect(field, `${ariaLabel} numeric field rendered`).toBeTruthy();
  return field!;
}

const shadowHtml = () => renderToStaticMarkup(
  <EffectDetailsDialog
    open
    value={{ type: "Drop shadow", visible: true, blur: 24, spread: 3 }}
    trigger={<button type="button">Open effect</button>}
    onClose={() => undefined}
  />,
);

describe("EffectDetailsDialog", () => {
  it("exposes only host-backed Drop shadow diamonds and routes every toggle", () => {
    const toggles = {
      position: vi.fn(), blur: vi.fn(), spread: vi.fn(), color: vi.fn(), opacity: vi.fn(),
    };
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<EffectDetailsDialog open value={{
        type: "Drop shadow", visible: true, x: 2, y: 4, blur: 8, spread: 0, color: "#000000", opacity: 25,
        keyframes: Object.fromEntries(Object.entries(toggles).map(([key, onToggle]) => [key, { active: key === "blur", onToggle }])),
      }} trigger={<button type="button">Open effect</button>} onClose={() => undefined} />);
    });
    const labels = ["Position X/Position Y keyframe", "Blur keyframe", "Spread keyframe", "Effect color keyframe", "Opacity keyframe"];
    for (const label of labels) {
      const button = renderer!.root.findByProps({ "aria-label": label });
      act(() => button.props.onClick({ stopPropagation: () => undefined }));
    }
    expect(Object.values(toggles).every(toggle => toggle.mock.calls.length === 1)).toBe(true);
    expect(renderer!.root.findByProps({ "aria-label": "Blur keyframe" }).props["aria-pressed"]).toBe(true);
    act(() => renderer!.unmount());

    expect(shadowHtml()).not.toContain(" keyframe");
  });

  it("uses the 240px, elevated inspector overlay contract", () => {
    const html = renderToStaticMarkup(
      <EffectDetailsDialog
        open={false}
        value={{ type: "Drop shadow", visible: true }}
        trigger={<button type="button">Open effect</button>}
        onClose={() => undefined}
      />,
    );

    const dialog = dialogTag(html, "Effect details");
    expect(dialog).toContain('data-width="240"');
    expect(dialog).toContain('data-elevation="400"');
    // The nested colour dialog keeps its own, larger offset — asserted on ITS tag
    // so it can never stand in for the effect dialog's own placement above.
    expect(dialogTag(html, "Color")).toContain('data-side-offset="100"');
  });

  it("anchors to the inspector surface with the shared 8px gutter, not a trigger-relative offset (#661)", () => {
    // The trigger is the effect-type dropdown inside a PanelEntry, whose 16px grip
    // column sits flush to the panel edge — a trigger-relative 48 put the dialog
    // 32px clear of the inspector, visibly further out than every sibling dialog.
    const dialog = dialogTag(shadowHtml(), "Effect details");
    expect(dialog).toContain('data-side-offset="8"');
    expect(dialog).toContain('data-anchor-surface="[data-composa-inspector-surface]"');
  });

  it("shares one gutter constant with the other inspector dialogs", async () => {
    // Against the REAL module, not the mock: the feedback is "match the spacing the
    // other inspector dialogs use", so the gate is the constants agreeing.
    const inspectorDialog = await vi.importActual<typeof import("./InspectorDialog")>("./InspectorDialog");

    expect(inspectorDialog.EFFECTS_INSPECTOR_DIALOG_SIDE_OFFSET)
      .toBe(inspectorDialog.STROKE_SETTINGS_INSPECTOR_SIDE_OFFSET);
    expect(inspectorDialog.EFFECTS_INSPECTOR_DIALOG_SIDE_OFFSET)
      .toBe(inspectorDialog.TYPE_SETTINGS_INSPECTOR_SIDE_OFFSET);
  });

  it("leads Blur with Lucide grip and Spread with Lucide sun, sized like every other field icon (#661)", () => {
    const html = shadowHtml();

    const blur = numericField(html, "Blur");
    expect(blur).toContain("lucide-grip");
    expect(blur).toContain('data-icon-semantic="effect-blur"');
    expect(blur).toContain('width="16"');
    expect(blur).toContain('stroke-width="1.5"');

    const spread = numericField(html, "Spread");
    expect(spread).toContain("lucide-sun");
    expect(spread).toContain('data-icon-semantic="effect-spread"');
    expect(spread).toContain('width="16"');
    expect(spread).toContain('stroke-width="1.5"');

    // The glyphs are distinct, and neither field still ships the literal text
    // characters that stood in for icons before.
    expect(blur).not.toContain("lucide-sun");
    expect(spread).not.toContain("lucide-grip");
    expect(html).not.toContain("⊞");
    expect(html).not.toContain("☼");
  });

  it("gives the blur-only effect types the same Lucide grip lead as the shadow types", () => {
    const html = renderToStaticMarkup(
      <EffectDetailsDialog
        open
        value={{ type: "Layer blur", visible: true, blur: 4 }}
        trigger={<button type="button">Open effect</button>}
        onClose={() => undefined}
      />,
    );

    const blur = numericField(html, "Blur");
    expect(blur).toContain("lucide-grip");
    // Layer blur has no Spread field at all — assert the absence only now that the
    // Blur field above proves the body rendered.
    expect(html).not.toContain('aria-label="Spread"');
  });

  it("keeps shadow X/Y in one reference-aligned Position row with shrink-safe fields", () => {
    const html = renderToStaticMarkup(
      <EffectDetailsDialog
        open
        value={{ type: "Drop shadow", visible: true, x: 12, y: -8, blur: 24, spread: 3 }}
        trigger={<button type="button">Open effect</button>}
        onClose={() => undefined}
      />,
    );

    expect(html.match(/>Position</g)).toHaveLength(1);
    expect(html).toContain('aria-label="Position X"');
    expect(html).toContain('aria-label="Position Y"');
    expect(html).toContain('aria-label="Opacity"');
    expect(html).toContain('aria-label="Effect color hex"');
    expect(html).not.toContain('aria-label="Effect color opacity"');
    expect(html.match(/min-w-0 flex-1/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("hugs the effect-type dropdown in the dialog header (not fill), keeping eye/close right-aligned (#460)", () => {
    const html = renderToStaticMarkup(
      <EffectDetailsDialog
        open
        value={{ type: "Drop shadow", visible: true }}
        trigger={<button type="button">Open effect</button>}
        onClose={() => undefined}
      />,
    );

    // The type dropdown sizes to its content (hug → w-auto max-w-full), not fill.
    expect(html).toContain("w-auto max-w-full");
    // The trailing eye + close controls stay pinned right via the mr-auto spacer.
    expect(html).toContain("mr-auto");
  });
});
