import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnimatePanel, type ObjectAnimationItem } from "./AnimatePanel";

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
    // Expanded Comp transition card renders the accent header + the editable Style row.
    expect(html).toContain("bg-accent/15");
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
