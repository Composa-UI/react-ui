import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { Inspector } from "./Inspector";
import { PanelSection } from "./Panel";

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

describe("Inspector", () => {
  it("is a labelled complementary landmark with a fixed header and composed sections", () => {
    const r = render(
      <Inspector aria-label="Design inspector" header={<div>HEADER</div>}>
        <PanelSection title="Position">
          <div>POS</div>
        </PanelSection>
        <PanelSection title="Fill">
          <div>FILL</div>
        </PanelSection>
      </Inspector>,
    );
    const landmark = r.root.find(n => n.props.role === "complementary");
    expect(landmark.props["aria-label"]).toBe("Design inspector");
    const json = JSON.stringify(r.toJSON());
    expect(json).toContain("HEADER");
    expect(json).toContain("Position");
    expect(json).toContain("Fill");
    expect(json.indexOf("Position")).toBeLessThan(json.indexOf("Fill"));
  });

  it("renders exactly the sections given, in order — reordering children reorders the inspector", () => {
    const r = render(
      <Inspector>
        <PanelSection title="Fill" />
        <PanelSection title="Position" />
      </Inspector>,
    );
    const json = JSON.stringify(r.toJSON());
    expect(json.indexOf("Fill")).toBeLessThan(json.indexOf("Position"));
  });
});
