import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getSizingMenuLabels, PropertyPanel, reconcileAutoLayoutGap } from "./PropertyPanel";
import { TooltipProvider } from "./Tooltip";

describe("Timeline easing inspector composition", () => {
  it("renders segment easing as the only Design inspector section", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="text" easingContext="segment"
      easing={{ preset: "custom", controlPoints: [0.2, 0, 0.8, 1], editable: true }}
      onEasingChange={() => undefined} />);
    expect(html).toContain(">Easing</span>");
    expect(html).not.toContain(">Position</span>");
    expect(html).not.toContain(">Appearance</span>");
  });

  it("appends keyframe easing to the normal element inspector", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="text" easingContext="keyframe"
      easing={{ preset: "ease-in", editable: true }} onEasingChange={() => undefined} />);
    expect(html).toContain(">Position</span>");
    expect(html).toContain(">Appearance</span>");
    expect(html).toContain(">Easing</span>");
  });
});

describe("Motion inspector rows", () => {
  it("renders a shared Dimensions keyframe control on both width and height", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="text"
      keyframeControls={{ dimensions: { active: true, onToggle: () => undefined } }} />);

    expect(html).toContain('aria-label="Width keyframe"');
    expect(html).toContain('aria-label="Height keyframe"');
    expect(html.match(/aria-pressed="true"/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Video Clip inspector semantics", () => {
  it("exposes opt-in landmarks and precisely named controls", () => {
    const html = renderToStaticMarkup(<PropertyPanel mode="video-clip" clipStart={2} clipDuration={3}
      clipTrimIn={0} clipTrimOut={3} clipSpeed={1} />);

    expect(html.match(/role="region"/g)).toHaveLength(4);
    for (const title of ["Source", "Timeline", "Trim", "Playback"]) expect(html).toContain(`>${title}</span>`);
    for (const name of ["Start", "End", "Duration", "Trim in", "Trim out", "Volume"]) {
      expect(html).toContain(`aria-label="${name}"`);
    }
    const speedTrigger = html.match(/<button[^>]*aria-label="Speed: 1×"[^>]*>/)?.[0];
    expect(speedTrigger).toBeTruthy();
    expect(speedTrigger).toContain('aria-haspopup="menu"');
    expect(speedTrigger).toContain('aria-expanded="false"');
    expect(html).toMatch(/aria-label="Volume"[^>]*disabled=""/);
  });
});

describe("Project shell seams", () => {
  it("keeps project video export disabled and names the existing preview controls", () => {
    const html = renderToStaticMarkup(<TooltipProvider><PropertyPanel mode="project" previewPlaying /></TooltipProvider>);

    expect(html).toContain('aria-label="Pause preview"');
    expect(html).toContain('class="lucide lucide-pause"');
    expect(html).toContain('aria-label="Preview options"');
    expect(html).toContain('tabindex="0" aria-label="Project video format unavailable: Video export coming soon"');
    expect(html).toContain('tabindex="0" aria-label="Export project unavailable: Video export coming soon"');
    expect(html).toContain('aria-label="Project video format"');
    expect(html).toMatch(/aria-label="Project video format"[^>]*disabled=""/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*><span>Export project<\/span>/);
  });
});

describe("Auto-layout gap control", () => {
  const layout = {
    mode: "horizontal" as const,
    gap: 12 as number | "auto",
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    align: "mc",
    widthMode: "fixed" as const,
    heightMode: "fixed" as const,
    clipsContent: false,
  };

  it("renders one menu-backed numeric combo instead of a second Auto field", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="frame-auto" layout={layout} />);

    expect(html.match(/data-composa-numeric-combo=/g)).toHaveLength(3);
    expect(html).toContain('data-composa-numeric-combo="fixed"');
    expect(html).toContain('role="group" aria-label="Flow"');
    expect(html).toContain('role="group" aria-label="Alignment and gap"');
    expect(html).toContain('aria-label="Gap"');
    expect(html).toContain('aria-label="Gap sizing mode: Fixed"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('class="lucide lucide-move-horizontal"');
    expect(html).not.toContain('aria-label="Gap settings"');
    const vertical = html.indexOf('aria-label="Vertical"');
    const horizontal = html.indexOf('aria-label="Horizontal"');
    const wrap = html.indexOf('aria-label="Wrap"');
    expect(vertical).toBeGreaterThan(-1);
    expect(vertical).toBeLessThan(horizontal);
    expect(horizontal).toBeLessThan(wrap);
    expect(html).not.toContain('aria-label="Freeform"');
    expect(html.match(/aria-label="Auto-layout settings"/g)).toHaveLength(1);
  });

  it("renders menu-backed W/H modes and the shared min/max grid", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="frame-auto" width={320} height={180} layout={{ ...layout, widthMode: "hug", minWidth: 120, maxHeight: 360 }} />);
    expect(html).toContain('data-composa-numeric-combo="hug"');
    expect(html).toContain('aria-label="Width sizing mode: Hug"');
    expect(html).toMatch(/data-composa-numeric-combo="hug"[\s\S]*?data-composa-relative-mode-label[^>]*>Hug<\/span>/);
    expect(html).toContain('aria-label="Min width"');
    expect(html).toContain('aria-label="Max height"');
    expect(html).toContain('aria-label="Min width options"');
    expect(html).toContain('aria-label="Max height options"');
    expect(html).toContain('data-composa-numeric-combo="constraint"');
    expect(html).not.toContain('aria-label="Min height"');
  });

  it("projects valid mode intersections, constraints and variable gating into canonical menu labels", () => {
    expect(getSizingMenuLabels({ axis: "width", value: 320, availableModes: ["fixed", "fill"], minValue: 120, variablesEnabled: false })).toEqual([
      "Fixed width (320)", "Fill container", "Add max width",
    ]);
    expect(getSizingMenuLabels({ axis: "height", value: 180, availableModes: ["fixed", "hug"], variablesEnabled: true })).toContain("Apply variable");
  });

  it("shows Auto as the combo value and changes the gap icon with vertical flow", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="frame-auto" layout={{ ...layout, mode: "vertical", gap: "auto" }} />);

    expect(html).toContain('data-composa-numeric-combo="auto"');
    expect(html).toContain('aria-label="Gap sizing mode: Auto"');
    expect(html).toContain('class="lucide lucide-move-vertical"');
    expect(html).toMatch(/data-composa-numeric-combo="auto"[\s\S]*?>Auto<\/span>/);
  });

  it("atomically restores the last numeric gap when entering Wrap from Auto", () => {
    expect(reconcileAutoLayoutGap("wrap", "auto", 18)).toBe(18);
    expect(reconcileAutoLayoutGap("horizontal", "auto", 18)).toBe("auto");
    expect(reconcileAutoLayoutGap("wrap", 12, 18)).toBe(12);
  });
});

describe("Plain-frame flow contract", () => {
  it("orders Freeform, Vertical, Horizontal, then Wrap", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="frame" />);
    const freeform = html.indexOf('aria-label="Freeform"');
    const vertical = html.indexOf('aria-label="Vertical"');
    const horizontal = html.indexOf('aria-label="Horizontal"');
    const wrap = html.indexOf('aria-label="Wrap"');
    expect(freeform).toBeGreaterThan(-1);
    expect(freeform).toBeLessThan(vertical);
    expect(vertical).toBeLessThan(horizontal);
    expect(horizontal).toBeLessThan(wrap);
  });
});
