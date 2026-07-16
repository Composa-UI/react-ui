import { Settings2 } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { composaIconSemantics, iconForSemantic } from "./IconSemantics";
import { PropertyPanel } from "./PropertyPanel";
import { AnimatePanel } from "./AnimatePanel";

function settingsTrigger(html: string, label: string) {
  return html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>[\\s\\S]*?<\\/button>`))?.[0];
}

describe("settings icon semantics", () => {
  it("maps every settings entry point to Lucide Settings2", () => {
    expect(composaIconSemantics.settings).toBe(Settings2);
    expect(iconForSemantic("settings")).toBe(Settings2);
  });

  it("uses the canonical semantic for Auto Layout, Type, Stroke, and Template settings", () => {
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
      [autoLayout, "Auto-layout settings"],
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
  });

  it("uses the canonical semantic for current Animate settings entry points", () => {
    const html = renderToStaticMarkup(<AnimatePanel />);
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
