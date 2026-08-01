import { act, create } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { Timeline } from "./Timeline";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The owner has corrected this glyph once already: the auto-keyframe / record entry
// point is `diamond-circle` (lucide#4615, vendored in src/icons/proposed-lucide),
// NOT the plain `circle` it shipped with. Assert the class lucide stamps on the svg,
// scoped to the button, so a regression back to `Circle` — or to any other glyph —
// goes red here rather than only in a screenshot.
function autoKeyframeIconClass(armed: boolean): string {
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
  const className = String(buttons[0].findByType("svg").props.className);
  act(() => renderer!.unmount());
  return className;
}

describe("Timeline auto-keyframe entry point (LT-1)", () => {
  it.each([false, true])("renders the diamond-circle glyph, armed=%s", armed => {
    const className = autoKeyframeIconClass(armed);

    expect(className).toContain("lucide-proposed-diamond-circle");
    // `lucide-circle` is the plain-circle class; `lucide-proposed-diamond-circle`
    // does not contain it, so this genuinely excludes the glyph we replaced.
    expect(className).not.toContain("lucide-circle");
  });

  it("keeps the armed fill treatment on the swapped glyph", () => {
    expect(autoKeyframeIconClass(true)).toContain("fill-current");
    expect(autoKeyframeIconClass(false)).not.toContain("fill-current");
  });
});
