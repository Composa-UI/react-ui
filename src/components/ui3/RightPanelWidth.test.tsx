import { act, create } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { PANEL_W, Panel } from "./Panel";
import { InspectorRailSwitcher } from "./InspectorRailSwitcher";
import { PropertyPanel } from "./PropertyPanel";
import { SlideInspector } from "./SlideInspector";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Every occupant of the editor's right slot. Left-column panels (LayerList,
// SlidesPanel, SidePanel and its AgentPanel / AssetsPanel / CompositionPanel
// tenants) are deliberately absent — they carry border-r, not border-l.
const RIGHT_SLOT_PANELS = {
  Panel: <Panel>body</Panel>,
  InspectorRailSwitcher: (
    <InspectorRailSwitcher active="inspector" inspector={<div />} agent={<div />} onChange={() => undefined} />
  ),
  PropertyPanel: <PropertyPanel />,
  SlideInspector: <SlideInspector />,
} as const;

function rootElement(element: React.ReactElement) {
  let renderer!: ReturnType<typeof create>;
  act(() => { renderer = create(element); });
  const json = renderer.toJSON();
  if (!json || Array.isArray(json)) throw new Error("expected a single root host element");
  return json;
}

describe("right-slot panel width (RP-5)", () => {
  // The width was widened by hand in two of these last time, so they drifted.
  // One constant, read by all of them, is the thing that stops it recurring.
  it.each(Object.keys(RIGHT_SLOT_PANELS))("%s sizes its root from PANEL_W", name => {
    const root = rootElement(RIGHT_SLOT_PANELS[name as keyof typeof RIGHT_SLOT_PANELS]);
    expect(root.props.style?.width).toBe(PANEL_W);
  });

  it.each(Object.keys(RIGHT_SLOT_PANELS))("%s hardcodes no competing width utility", name => {
    const root = rootElement(RIGHT_SLOT_PANELS[name as keyof typeof RIGHT_SLOT_PANELS]);
    // A literal w-[NNNpx] alongside PANEL_W is exactly how the copies survived
    // the last widening: the class wins and the constant becomes decoration.
    expect(String(root.props.className ?? "")).not.toMatch(/(^|\s)w-\[\d+px\]/);
  });
});
