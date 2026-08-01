import { AlignCenter, AlignLeft, AlignRight, LayoutGrid, Settings2 } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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

  it("dresses the Wrap flow mode with the grid glyph while keeping it distinct from the Freeform/H/V flow icons (#459/DEC-008)", () => {
    // Wrap is Composa's single multi-line auto-layout *mode* (not a Grid
    // document mode). Per owner #459 its flow cell uses the Lucide grid glyph
    // because a wrapped layout reads as a grid; the semantic name stays "wrap".
    expect(composaIconSemantics["layout-wrap"]).toBe(LayoutGrid);
    expect(composaIconSemantics["layout-wrap"]).not.toBe(composaIconSemantics["layout-freeform"]);
    expect(composaIconSemantics["layout-wrap"]).not.toBe(composaIconSemantics["layout-horizontal"]);
    expect(composaIconSemantics["layout-wrap"]).not.toBe(composaIconSemantics["layout-vertical"]);
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

  it("projects the authored auto-layout direction into the canonical layer icon", () => {
    const horizontal = renderToStaticMarkup(<LayerTypeIcon type="frame" autoLayoutMode="horizontal" />);
    const vertical = renderToStaticMarkup(<LayerTypeIcon type="frame" autoLayoutMode="vertical" />);
    expect(horizontal).toContain('data-icon-semantic="auto-layout-horizontal-center"');
    expect(vertical).toContain('data-icon-semantic="auto-layout-vertical-center"');
    expect(horizontal).not.toBe(vertical);
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
