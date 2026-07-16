import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EasingInspectorSection, easingPointUpdate } from "./EasingInspectorSection";
import { EASING_PRESETS, easingControlPoints, easingPresetLabel, easingSvgPath } from "./easing";

describe("EasingInspectorSection contracts", () => {
  it("keeps every named preset and cubic value aligned with the timeline spec", () => {
    expect(EASING_PRESETS.map(preset => [preset.label, preset.controlPoints])).toEqual([
      ["Linear", [0, 0, 1, 1]],
      ["Ease in", [0.42, 0, 1, 1]],
      ["Ease out", [0, 0, 0.58, 1]],
      ["Ease in-out", [0.42, 0, 0.58, 1]],
      ["Ease in (strong)", [0.7, 0, 1, 1]],
      ["Ease out (strong)", [0, 0, 0.3, 1]],
      ["Ease in-out (strong)", [0.7, 0, 0.3, 1]],
      ["Spring", [0.175, 0.885, 0.32, 1.275]],
    ]);
    expect(easingPresetLabel("custom")).toBe("Custom");
  });

  it("renders accessible custom controls and all apply scopes", () => {
    const html = renderToStaticMarkup(<EasingInspectorSection
      value={{ preset: "custom", controlPoints: [0.2, -0.1, 0.8, 1.2], editable: true }}
      onChange={() => undefined}
      onApplyScopeChange={() => undefined}
    />);
    expect(html).toContain('data-easing-inspector-preset="custom"');
    expect(html).toContain('data-easing-inspector-control-points="[0.2,-0.1,0.8,1.2]"');
    expect(html).toContain('aria-label="Easing preset"');
    expect(html).toContain('aria-label="Easing curve preview"');
    expect(html).toContain('aria-label="Easing control point 1"');
    expect(html).toContain('aria-label="Easing control point 2"');
    expect(html).toContain('aria-label="Easing X1"');
    expect(html).toContain('aria-label="Easing Y2"');
    expect(html).toContain('aria-label="Apply easing to"');
  });

  it("keeps legacy custom easing custom while initializing a cubic only for editing", () => {
    expect(easingControlPoints("custom")).toEqual([0.25, 0.1, 0.25, 1]);
    expect(easingSvgPath(easingControlPoints("custom"))).toContain(" C");
    expect(easingPointUpdate([0.25, 0.1, 0.25, 1], 0, 3)).toEqual([1, 0.1, 0.25, 1]);
    expect(easingPointUpdate([0.25, 0.1, 0.25, 1], 1, -2)).toEqual([0.25, -2, 0.25, 1]);
  });

  it("renders locked easing as disabled presentation", () => {
    const html = renderToStaticMarkup(<EasingInspectorSection value={{ preset: "spring", editable: false }} onChange={() => undefined} />);
    expect(html).toContain('aria-label="Easing preset"');
    expect(html.match(/disabled=""/g)?.length).toBeGreaterThanOrEqual(7);
  });
});
