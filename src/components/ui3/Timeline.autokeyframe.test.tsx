import { act, create } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { Timeline } from "./Timeline";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The owner has corrected this glyph once already: the auto-keyframe / record entry
// point is `diamond-circle` (lucide#4615, vendored in src/icons/proposed-lucide),
// NOT the plain `circle` it shipped with. Assert the class lucide stamps on the svg,
// scoped to the button, so a regression back to `Circle` — or to any other glyph —
// goes red here rather than only in a screenshot.
function autoKeyframeIcon(armed: boolean): { classes: string[]; hasDirectCircleChild: boolean } {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Timeline height={220} duration={2_000} autoKeyframe={armed} onAutoKeyframeChange={() => undefined} />,
    );
  });
  const buttons = renderer!.root.findAll(
    node => node.type === "button" && node.props["aria-label"] === "Auto-keyframe",
  );
  // Assert the container first — a missing button would make every absence below vacuous.
  expect(buttons).toHaveLength(1);
  const svg = buttons[0].findByType("svg");
  // Split into TOKENS. A substring match cannot tell `fill-current` (fills the whole svg,
  // so the closed diamond path goes solid and swallows the circle) apart from
  // `[&>circle]:fill-current` (fills the inner dot only) — the former CONTAINS the latter's
  // tail, so `toContain("fill-current")` stays green on exactly the regression we are guarding.
  const classes = String(svg.props.className ?? "").split(/\s+/).filter(Boolean);
  // The armed variant is keyed on the ELEMENT NAME `circle` as a DIRECT child of the svg.
  // Pin that the glyph really renders one, or the selector would have no target and the
  // armed state would silently render with no fill at all.
  const hasDirectCircleChild = (svg.props.children as unknown[])
    .flat(Infinity)
    .some(child => !!child && typeof child === "object" && (child as { type?: unknown }).type === "circle");
  act(() => renderer!.unmount());
  return { classes, hasDirectCircleChild };
}

function autoKeyframeIconClass(armed: boolean): string {
  return autoKeyframeIcon(armed).classes.join(" ");
}

describe("Timeline auto-keyframe entry point (LT-1)", () => {
  it.each([false, true])("renders the diamond-circle glyph, armed=%s", armed => {
    const className = autoKeyframeIconClass(armed);

    expect(className).toContain("lucide-proposed-diamond-circle");
    // `lucide-circle` is the plain-circle class; `lucide-proposed-diamond-circle`
    // does not contain it, so this genuinely excludes the glyph we replaced.
    expect(className).not.toContain("lucide-circle");
  });

  // Owner's answer on the LT-1 follow-on: "in the fill state of the shape only the circle
  // should be filled". A bare `fill-current` is CSS and therefore beats lucide's
  // `fill="none"` PRESENTATION attribute for both children, so the closed diamond path
  // fills solid and the circle vanishes into it — verified in a real browser, not inferred.
  it("fills ONLY the inner circle when armed, never the whole glyph", () => {
    const armed = autoKeyframeIcon(true);

    expect(armed.hasDirectCircleChild).toBe(true);
    expect(armed.classes).toContain("[&>circle]:fill-current");
    // Exact-token absence: this is the assertion that goes red on a regression back to a
    // whole-svg fill, which a substring check could not catch.
    expect(armed.classes).not.toContain("fill-current");
  });

  it("applies no fill at all when idle", () => {
    const idle = autoKeyframeIcon(false);

    expect(idle.hasDirectCircleChild).toBe(true);
    expect(idle.classes).not.toContain("fill-current");
    expect(idle.classes).not.toContain("[&>circle]:fill-current");
  });
});
