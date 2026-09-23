import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { EditorShell } from "./EditorShell";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

function render(el: ReactElement): ReactTestRenderer {
  let r!: ReactTestRenderer;
  act(() => {
    r = create(el);
  });
  return r;
}

const regionsOf = (r: ReactTestRenderer): string[] =>
  r.root
    .findAll(n => typeof n.type === "string" && n.props["data-editor-region"] != null)
    .map(n => n.props["data-editor-region"] as string);

describe("EditorShell", () => {
  it("is a labelled application landmark that lays regions out in reading order", () => {
    const r = render(
      <EditorShell
        aria-label="Composa editor"
        navRail={<div>NAV</div>}
        leftPanel={<div>LEFT</div>}
        canvas={<div>CANVAS</div>}
        inspector={<div>INSPECT</div>}
        timeline={<div>TIME</div>}
      />,
    );
    const app = r.root.find(n => n.props.role === "application");
    expect(app.props["aria-label"]).toBe("Composa editor");
    expect(regionsOf(r)).toEqual(["navRail", "leftPanel", "canvas", "inspector", "timeline"]);
  });

  it("stays document-agnostic: omitting the timeline drops only that region, nothing else moves", () => {
    const r = render(
      <EditorShell
        navRail={<div>NAV</div>}
        leftPanel={<div>LEFT</div>}
        canvas={<div>CANVAS</div>}
        inspector={<div>INSPECT</div>}
      />,
    );
    // A doc editor reuses the same shell with no timeline; the workspace regions
    // are untouched and in the same order.
    expect(regionsOf(r)).toEqual(["navRail", "leftPanel", "canvas", "inspector"]);
    expect(r.root.findAll(n => n.props["data-editor-region"] === "timeline")).toHaveLength(0);
  });

  it("swap test: replacing one region's content leaves the other regions' slots in place", () => {
    const shell = (inspector: ReactElement) => (
      <EditorShell canvas={<div>CANVAS</div>} inspector={inspector} timeline={<div>TIME</div>} />
    );
    const before = regionsOf(render(shell(<div>DESIGN</div>)));
    const after = regionsOf(render(shell(<div>ANIMATE</div>)));
    expect(after).toEqual(before);
    expect(after).toEqual(["canvas", "inspector", "timeline"]);
  });

  it("owns the overlay collision boundary by default, and yields it when asked", () => {
    const withBoundary = render(<EditorShell canvas={<div>C</div>} />);
    expect(
      withBoundary.root.findAll(n => n.props["data-composa-overlay-boundary"] != null),
    ).toHaveLength(1);

    const without = render(<EditorShell canvas={<div>C</div>} overlayBoundary={false} />);
    expect(
      without.root.findAll(n => n.props["data-composa-overlay-boundary"] != null),
    ).toHaveLength(0);
  });

  it("grows only the canvas region; rails and panels keep their intrinsic width", () => {
    const r = render(
      <EditorShell navRail={<div>N</div>} canvas={<div>C</div>} inspector={<div>I</div>} />,
    );
    const region = (name: string) =>
      r.root.find(n => typeof n.type === "string" && n.props["data-editor-region"] === name);
    expect(region("canvas").props.className).toContain("flex-1");
    expect(region("navRail").props.className).toContain("shrink-0");
    expect(region("inspector").props.className).toContain("shrink-0");
  });
});
