import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Timeline } from "./Timeline";

/**
 * One selection convention across every lane (Composa#656).
 *
 * Audio clips turned blue when clicked. Video clips changed only their border,
 * and composition bars had no `selected` concept at all — clicking one updated
 * the inspector while the bar itself never moved, so there was no visual
 * confirmation of what was selected.
 *
 * Every assertion is scoped to the BAR, found by its aria-label. A first version
 * searched the whole timeline markup and passed on both the positive AND the
 * negative cases, because `bg-c-bg-brand` appears elsewhere in the timeline no
 * matter what is selected. Whole-markup matching proves nothing here.
 *
 * The shared tokens are asserted rather than a hex, so a token change moves all
 * three lanes together instead of silently splitting them apart again.
 */
const SELECTED_BORDER = "border-c-border-selected-strong";
const SELECTED_FILL = "bg-c-bg-brand";

const render = (props: Record<string, unknown>) =>
  renderToStaticMarkup(<Timeline mode="master" duration={10_000} {...props} />);

/** The class attribute of the bar carrying this aria-label. */
function barClass(markup: string, label: string): string {
  const tag = new RegExp(`<div[^>]*aria-label="${label}"[^>]*>`).exec(markup)?.[0];
  if (!tag) throw new Error(`no bar labelled "${label}" in the markup`);
  return /class="([^"]*)"/.exec(tag)?.[1] ?? "";
}

function trimClass(markup: string, edge: "start" | "end", label: string): string {
  const tag = new RegExp(`<span[^>]*aria-label="Trim ${edge} of ${label}"[^>]*>`).exec(markup)?.[0];
  if (!tag) throw new Error(`no ${edge} trim handle for "${label}" in the markup`);
  return /class="([^"]*)"/.exec(tag)?.[1] ?? "";
}

const lanes: [string, string, (selected: boolean) => Record<string, unknown>][] = [
  ["audio clip", "vo", selected => ({ audioClips: [{ id: "a", name: "vo", range: [0, 1000], selected }] })],
  ["composition bar", "Intro", selected => ({ blocks: [{ id: "s1", name: "Intro", range: [0, 4000], selected }] })],
  ["video clip", "shot", selected => ({ baseClips: [{ id: "c1", name: "shot", range: [0, 4000], selected }] })],
];

describe.each(lanes)("%s", (_lane, label, props) => {
  it("shows the shared selected treatment when selected", () => {
    const cls = barClass(render(props(true)), label);
    expect(cls).toContain(SELECTED_BORDER);
    expect(cls).toContain(SELECTED_FILL);
  });

  it("shows neither when not selected", () => {
    const cls = barClass(render(props(false)), label);
    expect(cls).not.toContain(SELECTED_BORDER);
    expect(cls).not.toContain(SELECTED_FILL);
  });
});

describe("selection and active are different things", () => {
  it("an active composition is not styled as selected", () => {
    // Active follows the editing context; selection follows the click. Conflating
    // them would make the bar lie about which one the user acted on.
    const cls = barClass(render({ blocks: [{ id: "s1", name: "Intro", range: [0, 4000], active: true }] }), "Intro");
    expect(cls).not.toContain(SELECTED_FILL);
  });

  it("selection wins when a composition is both", () => {
    const cls = barClass(render({ blocks: [{ id: "s1", name: "Intro", range: [0, 4000], active: true, selected: true }] }), "Intro");
    expect(cls).toContain(SELECTED_FILL);
  });
});

describe("composition trim handles", () => {
  it("renders both grips white on the selected blue bar", () => {
    const markup = render({ blocks: [{ id: "s1", name: "Intro", range: [0, 4000], selected: true }] });
    for (const edge of ["start", "end"] as const) {
      expect(trimClass(markup, edge, "Intro")).toContain("bg-white");
      expect(trimClass(markup, edge, "Intro")).not.toContain("bg-c-icon-secondary");
    }
  });

  it.each([
    ["neutral", {}],
    ["active", { active: true }],
  ])("keeps %s bar grips secondary gray", (_state, state) => {
    const markup = render({ blocks: [{ id: "s1", name: "Intro", range: [0, 4000], ...state }] });
    for (const edge of ["start", "end"] as const) {
      expect(trimClass(markup, edge, "Intro")).toContain("bg-c-icon-secondary");
      expect(trimClass(markup, edge, "Intro")).not.toContain("bg-white");
    }
  });
});

/**
 * Composa#661 reverses the earlier "keep the thumbnail, tint the scrim" special case.
 * The owner: "I don't see them in the UI today and even if they were there I don't
 * think changing the color of the element has any adverse effect." So a thumbnail no
 * longer buys a video clip an exemption from the shared selected treatment.
 */
describe("a selected video clip with a thumbnail", () => {
  const markup = () => render({ baseClips: [{ id: "c1", name: "shot", range: [0, 4000], thumbnail: "blob:x", selected: true }] });

  it("takes the same solid fill as every other selected bar", () => {
    const cls = barClass(markup(), "shot");
    expect(cls).toContain(SELECTED_BORDER);
    expect(cls).toContain(SELECTED_FILL);
  });

  it("drops the thumbnail background so the fill is not a tint over the frame", () => {
    // Scoped to the bar's own tag: `blob:x` would still appear in the markup if any
    // OTHER element referenced it, and the scrim regression lived in this one style.
    const tag = /<div[^>]*aria-label="shot"[^>]*>/.exec(markup())?.[0];
    expect(tag).toBeDefined();
    expect(tag).not.toContain("blob:x");
    expect(tag).not.toContain("color-mix");
  });

  it("renders the thumbnail as leading content, never as the unselected bar fill", () => {
    const html = render({ baseClips: [{ id: "c1", name: "shot", range: [0, 4000], thumbnail: "blob:x" }] });
    const tag = /<div[^>]*aria-label="shot"[^>]*>/.exec(html)?.[0];
    expect(tag).toContain("bg-c-bg-secondary");
    expect(tag).not.toContain("background-image");
    expect(html).toContain('data-timeline-clip-thumbnail="true"');
    expect(html).toContain('src="blob:x"');
  });
});
