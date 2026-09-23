import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { TabPanel } from "./Tabs";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function render(el: ReactElement): ReactTestRenderer {
  let r!: ReactTestRenderer;
  act(() => {
    r = create(el);
  });
  return r;
}

describe("TabPanel", () => {
  it("wires ARIA to its controlling tab and shows content when active", () => {
    const r = render(
      <TabPanel panelId="design" active>
        Design body
      </TabPanel>,
    );
    const panel = r.root.findByType("div");
    expect(panel.props.role).toBe("tabpanel");
    expect(panel.props.id).toBe("design");
    // The controlling tab renders id={`${panelId}-tab`}; this panel points back at it.
    expect(panel.props["aria-labelledby"]).toBe("design-tab");
    expect(panel.props.hidden).toBe(false);
    expect(panel.props.tabIndex).toBe(0);
    expect(JSON.stringify(r.toJSON())).toContain("Design body");
  });

  it("is hidden, out of tab order, and empty when inactive", () => {
    const r = render(
      <TabPanel panelId="design" active={false}>
        Design body
      </TabPanel>,
    );
    const panel = r.root.findByType("div");
    expect(panel.props.hidden).toBe(true);
    expect(panel.props.tabIndex).toBe(-1);
    expect(JSON.stringify(r.toJSON())).not.toContain("Design body");
  });
});
