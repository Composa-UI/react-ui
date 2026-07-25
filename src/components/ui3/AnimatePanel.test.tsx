import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ACTION_STYLE_OPTIONS, AnimatePanel, type ObjectAnimationItem } from "./AnimatePanel";

const ANIMS: ObjectAnimationItem[] = [
  { id: "a1", n: 1, name: "Title", kind: "In", duration: "0.6s", style: "fade-in", buildDuration: "600ms" },
  { id: "a2", n: 2, name: "Subtitle", kind: "In", duration: "0.4s", style: "slide-in", buildDuration: "400ms", direction: "left", selected: true },
  { id: "a3", n: 3, name: "Body", kind: "Action", duration: "0.5s", style: "pulse" },
];

// Composa-App/Composa#174
describe("AnimatePanel — Comp transition reflects the slide's real value (issue #174)", () => {
  it("shows the slide's real 'None' — not a phantom 'Fade' — when an element is selected", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="element" compTransition={{ style: "none", direction: "right", durationMs: 300, easing: "ease-out" }} anims={ANIMS} />,
    );
    expect(html).toContain(">None<");
    expect(html).not.toContain(">Fade<");
  });

  it("still reflects None even when compTransition is forwarded to an element (no internal demo fallback)", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="element" compTransition={{ style: "none", direction: "right", durationMs: 300, easing: "ease-out" }} anims={[]} />,
    );
    expect(html).not.toContain(">Fade<");
  });
});

describe("AnimatePanel — default card expansion follows selection type (issue #174)", () => {
  it("slide selection expands the Comp transition card by default", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="slide" compTransition={{ style: "push", direction: "right", durationMs: 500, easing: "ease-in-out" }} anims={ANIMS} />,
    );
    // Expanded Comp transition card renders the selection-blue header + the editable Style row.
    expect(html).toContain("bg-c-bg-selected");
    expect(html).toContain(">Push<");
    // No object-animation card is auto-expanded for a slide selection: the per-phase
    // body label ("Build in") only renders inside an expanded card.
    expect(html).not.toContain(">Build in<");
  });

  it("element selection expands that element's selected Object animation card by default", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="element" compTransition={{ style: "none", direction: "right", durationMs: 300, easing: "ease-out" }} anims={ANIMS} />,
    );
    // The selected anim (a2 "Subtitle", a build-in) is expanded → its phase body renders.
    expect(html).toContain(">Build in<");
    // And the slide-scoped Comp transition stays collapsed on None (not the focus card),
    // never the phantom 'Fade'.
    expect(html).toContain(">None<");
    expect(html).not.toContain(">Fade<");
  });
});

// Composa-App/Composa#179
describe("AnimatePanel — object-animations lead action is Play, gated like '+' (issue #179)", () => {
  // The play button is the first rightAction; capture just that <button> element.
  const playButton = (html: string) =>
    html.match(/<button[^>]*aria-label="Play all animations"[^>]*>/)?.[0] ?? "";

  it("renders a Play button (not the old 'Select object' control)", () => {
    const html = renderToStaticMarkup(<AnimatePanel selectionType="element" anims={ANIMS} />);
    expect(html).toContain('aria-label="Play all animations"');
    expect(html).not.toContain('aria-label="Select object"');
  });

  it("enables Play when there are animations to play", () => {
    const html = renderToStaticMarkup(<AnimatePanel selectionType="element" anims={ANIMS} />);
    expect(playButton(html)).not.toContain("disabled");
  });

  it("disables Play when there are no animations / no real selection (mirrors the '+' gate)", () => {
    const html = renderToStaticMarkup(<AnimatePanel selectionType="element" anims={[]} />);
    expect(playButton(html)).toContain("disabled");
  });
});

// Composa-App/Composa#365
describe("AnimatePanel — repeatable Add Action authoring", () => {
  const addActionButton = (html: string) => {
    const labelIndex = html.indexOf(">Add Action<");
    if (labelIndex < 0) return "";
    const start = html.lastIndexOf("<button", labelIndex);
    const end = html.indexOf("</button>", labelIndex);
    return start < 0 || end < 0 ? "" : html.slice(start, end + "</button>".length);
  };

  it("renders a dedicated Add Action affordance even when actions already exist", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="element" anims={ANIMS} addablePhases={["action"]} />,
    );
    expect(html).toContain(">Add Action<");
    expect(addActionButton(html)).not.toContain("disabled");
  });

  it("disables Add Action when the host has no selected element", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="slide" anims={ANIMS} addablePhases={[]} />,
    );
    expect(addActionButton(html)).toContain("disabled");
  });

  it("offers the canvas action families in the Action style picker", () => {
    expect(ACTION_STYLE_OPTIONS.slice(0, 4)).toEqual(["move", "opacity", "rotate", "scale"]);
  });
});

// Composa-App/Composa#222
describe("AnimatePanel — settings icon + delay gated behind the animationDelay capability (issue #222)", () => {
  it("hides the settings icon and the start/delay block by default (flag OFF)", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="element" compTransition={{ style: "none", direction: "right", durationMs: 300, easing: "ease-out" }} anims={ANIMS} />,
    );
    // No settings affordance on either card.
    expect(html).not.toContain('aria-label="Object animation settings"');
    expect(html).not.toContain('aria-label="Comp transition settings"');
    // No dangling "starts automatically" / delay authoring in the default path.
    expect(html).not.toContain(">Start<");
    expect(html).not.toContain(">Delay<");
  });

  it("restores the settings icon and the start/delay block when animationDelay is ON", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="element" animationDelay compTransition={{ style: "none", direction: "right", durationMs: 300, easing: "ease-out" }} anims={ANIMS} />,
    );
    expect(html).toContain('aria-label="Object animation settings"');
    expect(html).toContain('aria-label="Comp transition settings"');
    expect(html).toContain(">Start<");
    expect(html).toContain(">Delay<");
  });
});
