import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getSizingMenuLabels, PropertyPanel, reconcileAutoLayoutGap } from "./PropertyPanel";
import { PANEL_W } from "./Panel";
import { TooltipProvider } from "./Tooltip";

describe("Timeline easing inspector composition", () => {
  it("labels a host-owned Animate-card target without inventing an engine scope", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="text" easingContext="segment"
      easing={{ preset: "custom", controlPoints: [0.2, 0, 0.8, 1], editable: true }}
      easingApplyToLabel="This animation" onEasingChange={() => undefined} />);
    expect(html).toContain("This animation");
    expect(html).toContain('aria-label="Apply easing to"');
    expect(html).toContain("disabled");
  });

  it("renders segment easing as the only Design inspector section", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="text" easingContext="segment"
      easing={{ preset: "custom", controlPoints: [0.2, 0, 0.8, 1], editable: true }}
      onEasingChange={() => undefined} />);
    expect(html).toContain(">Easing</span>");
    expect(html).not.toContain(">Position</span>");
    expect(html).not.toContain(">Appearance</span>");
  });

  it("renders a transition curve as the only slide Design inspector section", () => {
    const html = renderToStaticMarkup(<PropertyPanel mode="slide" easingContext="segment"
      easing={{ preset: "custom", controlPoints: [0.34, 0, 1, 1], editable: true }}
      easingApplyToLabel="This transition" onEasingChange={() => undefined} />);
    expect(html).toContain("This transition");
    expect(html).toContain(">Easing</span>");
    expect(html).not.toContain("Composition name");
    expect(html).not.toContain(">Background</span>");
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
  it("renders independent solid paint color and opacity keyframe controls", () => {
    const control = { active: true, onToggle: () => undefined };
    const html = renderToStaticMarkup(<PropertyPanel elementType="shape"
      fills={[{ id: "fill", fillType: "solid", color: "#ff0000", opacity: 80, visible: true, keyframes: { color: control, opacity: control } }]}
      strokes={[{ id: "stroke", fillType: "solid", color: "#0000ff", opacity: 60, visible: true, weight: 2, align: "inside", weightMode: "custom", edgeWeights: { top: 1, right: 2, bottom: 3, left: 4 }, keyframes: { color: control, opacity: control, edgeWeights: { top: control, right: control, bottom: control, left: control } } }]} />);

    for (const label of ["Fill color color keyframe", "Fill color opacity keyframe", "Stroke color color keyframe", "Stroke color opacity keyframe", "Top stroke weight keyframe", "Right stroke weight keyframe", "Bottom stroke weight keyframe", "Left stroke weight keyframe"]) {
      expect(html).toContain(`aria-label="${label}"`);
    }
  });

  it("omits paint keyframe controls for unsupported gradient entries", () => {
    const control = { active: false, onToggle: () => undefined };
    const html = renderToStaticMarkup(<PropertyPanel elementType="shape"
      fills={[{ id: "gradient", fillType: "linear", color: "#ff0000", opacity: 80, visible: true, keyframes: { color: control, opacity: control } }]} />);
    expect(html).not.toContain("Fill color color keyframe");
    expect(html).not.toContain("Fill color opacity keyframe");
  });

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

  it("renders the host-owned scalar Corner radius keyframe control", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="shape" cornerRadius={12}
      keyframeControls={{ cornerRadius: { active: true, onToggle: () => undefined } }} />);

    expect(html).toContain('aria-label="Corner radius keyframe"');
    expect(html).toMatch(/aria-label="Corner radius keyframe"[^>]*aria-pressed="true"/);
  });

  it("projects four physical keyframe controls for independent corners without a scalar diamond", () => {
    const control = () => ({ active: false, onToggle: () => undefined });
    const topLeft = control(), topRight = control(), bottomRight = control(), bottomLeft = control();
    const html = renderToStaticMarkup(<PropertyPanel elementType="shape"
      cornerRadius={{ topLeft: 4, topRight: 8, bottomLeft: 12, bottomRight: 16 }}
      keyframeControls={{ cornerRadius: control(), cornerRadiusTopLeft: topLeft, cornerRadiusTopRight: topRight, cornerRadiusBottomRight: bottomRight, cornerRadiusBottomLeft: bottomLeft }} />);

    expect(html).not.toContain('aria-label="Corner radius keyframe"');
    for (const label of ["Top-left", "Top-right", "Bottom-right", "Bottom-left"]) {
      expect(html).toContain(`aria-label="${label} corner radius keyframe"`);
    }
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
  it("keeps project video export disabled and shows Present as a split button while presenting", () => {
    const html = renderToStaticMarkup(<TooltipProvider><PropertyPanel mode="project" previewPlaying /></TooltipProvider>);

    // #575 (redo): Present is the primary segment of a split button. While
    // presenting it carries the Pause icon; the name lives on aria-label.
    expect(html).toContain('class="lucide lucide-pause"');
    expect(html).toContain('aria-label="Pause presentation"');
    // The chevron segment advertises the menu it opens.
    expect(html).toContain('aria-label="Present and preview options"');
    expect(html).toMatch(/aria-label="Present and preview options"[^>]*aria-haspopup="menu"/);
    // Menu is closed in static markup, so its rows are not present yet.
    expect(html).not.toContain(">Preview</span>");
    // The other side of the same gate: no `onShare`, no Share trigger. Asserted
    // only AFTER the cluster above is proven to have rendered, so this cannot
    // pass vacuously on an empty tree.
    expect(html).not.toMatch(/<button[^>]*><span>Share<\/span><\/button>/);
    expect(html).toContain('tabindex="0" aria-label="Project video format unavailable: Video export coming soon"');
    expect(html).toContain('tabindex="0" aria-label="Export project unavailable: Video export coming soon"');
    expect(html).toContain('aria-label="Project video format"');
    expect(html).toMatch(/aria-label="Project video format"[^>]*disabled=""/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*><span>Export project<\/span>/);
  });

  it("renders Present as a split button (primary Present + chevron menu) with Share beside it", () => {
    // #575 (redo): Present/Preview is a SPLIT BUTTON that opens a menu — the same
    // pattern the creation toolbar uses. Present is the primary segment; the
    // chevron opens a Present/Preview menu. Preview stays capability-gated inside
    // that menu (asserted via interaction tests). Share is a SEPARATE button.
    const plain = renderToStaticMarkup(<TooltipProvider><PropertyPanel mode="project" onPreviewToggle={() => undefined} /></TooltipProvider>);
    // Primary Present segment: Play icon + name on aria-label, no visible text.
    expect(plain).toContain('aria-label="Present"');
    expect(plain).toContain('class="lucide lucide-play"');
    // Chevron segment opens the menu; closed by default → aria-expanded=false.
    expect(plain).toContain('aria-label="Present and preview options"');
    expect(plain).toMatch(/aria-label="Present and preview options"[^>]*aria-haspopup="menu"/);
    expect(plain).toMatch(/aria-label="Present and preview options"[^>]*aria-expanded="false"/);
    // Menu closed → no rows, and no presence split without the capability.
    expect(plain).not.toContain(">Present</span>");
    expect(plain).not.toContain(">Preview</span>");
    expect(plain).not.toContain('aria-label="Presence and spotlight"');

    // With host-backed capabilities: Share stays a separate button beside the
    // split button, and presence exposes its own split.
    const enabled = renderToStaticMarkup(<TooltipProvider><PropertyPanel mode="project"
      onPreviewToggle={() => undefined}
      onPreviewOpen={() => undefined}
      previewAvailable
      onShare={() => undefined}
      presenceControlsEnabled
      onAccountMenu={() => undefined}
      onPresenceMenu={() => undefined}
    /></TooltipProvider>);
    expect(enabled).toContain('aria-label="Present"');
    expect(enabled).toContain('aria-label="Present and preview options"');
    expect(enabled).toContain('aria-label="Presence and spotlight"');
    // Share is its own button beside the split group, not folded into it.
    // Scoped to the BUTTON element, not a bare substring of the whole tree: a
    // substring match would also be satisfied by the word appearing in a menu
    // row or a tooltip, so it could not tell "the Share trigger renders" from
    // "the string Share appears somewhere". This is the assertion that fails if
    // the trigger ever stops rendering while `onShare` is supplied.
    expect(enabled).toMatch(/<button[^>]*><span>Share<\/span><\/button>/);
  });

  it("disables only the primary Present segment when no present action is wired, keeping the chevron menu reachable (#575)", () => {
    // No handlers → the primary Present segment is a natively-disabled <button>
    // (capability gating), but the chevron segment stays operable so the menu —
    // where Preview lives with its disabled reason — is always reachable.
    const disabled = renderToStaticMarkup(<TooltipProvider><PropertyPanel mode="project" /></TooltipProvider>);
    expect(disabled).toContain('class="lucide lucide-play"');
    // Primary Present <button> is disabled.
    expect(disabled).toMatch(/<button[^>]*aria-label="Present"[^>]*disabled=""/);
    // Chevron is NOT disabled — it can still open the menu.
    const chevron = disabled.match(/<button[^>]*aria-label="Present and preview options"[^>]*>/)?.[0];
    expect(chevron).toBeTruthy();
    expect(chevron).not.toContain("disabled");

    // With a present handler wired, the primary Present segment is enabled.
    const enabled = renderToStaticMarkup(<TooltipProvider><PropertyPanel mode="project"
      onPreviewToggle={() => undefined}
      onPreviewOpen={() => undefined}
      previewAvailable
    /></TooltipProvider>);
    const present = enabled.match(/<button[^>]*aria-label="Present"[^>]*>/)?.[0];
    expect(present).toBeTruthy();
    expect(present).not.toContain("disabled");
  });

  it("keeps the whole multiplayer cluster contained within the inspector column (#575)", () => {
    // The inspector column is a fixed width, overflow-hidden; the cluster wrapper
    // is w-full min-w-0 so the split button + separate Share button stay visible
    // rather than overflowing/clipping.
    const html = renderToStaticMarkup(<TooltipProvider><PropertyPanel mode="project"
      onPreviewToggle={() => undefined}
      onShare={() => undefined}
    /></TooltipProvider>);
    // PANEL_W now sizes the column directly (RP-5) instead of via a w-[290px]
    // utility that only coincidentally agreed with the constant.
    expect(html).toContain(`style="width:${PANEL_W}px"`);
    expect(html).toMatch(/class="flex w-full min-w-0 items-center/);
    // Share button renders in the same contained cluster.
    expect(html).toMatch(/<button[^>]*><span>Share<\/span><\/button>/);
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
    // Owner ask: each segment carries the specific glyph he linked —
    //   auto-width  → arrow-from-a-line (arrow-right-from-line)
    //   auto-height → text bounded by two vertical rules (text-margins, lucide#4610)
    //   fixed-size  → a solid text box (square-text, lucide#4609)
    const widthSegment = html.match(/<button[^>]*aria-label="Auto width"[\s\S]*?<\/button>/)?.[0] ?? "";
    const heightSegment = html.match(/<button[^>]*aria-label="Auto height"[\s\S]*?<\/button>/)?.[0] ?? "";
    expect(widthSegment).toContain("lucide-arrow-right-from-line");
    expect(heightSegment).toContain("lucide-proposed-text-margins");
    expect(fixedSegment).toContain("lucide-proposed-square-text");
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
    const freeform = html.indexOf('aria-label="Freeform"');
    const vertical = html.indexOf('aria-label="Vertical"');
    const horizontal = html.indexOf('aria-label="Horizontal"');
    const grid = html.indexOf('aria-label="Grid"');
    expect(freeform).toBeGreaterThan(-1);
    expect(freeform).toBeLessThan(vertical);
    expect(vertical).toBeLessThan(horizontal);
    // Grid is the FOURTH flow segment (Composa#661), not a header side action.
    expect(horizontal).toBeLessThan(grid);
    expect(html).toContain('data-icon-semantic="layout-grid"');
    // Wrap is not a flow segment — it is a modifier, rendered after the segments.
    const wrap = html.indexOf('aria-label="Wrap"');
    expect(wrap).toBeGreaterThan(grid);
    expect(html).toContain('data-icon-semantic="layout-wrap"');
    expect(html.match(/aria-label="Auto-layout settings"/g)).toHaveLength(1);
    expect(html).toContain('data-icon-semantic="layout-freeform"');
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

  it("atomically restores the last numeric gap when enabling Wrap from Auto", () => {
    expect(reconcileAutoLayoutGap(true, "auto", 18)).toBe(18);
    expect(reconcileAutoLayoutGap(false, "auto", 18)).toBe("auto");
    expect(reconcileAutoLayoutGap(true, 12, 18)).toBe(12);
  });

  it("exposes a row gap field only while wrapping", () => {
    const plain = renderToStaticMarkup(<PropertyPanel elementType="frame-auto" layout={{ ...layout, wrap: false }} />);
    // Assert the row it lives in renders at all, so the absence below is real.
    expect(plain).toContain('role="group" aria-label="Alignment and gap"');
    expect(plain).not.toContain('aria-label="Row gap"');

    const wrapped = renderToStaticMarkup(<PropertyPanel elementType="frame-auto" layout={{ ...layout, wrap: true, rowGap: 24 }} />);
    expect(wrapped).toContain('aria-label="Row gap"');
    // Composa#661 item 2: the row gap no longer gets its own row beneath the
    // alignment block, and the unexplained link action beside it is gone.
    expect(wrapped).not.toContain('role="group" aria-label="Row gap"');
    expect(wrapped).not.toMatch(/aria-label="(Unlink|Link) item and row gap"/);
  });
});

describe("Plain-frame flow contract", () => {
  it("orders Freeform, Vertical, Horizontal, Grid and omits Wrap as a flow segment", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="frame" />);
    const freeform = html.indexOf('aria-label="Freeform"');
    const vertical = html.indexOf('aria-label="Vertical"');
    const horizontal = html.indexOf('aria-label="Horizontal"');
    const grid = html.indexOf('aria-label="Grid"');
    expect(freeform).toBeGreaterThan(-1);
    expect(freeform).toBeLessThan(vertical);
    expect(vertical).toBeLessThan(horizontal);
    expect(horizontal).toBeLessThan(grid);
    // A plain (non-auto-layout) frame has no Wrap control — wrap is a horizontal-only
    // modifier reached from the auto-layout section, not a flow segment here.
    expect(html).not.toContain('aria-label="Wrap"');
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
