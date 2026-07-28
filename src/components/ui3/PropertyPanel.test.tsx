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

  it("keeps relative dimensions labeled until a numeric edit converts them to fixed", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="text"
      layout={{
        mode: "none", gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 },
        align: "tl", widthMode: "hug", heightMode: "hug", clipsContent: false,
      }}
      keyframeControls={{ dimensions: { active: false, onToggle: () => undefined } }} />);

    expect(html).toContain('data-composa-numeric-combo="hug"');
    expect(html).toContain("data-composa-relative-mode-label");
    expect(html).not.toContain('aria-label="Width keyframe"');
    expect(html).not.toContain('aria-label="Height keyframe"');
  });

  it("accepts a host-controlled Animate tab so timeline selection can reveal its matching card", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="text" activeTab="animate" objectAnimations={[
      { id: "pulse", n: 1, name: "Title", kind: "Action", duration: "0.6s", style: "pulse", focused: true },
    ]} />);
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain(">Action<");
  });
});

describe("Video Clip inspector semantics", () => {
  it("exposes opt-in landmarks and precisely named controls", () => {
    const html = renderToStaticMarkup(<PropertyPanel mode="video-clip" clipStart={2} clipDuration={3}
      clipTrimIn={0} clipTrimOut={3} clipSpeed={1} />);

    // Source/Timeline/Trim/Playback + the effect sections (Appearance/Color/Chroma key).
    expect(html.match(/role="region"/g)).toHaveLength(7);
    for (const title of ["Source", "Timeline", "Trim", "Playback", "Appearance", "Color", "Chroma key"]) expect(html).toContain(`>${title}</span>`);
    // Appearance section: the composite blend-mode trigger maps to a host field.
    expect(html).toContain('aria-label="Blend mode: Normal"');
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

describe("Audio Clip inspector semantics", () => {
  it("renders Volume plus the toggled effect sections", () => {
    const html = renderToStaticMarkup(<PropertyPanel mode="audio-clip" audioVolume={100} />);

    // Volume is the host-wired section; the rest are structural toggles.
    expect(html).toContain(">Volume</span>");
    for (const title of ["Equalizer", "Denoise", "De-hum", "Reverb", "Compressor", "Loudness"]) {
      expect(html).toContain(`>${title}</span>`);
    }
    // Effect sections are opened with a "+" (Composa's add pattern), not a
    // header switch — collapsed until added, no dials until then.
    for (const label of ["Add equalizer", "Add de-hum", "Add reverb", "Add loudness"]) {
      expect(html).toContain(`aria-label="${label}"`);
    }
    expect(html).not.toContain("Enable equalizer");
  });
});

describe("Project shell seams", () => {
  it("keeps project video export disabled and collapses Present to one truthful action", () => {
    const html = renderToStaticMarkup(<TooltipProvider><PropertyPanel mode="project" previewPlaying /></TooltipProvider>);

    expect(html).toContain('class="lucide lucide-pause"');
    expect(html).toContain(">Pause</span>");
    expect(html).not.toContain('aria-label="Preview options"');
    expect(html).not.toContain(">Share</span>");
    expect(html).toContain('tabindex="0" aria-label="Project video format unavailable: Video export coming soon"');
    expect(html).toContain('tabindex="0" aria-label="Export project unavailable: Video export coming soon"');
    expect(html).toContain('aria-label="Project video format"');
    expect(html).toMatch(/aria-label="Project video format"[^>]*disabled=""/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*><span>Export project<\/span>/);
  });

  it("restores a segmented Play control with a gated Preview, plus host-backed Share and presence", () => {
    // Segmented Play: Present is the primary action; Preview is a visible but
    // capability-gated (disabled) segment until the floating-preview surface
    // exists end-to-end (#440 / #482) — never an inert chevron.
    const plain = renderToStaticMarkup(<TooltipProvider><PropertyPanel mode="project" onPreviewToggle={() => undefined} /></TooltipProvider>);
    expect(plain).toContain('aria-label="Play"');
    expect(plain).toContain(">Present</span>");
    expect(plain).toContain(">Preview</span>");
    expect(plain).toContain('aria-label="Preview unavailable"');
    expect(plain).not.toContain('aria-label="Preview options"');
    expect(plain).not.toContain('aria-label="Presence and spotlight"');

    // With a host-backed floating-preview capability, the Preview segment becomes
    // an enabled action; Share stays a separate button; presence exposes its split.
    const enabled = renderToStaticMarkup(<TooltipProvider><PropertyPanel mode="project"
      onPreviewToggle={() => undefined}
      onPreviewOpen={() => undefined}
      previewAvailable
      onShare={() => undefined}
      presenceControlsEnabled
      onAccountMenu={() => undefined}
      onPresenceMenu={() => undefined}
    /></TooltipProvider>);
    expect(enabled).toContain('aria-label="Preview"');
    expect(enabled).not.toContain('aria-label="Preview unavailable"');
    expect(enabled).toContain('aria-label="Presence and spotlight"');
    expect(enabled).toContain(">Share</span>");
  });
});

describe("Inspector context projections", () => {
  it("renders separate Position values by default and only offers separation from a host-backed combined row", () => {
    const separate = renderToStaticMarkup(<PropertyPanel elementType="shape" />);
    expect(separate).toContain('aria-label="Position X"');
    expect(separate).toContain('aria-label="Position Y"');
    expect(separate).not.toContain('aria-label="Separate dimensions"');

    const inertCombined = renderToStaticMarkup(<PropertyPanel elementType="shape" positionPresentation="combined" />);
    expect(inertCombined).not.toContain('aria-label="Separate dimensions"');

    const authorableCombined = renderToStaticMarkup(<PropertyPanel elementType="shape"
      positionPresentation="combined"
      onPositionPresentationChange={() => undefined}
    />);
    expect(authorableCombined).toContain('aria-label="Separate dimensions"');
  });

  it("projects text resizing and the project-global canvas size beside the tabs", () => {
    const html = renderToStaticMarkup(<PropertyPanel
      elementType="text"
      textSizingMode="auto-height"
      availableTextSizingModes={["auto-width", "auto-height", "fixed-size"]}
      onTextSizingModeChange={() => undefined}
      projectWidth={1920}
      projectHeight={1080}
      onProjectCanvasSizeChange={() => undefined}
      onCustomProjectCanvasSizeRequest={() => undefined}
    />);
    // Text resizing renders as a segmented control (group + one button per mode),
    // not a dropdown: the group carries the "Text resizing" label and the active
    // mode is a pressed segment.
    expect(html).toContain('aria-label="Text resizing"');
    expect(html).toContain('data-composa-segmented-surface');
    expect(html).toMatch(/aria-pressed="true"[^>]*aria-label="Auto height"|aria-label="Auto height"[^>]*aria-pressed="true"/);
    expect(html).not.toContain('aria-label="Text resizing: Auto height"');
    // Owner ask: each segment renders an ICON, not a text label. The word
    // labels survive only as aria-labels (asserted above); no visible text.
    const fixedSegment = html.match(/<button[^>]*aria-label="Fixed size"[\s\S]*?<\/button>/)?.[0] ?? "";
    expect(fixedSegment).toContain("<svg");
    expect(fixedSegment).not.toMatch(/>Fixed size</);
    expect(html).not.toContain(">Auto width</span>");
    expect(html).not.toContain(">Auto height</span>");
    expect(html).not.toContain(">Fixed size</span>");
    // Owner ask (#460): each segment carries the specific refined glyph —
    //   auto-width  → arrow-from-a-line (arrow-right-from-line)
    //   auto-height → two vertical bars with a line between (columns-2)
    //   fixed-size  → a square with inner lines (grid-2x2)
    const widthSegment = html.match(/<button[^>]*aria-label="Auto width"[\s\S]*?<\/button>/)?.[0] ?? "";
    const heightSegment = html.match(/<button[^>]*aria-label="Auto height"[\s\S]*?<\/button>/)?.[0] ?? "";
    expect(widthSegment).toContain("lucide-arrow-right-from-line");
    expect(heightSegment).toContain("lucide-columns-2");
    expect(fixedSegment).toContain("lucide-grid-2x2");
    expect(html).toContain('aria-label="Project canvas size: HD 16:9"');
    expect(html).not.toContain("Composition canvas size");
  });

  it("keeps the Canvas section out of the project inspector (moved to the top-right control)", () => {
    const html = renderToStaticMarkup(<PropertyPanel
      mode="project"
      projectWidth={1920}
      projectHeight={1080}
      projectFrameRate={30}
      onProjectCanvasSizeChange={() => undefined}
      onProjectFrameRateChange={() => undefined}
    />);
    // No Canvas section, no Aspect ratio / inline Dimensions rows in the body …
    expect(html).not.toContain(">Canvas</span>");
    expect(html).not.toContain(">Aspect ratio</span>");
    expect(html).not.toContain(">Dimensions</span>");
    // … but the canvas-size + frame-rate control lives in the project header.
    expect(html).toContain('aria-label="Project canvas size: HD 16:9"');
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
    expect(html).toContain('data-icon-semantic="gap-horizontal"');
    expect(html).toContain('aria-label="Gap sizing mode: Fixed"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain("lucide-proposed-gap-horizontal");
    expect(html).not.toContain('aria-label="Gap settings"');
    const vertical = html.indexOf('aria-label="Vertical"');
    const horizontal = html.indexOf('aria-label="Horizontal"');
    const wrap = html.indexOf('aria-label="Wrap"');
    expect(vertical).toBeGreaterThan(-1);
    expect(vertical).toBeLessThan(horizontal);
    expect(horizontal).toBeLessThan(wrap);
    const freeform = html.indexOf('aria-label="Freeform"');
    expect(freeform).toBeGreaterThan(-1);
    expect(freeform).toBeLessThan(vertical);
    expect(html.match(/aria-label="Auto-layout settings"/g)).toHaveLength(1);
    expect(html).toContain('data-icon-semantic="layout-freeform"');
    // Wrap remains a Wrap *mode* (DEC-008: not a Grid document mode) but the
    // flow cell adopts the grid glyph per owner direction (#459).
    expect(html).toContain('data-icon-semantic="layout-wrap"');
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
    expect(html).toContain("lucide-proposed-gap-vertical");
    expect(html).toContain('data-icon-semantic="gap-vertical"');
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
    // Wrap cell uses the grid glyph (grid visual treatment) while staying Wrap.
    expect(html).toContain('data-icon-semantic="layout-wrap"');
  });
});

describe("Smart-selection spacing placement", () => {
  it("places spacing below Dimensions inside the existing Layout section", () => {
    const html = renderToStaticMarkup(<PropertyPanel
      elementType="shape"
      width={120}
      height={80}
      spatialSelectionLayout={{ axis: "x", gap: 24, onGapChange: () => undefined, onAddAutoLayout: () => undefined }}
    />);

    expect(html.match(/>Layout<\/span>/g)).toHaveLength(1);
    expect(html).not.toContain(">Selection layout</span>");
    expect(html.indexOf(">Dimensions</span>")).toBeLessThan(html.indexOf(">Spacing</span>"));
    expect(html).toContain('aria-label="Horizontal spacing gap"');
    expect(html).toContain("lucide-proposed-gap-horizontal");
    expect(html).toContain(">Add auto layout</span>");
  });
});

describe("Inspector fidelity semantics", () => {
  it("renders stateless axis-correct alignment actions and the exact positioning and rotation semantics", () => {
    const html = renderToStaticMarkup(<PropertyPanel
      elementType="text"
      layout={{
        mode: "none",
        gap: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        align: "mc",
        widthMode: "fixed",
        heightMode: "fixed",
        clipsContent: false,
        positioning: "auto",
        positioningApplicable: true,
      }}
      onLayoutChange={() => undefined}
    />);

    for (const semantic of ["align-left", "align-center-x", "align-right", "align-top", "align-center-y", "align-bottom"]) {
      expect(html).toContain(`data-icon-semantic="${semantic}"`);
    }
    const alignment = html.match(/>Alignment<\/span>[\s\S]*?>Position<\/span>/)?.[0] ?? "";
    expect(alignment).not.toContain("bg-c-bg-selected");
    expect(html).toContain('aria-label="Ignore auto layout"');
    expect(html).toContain('data-icon-semantic="absolute-position"');
    expect(html).toContain('data-icon-semantic="rotation"');
    expect(html).toContain("lucide-flip-horizontal-2");
    expect(html).toContain("lucide-flip-vertical-2");
  });

  it("uses outlined blend, SquarePlay video, and semantic auto-layout spacing icons", () => {
    const element = renderToStaticMarkup(<PropertyPanel elementType="shape" blendMode="Normal" />);
    const blend = element.match(/<svg[^>]*data-icon-semantic="blend-mode"[^>]*>/)?.[0] ?? "";
    expect(blend).toContain('fill="none"');
    expect(element).not.toContain("BlendDroplet");

    const slide = renderToStaticMarkup(<PropertyPanel mode="slide" slideBackgroundType="video" />);
    expect(slide).toContain('data-icon-semantic="fill-video"');
    expect(slide).toContain("lucide-square-play");

    const auto = renderToStaticMarkup(<PropertyPanel elementType="frame-auto" layout={{
      mode: "horizontal",
      gap: 12,
      padding: { top: 4, right: 8, bottom: 12, left: 16 },
      align: "mc",
      widthMode: "fixed",
      heightMode: "fixed",
      clipsContent: false,
    }} />);
    for (const semantic of ["gap-horizontal", "padding-top", "padding-right", "padding-bottom", "padding-left"]) {
      expect(auto).toContain(`data-icon-semantic="${semantic}"`);
    }
    expect(auto).toContain("lucide-square-square");
  });

  it("orders effect content before visibility and removal actions", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="shape" effects={[{ id: "shadow", type: "Drop shadow", visible: true }]} />);
    const content = html.indexOf("Drop shadow");
    const eye = html.indexOf('aria-label="Hide effect"');
    const remove = html.indexOf('aria-label="Remove effect"');
    expect(content).toBeLessThan(eye);
    expect(eye).toBeLessThan(remove);
  });
});
