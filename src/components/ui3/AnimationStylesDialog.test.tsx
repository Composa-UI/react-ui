import { renderToStaticMarkup } from "react-dom/server";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AnimationStylesDialog, type AnimationStyleGroup } from "./AnimationStylesDialog";

// Passthrough the anchored primitive so this file asserts the dialog's OWN content
// contract (header/search/filter/list/selection) and the placement props it forwards.
// The captured-anchor / collision / focus-return behavior of the shared overlay is
// exercised against the real chain in AnimationStylesDialog.anchored.test.tsx.
vi.mock("./InspectorDialog", () => ({
  COMPACT_INSPECTOR_DIALOG_WIDTH: 240,
  InspectorDialog: ({ ariaLabel, width, elevation, trigger, children }: {
    ariaLabel: string; width?: number; elevation?: number; trigger: ReactElement; children: ReactNode;
  }) => <div data-inspector-dialog={ariaLabel} data-width={width} data-elevation={elevation}>{trigger}{children}</div>,
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const IN_GROUPS: AnimationStyleGroup[] = [
  { label: "Basic", options: [
    { value: "fade-in", label: "Fade In" },
    { value: "move-in", label: "Move In" },
    { value: "slide-in", label: "Slide In" },
  ] },
];

const MULTI_GROUPS: AnimationStyleGroup[] = [
  { label: "Basic", options: [{ value: "move", label: "Move" }, { value: "scale", label: "Scale" }] },
  { label: "Emphasis", options: [{ value: "pulse", label: "Pulse" }, { value: "shake", label: "Shake" }] },
];

const trigger = <button type="button">Style</button>;

describe("AnimationStylesDialog — content + placement contract", () => {
  it("uses the shared 240px / elevation-400 inspector dialog and labels it by title", () => {
    const html = renderToStaticMarkup(
      <AnimationStylesDialog open onClose={() => undefined} trigger={trigger} title="Build in styles" groups={IN_GROUPS} value="fade-in" onSelect={() => undefined} />,
    );
    expect(html).toContain('data-inspector-dialog="Build in styles"');
    expect(html).toContain('data-width="240"');
    expect(html).toContain('data-elevation="400"');
  });

  it("renders the title, every group header, and every option label", () => {
    const html = renderToStaticMarkup(
      <AnimationStylesDialog open onClose={() => undefined} trigger={trigger} title="Build in styles" groups={IN_GROUPS} value="fade-in" onSelect={() => undefined} />,
    );
    expect(html).toContain("Build in styles");
    expect(html).toContain("Basic");
    expect(html).toContain("Fade In");
    expect(html).toContain("Move In");
    expect(html).toContain("Slide In");
    expect(html).toContain('aria-label="Search animation styles"');
    expect(html).toContain('aria-label="Close"');
  });

  it("marks exactly the applied option as pressed", () => {
    const html = renderToStaticMarkup(
      <AnimationStylesDialog open onClose={() => undefined} trigger={trigger} groups={IN_GROUPS} value="move-in" onSelect={() => undefined} />,
    );
    expect((html.match(/aria-pressed="true"/g) ?? []).length).toBe(1);
    expect((html.match(/aria-pressed="false"/g) ?? []).length).toBe(2);
  });

  it("shows the category filter only when more than one capability-truthful group exists", () => {
    const single = renderToStaticMarkup(
      <AnimationStylesDialog open onClose={() => undefined} trigger={trigger} groups={IN_GROUPS} onSelect={() => undefined} />,
    );
    expect(single).not.toContain('aria-label="Filter by category"');

    const multi = renderToStaticMarkup(
      <AnimationStylesDialog open onClose={() => undefined} trigger={trigger} groups={MULTI_GROUPS} onSelect={() => undefined} />,
    );
    expect(multi).toContain('aria-label="Filter by category"');
    expect(multi).toContain("Emphasis");
  });

  it("renders only the groups and options it is given — no inert design-only rows", () => {
    const html = renderToStaticMarkup(
      <AnimationStylesDialog open onClose={() => undefined} trigger={trigger} groups={IN_GROUPS} onSelect={() => undefined} />,
    );
    // Action-roster entries the engine does not yet support are absent unless supplied.
    expect(html).not.toContain("Opacity");
    expect(html).not.toContain("Rotate");
    expect(html).not.toContain("Bounce");
  });

  it("emits the chosen style value on selection", () => {
    const chosen: string[] = [];
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(
        <AnimationStylesDialog open onClose={() => undefined} trigger={trigger} groups={IN_GROUPS} value="fade-in" onSelect={value => chosen.push(value)} />,
      );
    });
    const move = renderer!.root.findAll(node => node.type === "button" && node.props["aria-pressed"] === false)
      .find(button => button.props.onClick);
    act(() => move!.props.onClick());
    expect(chosen).toEqual(["move-in"]);
    act(() => renderer!.unmount());
  });

  it("filters the list by the search query and shows an empty state when nothing matches", () => {
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(
        <AnimationStylesDialog open onClose={() => undefined} trigger={trigger} groups={IN_GROUPS} onSelect={() => undefined} />,
      );
    });
    const search = renderer!.root.findByProps({ "aria-label": "Search animation styles" });

    act(() => search.props.onChange({ target: { value: "slide" } }));
    let labels = renderer!.root.findAll(node => node.type === "button" && node.props["aria-pressed"] !== undefined);
    expect(labels).toHaveLength(1);

    act(() => search.props.onChange({ target: { value: "zzz" } }));
    labels = renderer!.root.findAll(node => node.type === "button" && node.props["aria-pressed"] !== undefined);
    expect(labels).toHaveLength(0);
    expect(renderer!.root.findAll(node => typeof node.children?.[0] === "string" && node.children[0] === "No results")).toHaveLength(1);
    act(() => renderer!.unmount());
  });

  it("closes through the header affordance", () => {
    const onClose = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(
        <AnimationStylesDialog open onClose={onClose} trigger={trigger} groups={IN_GROUPS} onSelect={() => undefined} />,
      );
    });
    const close = renderer!.root.findByProps({ "aria-label": "Close" });
    act(() => close.props.onClick());
    expect(onClose).toHaveBeenCalledOnce();
    act(() => renderer!.unmount());
  });
});
