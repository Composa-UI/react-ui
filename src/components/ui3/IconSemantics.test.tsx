import { Settings2 } from "lucide-react";
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

  it("uses settings for Type, Stroke, and Template while Auto Layout stays a distinct layout action", () => {
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

    for (const [html, label] of [
      [text, "Type settings"],
      [text, "Stroke settings"],
      [slide, "Template settings"],
    ] as const) {
      const trigger = settingsTrigger(html, label);
      expect(trigger, `${label} trigger`).toBeTruthy();
      expect(trigger).toContain("lucide-settings-2");
      expect(trigger).toContain('data-icon-semantic="settings"');
      expect(trigger).toContain('width="16"');
      expect(trigger).toContain('height="16"');
      expect(trigger).toContain('stroke-width="1.5"');
    }

    const autoTrigger = settingsTrigger(autoLayout, "Auto-layout settings");
    expect(autoTrigger).toBeTruthy();
    expect(autoTrigger).toContain("lucide-proposed-layout-freeform");
    expect(autoTrigger).toContain('data-icon-semantic="layout-freeform"');
    expect(autoTrigger).not.toContain('data-icon-semantic="settings"');
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
      "text-align-top",
      "text-align-center",
      "text-align-bottom",
    ] as const) {
      expect(iconForSemantic(semantic)).toBe(composaIconSemantics[semantic]);
    }
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
