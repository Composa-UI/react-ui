import { AlignCenter, AlignLeft, AlignRight, Circle, Grip, LayoutGrid, Settings2, Sun } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProposedLayoutWrap } from "../../icons/proposed-lucide";
import { composaIconSemantics, iconForSemantic } from "./IconSemantics";
import { PropertyPanel } from "./PropertyPanel";
import { AnimatePanel } from "./AnimatePanel";
import { LayerTypeIcon } from "./LayerTypeIcon";

function settingsTrigger(html: string, label: string) {
  return html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>[\\s\\S]*?<\\/button>`))?.[0];
}

describe("settings icon semantics", () => {
  it("maps every settings entry point to Lucide Settings2", () => {
    expect(composaIconSemantics.settings).toBe(Settings2);
    expect(iconForSemantic("settings")).toBe(Settings2);
  });

  it("uses settings for Type, Stroke, Template AND Auto Layout (Composa#661)", () => {
    const autoLayout = renderToStaticMarkup(<PropertyPanel elementType="frame-auto" />);
    const text = renderToStaticMarkup(<PropertyPanel elementType="text" strokes={[{
      id: "stroke-1",
      color: "#000000",
      opacity: 100,
      visible: true,
      weight: 1,
      align: "inside",
    }]} />);
    const slide = renderToStaticMarkup(<PropertyPanel mode="slide" capabilities={{ templates: true }} />);

    // Auto-layout settings joined this list in Composa#661: it used the Freeform
    // *layout* glyph, so the settings entry point read as a fourth flow option
    // sitting next to the Flow segments.
    for (const [html, label] of [
      [text, "Type settings"],
      [text, "Stroke settings"],
      [slide, "Template settings"],
      [autoLayout, "Auto-layout settings"],
    ] as const) {
      const trigger = settingsTrigger(html, label);
      expect(trigger, `${label} trigger`).toBeTruthy();
      expect(trigger).toContain("lucide-settings-2");
      expect(trigger).toContain('data-icon-semantic="settings"');
      expect(trigger).toContain('width="16"');
      expect(trigger).toContain('height="16"');
      expect(trigger).toContain('stroke-width="1.5"');
    }

    // …and specifically no longer wears a layout glyph.
    const autoTrigger = settingsTrigger(autoLayout, "Auto-layout settings");
    expect(autoTrigger).not.toContain("lucide-proposed-layout-freeform");
    expect(autoTrigger).not.toContain('data-icon-semantic="layout-freeform"');
  });

  it("maps shared inspector semantics to outlined and proposed Lucide boundaries", () => {
    for (const semantic of [
      "blend-mode",
      "absolute-position",
      "rotation",
      "opacity",
      "fill-video",
      "align-left",
      "align-center-x",
      "align-right",
      "align-top",
      "align-center-y",
      "align-bottom",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "padding-horizontal",
      "padding-vertical",
      "text-align-left",
      "text-align-center-x",
      "text-align-right",
      "text-align-top",
      "text-align-center",
      "text-align-bottom",
    ] as const) {
      expect(iconForSemantic(semantic)).toBe(composaIconSemantics[semantic]);
    }
  });

  it("pins the owner's Lucide glyphs for effect blur and spread (#661)", () => {
    // Blur and Spread previously shipped as literal ⊞/☼ text characters. The owner
    // named these two Lucide icons; pin them so a later "tidy-up" cannot quietly
    // swap the glyph, and keep the two fields visually distinguishable.
    expect(composaIconSemantics["effect-blur"]).toBe(Grip);
    expect(composaIconSemantics["effect-spread"]).toBe(Sun);
    expect(composaIconSemantics["effect-blur"]).not.toBe(composaIconSemantics["effect-spread"]);
  });

  it("stops Wrap and Grid wearing the same grid glyph in the Flow row ('Grid icon unchanged')", () => {
    // #86/#459 dressed the Wrap cell in Lucide's LayoutGrid as a stand-in from
    // before Grid existed; grid-and-wrap-spec §1(c) calls that borrow "a label
    // papering over the absence of both a real two-gap wrap *and* a real grid" and
    // folds "the #86 glyph choice" into the grid work. Grid is now its own Flow
    // segment wearing Grid2x2, so the borrow put two near-identical grid glyphs in
    // one row. Wrap has its own wrapped-flow glyph; the two must stay distinct and
    // neither may fall back to Lucide's LayoutGrid.
    expect(composaIconSemantics["layout-wrap"]).toBe(ProposedLayoutWrap);
    expect(composaIconSemantics["layout-wrap"]).not.toBe(composaIconSemantics["layout-grid"]);
    expect(composaIconSemantics["layout-wrap"]).not.toBe(LayoutGrid);
    expect(composaIconSemantics["layout-grid"]).not.toBe(LayoutGrid);
    // …and Wrap still reads as one of the Flow set without colliding with it.
    expect(composaIconSemantics["layout-wrap"]).not.toBe(composaIconSemantics["layout-freeform"]);
    expect(composaIconSemantics["layout-wrap"]).not.toBe(composaIconSemantics["layout-horizontal"]);
    expect(composaIconSemantics["layout-wrap"]).not.toBe(composaIconSemantics["layout-vertical"]);
  });

  it("draws the Wrap toggle with the wrapped-flow glyph in the auto-layout Flow row", () => {
    // Reaching the UI, not just the map: the Wrap toggle only exists on Horizontal.
    const horizontal = renderToStaticMarkup(<PropertyPanel elementType="frame-auto" layout={{
      mode: "horizontal", gap: 12, padding: { top: 0, right: 0, bottom: 0, left: 0 },
      align: "mc", widthMode: "fixed", heightMode: "fixed", clipsContent: false,
    }} onLayoutChange={() => undefined} />);
    const wrapToggle = settingsTrigger(horizontal, "Wrap");
    expect(wrapToggle, "Wrap toggle").toBeTruthy();
    expect(wrapToggle).toContain('data-icon-semantic="layout-wrap"');
    expect(wrapToggle).toContain("lucide-proposed-layout-wrap");
    expect(wrapToggle).not.toContain("lucide-layout-grid");
  });

  it("wires Typography horizontal alignment to paragraph text-align glyphs, distinct from the vertical group and the object-align row (#495)", () => {
    // Horizontal text-align uses the Lucide paragraph glyphs (horizontal text
    // lines), not the object-align box glyphs.
    expect(composaIconSemantics["text-align-left"]).toBe(AlignLeft);
    expect(composaIconSemantics["text-align-center-x"]).toBe(AlignCenter);
    expect(composaIconSemantics["text-align-right"]).toBe(AlignRight);

    // Genuinely different from the object-align (Position) row…
    expect(composaIconSemantics["text-align-left"]).not.toBe(composaIconSemantics["align-left"]);
    expect(composaIconSemantics["text-align-center-x"]).not.toBe(composaIconSemantics["align-center-x"]);
    expect(composaIconSemantics["text-align-right"]).not.toBe(composaIconSemantics["align-right"]);

    // …and from the Typography vertical group (top/middle/bottom).
    expect(composaIconSemantics["text-align-left"]).not.toBe(composaIconSemantics["text-align-top"]);
    expect(composaIconSemantics["text-align-center-x"]).not.toBe(composaIconSemantics["text-align-center"]);
    expect(composaIconSemantics["text-align-right"]).not.toBe(composaIconSemantics["text-align-bottom"]);
  });

  it("gives every drawable primitive its own glyph instead of collapsing to the square (#661)", () => {
    // `shape` is the rectangle/fallback; a line and an ellipse are their own
    // outlines, so a layer row points at the object it actually names.
    expect(composaIconSemantics.ellipse).toBe(Circle);
    expect(composaIconSemantics.ellipse).not.toBe(composaIconSemantics.shape);
    expect(composaIconSemantics.line).not.toBe(composaIconSemantics.shape);
    expect(composaIconSemantics.ellipse).not.toBe(composaIconSemantics.line);
    expect(iconForSemantic("ellipse")).toBe(Circle);
  });

  it("projects the authored auto-layout direction AND alignment into the canonical layer icon", () => {
    // The alignment half used to be missing: both directions were pinned to
    // `-center` whatever the frame was aligned to (Composa#661).
    const horizontal = renderToStaticMarkup(<LayerTypeIcon type="frame" autoLayoutMode="horizontal" autoLayoutAlign="center" />);
    const vertical = renderToStaticMarkup(<LayerTypeIcon type="frame" autoLayoutMode="vertical" autoLayoutAlign="center" />);
    expect(horizontal).toContain('data-icon-semantic="auto-layout-horizontal-center"');
    expect(vertical).toContain('data-icon-semantic="auto-layout-vertical-center"');
    expect(horizontal).not.toBe(vertical);

    // Every registered alignment glyph is reachable through the icon, and no two
    // alignments collapse onto the same one.
    const semanticOf = (mode: "horizontal" | "vertical", align: "start" | "center" | "end") =>
      renderToStaticMarkup(<LayerTypeIcon type="frame" autoLayoutMode={mode} autoLayoutAlign={align} />).match(/data-icon-semantic="([^"]+)"/)?.[1];
    expect((["horizontal", "vertical"] as const).flatMap(mode => (["start", "center", "end"] as const).map(align => semanticOf(mode, align)))).toEqual([
      "auto-layout-horizontal-top", "auto-layout-horizontal-center", "auto-layout-horizontal-bottom",
      "auto-layout-vertical-left", "auto-layout-vertical-center", "auto-layout-vertical-right",
    ]);
  });

  it("uses the canonical semantic for current Animate settings entry points", () => {
    // #222: the Animate settings icons are gated behind the `animationDelay` capability
    // (default OFF). Their icon semantics only apply when the capability is enabled.
    const html = renderToStaticMarkup(<AnimatePanel animationDelay />);
    for (const label of ["Comp transition settings", "Object animation settings"]) {
      const trigger = settingsTrigger(html, label);
      expect(trigger, `${label} trigger`).toBeTruthy();
      expect(trigger).toContain("lucide-settings-2");
      expect(trigger).toContain('data-icon-semantic="settings"');
      expect(trigger).toContain('width="16"');
      expect(trigger).toContain('height="16"');
      expect(trigger).toContain('stroke-width="1.5"');
    }
  });
});
