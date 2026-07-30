import { type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { NavRail } from "./NavRail";
import { LayerList } from "./LayerList";
import { SlidesPanel } from "./SlidesPanel";
import { MenuRow, PopoverMenu } from "./Menu";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Render the PopoverMenu's render-prop children without mounting the Radix
// portal, capturing the `close` callback so we can assert it fires on select.
function menuRows(popover: ReactTestInstance, close: () => void) {
  const menu = popover.props.children(close) as ReactElement<{
    children: ReactElement<{ label: string; onClick: () => void }> | ReactElement<{ label: string; onClick: () => void }>[];
  }>;
  const kids = menu.props.children;
  return Array.isArray(kids) ? kids : [kids];
}

describe("NavRail / left-panel divider alignment (Composa#622)", () => {
  // The rail's brand slot must be the SAME height as the header of whichever
  // left-column panel it is showing, so the rail's divider and the panel's header
  // rule land on one baseline instead of reading as two disconnected surfaces.
  // 40px is the DS panel-header standard shared by SlidesPanel / CompositionPanel,
  // LayerList, AssetsPanel and AgentPanel.
  const PANEL_HEADER_H = "h-[40px]";

  it("pins the brand slot to the 40px DS panel-header height", () => {
    const html = renderToStaticMarkup(<NavRail />);
    const brandSlot = html.slice(0, html.indexOf('aria-label="Composa"'));

    expect(brandSlot).toContain(PANEL_HEADER_H);
    // The old 8px padding around the 32px mark pushed the divider to 48px.
    expect(brandSlot).not.toContain("py-[8px]");
  });

  it("keeps the same 40px header on the panels the rail sits beside", () => {
    for (const markup of [renderToStaticMarkup(<SlidesPanel slides={[]} />), renderToStaticMarkup(<LayerList />)]) {
      expect(markup).toContain(PANEL_HEADER_H);
    }
  });
});

describe("NavRail back-to-files affordance", () => {
  it("opens a single 'Back to Files' menu action that fires the callback", () => {
    const calls: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<NavRail onBackToFiles={() => calls.push("back")} />); });

    const popover = renderer!.root.findByType(PopoverMenu);
    // brand button is the direct trigger and advertises a menu popup
    expect(renderer!.root.findByProps({ "aria-label": "Composa" }).props["aria-haspopup"]).toBe("menu");

    let closed = false;
    const rows = menuRows(popover, () => { closed = true; }).filter(r => r.type === MenuRow);
    expect(rows).toHaveLength(1);
    expect(rows[0].props.label).toBe("Back to Files");

    act(() => rows[0].props.onClick());
    expect(calls).toEqual(["back"]);
    expect(closed).toBe(true);

    act(() => renderer!.unmount());
  });

  it("stays inert with no menu when onBackToFiles is omitted", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<NavRail />); });

    expect(renderer!.root.findAllByType(PopoverMenu)).toHaveLength(0);
    const brand = renderer!.root.findByProps({ "aria-label": "Composa" });
    expect(brand.props["aria-haspopup"]).toBeUndefined();

    act(() => renderer!.unmount());
  });
});
