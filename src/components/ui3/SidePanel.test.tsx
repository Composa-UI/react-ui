import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { AgentPanel } from "./AgentPanel";
import { TooltipProvider } from "./Tooltip";
import { AssetsPanel } from "./AssetsPanel";
import { CompositionPanel } from "./CompositionPanel";
import { SidePanel, SIDE_PANEL_DEFAULT_WIDTH, SIDE_PANEL_MAX_WIDTH, SIDE_PANEL_MIN_WIDTH } from "./SidePanel";

/**
 * Composition, Assets and Agent share the left-rail slot. Only CompositionPanel
 * owned a width and a drag handle; the other two hardcoded `w-[240px]`, so
 * switching tabs silently lost the ability to resize (Composa#664).
 *
 * These assert the property per PANEL rather than on SidePanel alone — the bug
 * was never that the shell could not resize, it was that two panels did not use
 * it, and a test of the shell by itself would have stayed green throughout.
 */
const handleOf = (tree: ReactTestRenderer) =>
  tree.root.findAll(node => node.props?.["aria-label"] === "Resize panel width" && node.props?.role === "separator");

const panels: [string, () => React.ReactElement][] = [
  ["CompositionPanel", () => <CompositionPanel slides={[]} layers={[]} />],
  ["AssetsPanel", () => <AssetsPanel assets={[]} />],
  // AgentPanel is fully controlled; these are the minimum props its own suite uses.
  ["AgentPanel", () => (
    <TooltipProvider>
      <AgentPanel conversations={[]} activeConversation={null} search="" composerValue=""
        onSearchChange={() => undefined} onNewConversation={() => undefined}
        onOpenConversation={() => undefined} onBack={() => undefined}
        onComposerChange={() => undefined} onSubmit={() => undefined} />
    </TooltipProvider>
  )],
];

describe.each(panels)("%s", (_name, renderPanel) => {
  it("offers the width resize handle", () => {
    let tree!: ReactTestRenderer;
    act(() => { tree = create(renderPanel()); });
    expect(handleOf(tree)).toHaveLength(1);
  });

  it("reports the same bounds as its siblings, so one width can span the rail", () => {
    let tree!: ReactTestRenderer;
    act(() => { tree = create(renderPanel()); });
    // A width carried across tabs would otherwise be clamped differently per tab.
    const handle = handleOf(tree)[0];
    expect(handle.props["aria-valuemin"]).toBe(SIDE_PANEL_MIN_WIDTH);
    expect(handle.props["aria-valuemax"]).toBe(SIDE_PANEL_MAX_WIDTH);
  });
});

describe("SidePanel width", () => {
  it("defaults to the shared default width", () => {
    let tree!: ReactTestRenderer;
    act(() => { tree = create(<SidePanel />); });
    expect(handleOf(tree)[0].props["aria-valuenow"]).toBe(SIDE_PANEL_DEFAULT_WIDTH);
  });

  it("never reports a width outside the allowed range", () => {
    const onWidthChange = vi.fn();
    let tree!: ReactTestRenderer;
    act(() => { tree = create(<SidePanel onWidthChange={onWidthChange} />); });
    const handle = handleOf(tree)[0];
    // Keyboard resize is the accessible path and shares the drag path's clamp.
    for (let i = 0; i < 40; i++) {
      act(() => { handle.props.onKeyDown({ key: "ArrowLeft", preventDefault() {} }); });
    }
    expect(onWidthChange).toHaveBeenCalled();
    for (const [value] of onWidthChange.mock.calls) {
      expect(value).toBeGreaterThanOrEqual(SIDE_PANEL_MIN_WIDTH);
      expect(value).toBeLessThanOrEqual(SIDE_PANEL_MAX_WIDTH);
    }
  });
});
