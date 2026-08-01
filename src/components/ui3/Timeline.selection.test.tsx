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

describe("a selected video clip keeps its thumbnail", () => {
  it("tints the scrim rather than painting over the frame", () => {
    const markup = render({ baseClips: [{ id: "c1", name: "shot", range: [0, 4000], thumbnail: "blob:x", selected: true }] });
    // The image must survive selection — it is the only thing distinguishing one
    // clip from another at a glance, so a solid fill would be a regression
    // dressed up as consistency.
    expect(markup).toContain("blob:x");
    expect(markup).toContain("--color-c-bg-brand");
    // …and with an image present the bar must NOT take the solid fill.
    expect(barClass(markup, "shot")).not.toContain(SELECTED_FILL);
  });
});
