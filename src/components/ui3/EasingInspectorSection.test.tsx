import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EasingInspectorSection, easingPointAtClient, easingPointUpdate } from "./EasingInspectorSection";
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
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="1"');
    expect(html).toContain('aria-valuenow="0.2"');
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

  it("maps pointer coordinates through the same inset plot as the rendered handles", () => {
    const rect = { left: 20, top: 40, width: 400, height: 224 };
    const client = (x: number, y: number) => [
      rect.left + (12 + x * 176) / 200 * rect.width,
      rect.top + (100 - y * 88) / 112 * rect.height,
    ] as const;
    const custom = easingPointAtClient(rect, ...client(0.2, -0.1));
    expect(custom[0]).toBeCloseTo(0.2, 10);
    expect(custom[1]).toBeCloseTo(-0.1, 10);
    expect(easingPointAtClient(rect, ...client(0, 0))).toEqual([0, 0]);
    expect(easingPointAtClient(rect, ...client(1, 1))).toEqual([1, 1]);
    const spring = easingPointAtClient(rect, ...client(0.32, 1.275));
    expect(spring[0]).toBeCloseTo(0.32, 10);
    expect(spring[1]).toBeCloseTo(1.275, 10);
  });

  it("keeps named presets presentational until Custom is explicitly selected or authored", () => {
    const html = renderToStaticMarkup(<EasingInspectorSection value={{ preset: "spring", editable: true }} onChange={() => undefined} />);
    expect(html).not.toContain('aria-label="Easing control point 1"');
    expect(html).toContain('aria-label="Easing X1"');
  });

  it("adds the Curve/Spring tabs and a copyable cubic readout (export parity)", () => {
    const html = renderToStaticMarkup(<EasingInspectorSection
      value={{ preset: "linear", editable: true }}
      onChange={() => undefined}
    />);
    expect(html).toContain('aria-label="Easing type"');
    expect(html).toContain(">Curve<");
    expect(html).toContain(">Spring<");
    expect(html).toContain("data-easing-cubic-readout");
    expect(html).toContain(">0, 0, 1, 1<");
    expect(html).toContain('aria-label="Copy cubic bézier"');
  });

  it("marks the Spring tab pressed when the spring preset is active", () => {
    const html = renderToStaticMarkup(<EasingInspectorSection value={{ preset: "spring", editable: true }} onChange={() => undefined} />);
    // The segmented Spring item is pressed; its cubic readout reflects the spring curve.
    expect(html).toContain(">0.175, 0.885, 0.32, 1.275<");
  });

  it("renders locked easing as disabled presentation", () => {
    const html = renderToStaticMarkup(<EasingInspectorSection value={{ preset: "spring", editable: false }} onChange={() => undefined} />);
    expect(html).toContain('aria-label="Easing preset"');
    expect(html.match(/disabled=""/g)?.length).toBeGreaterThanOrEqual(6);
  });
});
