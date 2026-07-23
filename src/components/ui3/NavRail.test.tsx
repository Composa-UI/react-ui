import { type ReactElement } from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { NavRail } from "./NavRail";
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
