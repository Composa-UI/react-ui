import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING,
  ANCHORED_INSPECTOR_OVERLAY_Z_CLASS,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR,
  COMPOSA_OVERLAY_BOUNDARY_SELECTOR,
} from "./AnchoredInspectorOverlay";
import { AutoLayoutSettingsDialog, type AutoLayoutSettingsValue } from "./AutoLayoutSettingsDialog";

// Composa#661 item 3: this dialog was 288px wide (every other inspector dialog is
// 240) and passed NO sideOffset and NO anchorSurfaceSelector, so Radix anchored it
// to the trigger and it opened ON TOP of the inspector instead of beside it. The
// isolated unit test could not see that — it mocked InspectorDialog away. This
// exercises the REAL InspectorDialog → AnchoredInspectorOverlay chain (only Radix
// is mocked), the same way ExportDialog/FontPickerDialog do.
vi.mock("@radix-ui/react-popover", async () => {
  const React = await import("react");
  const boundary = (name: string) => ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("div", { [`data-radix-${name}`]: true, ...props }, children);
  // The dialog nests PopoverMenu dropdowns, which also use Trigger.
  return { Root: boundary("root"), Anchor: boundary("anchor"), Portal: boundary("portal"), Content: boundary("content"), Trigger: boundary("trigger") };
});

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const VALUE: AutoLayoutSettingsValue = {
  mode: "horizontal",
  textBaseline: false,
  strokeSizing: "excluded",
  canvasStacking: "last-on-top",
};

// The trigger is the 24px action button at the right end of the Alignment/Gap
// row; the inspector surface's LEFT edge is well to the left of it.
const triggerRect = { x: 920, y: 80, width: 24, height: 24, top: 80, right: 944, bottom: 104, left: 920, toJSON: () => ({}) } as DOMRect;
const surfaceRect = { x: 760, y: 0, width: 240, height: 500, top: 0, right: 1_000, bottom: 500, left: 760, toJSON: () => ({}) } as DOMRect;

function renderOpen(onClose = vi.fn()) {
  const collisionBoundary = {
    dataset: { composaOverlayBoundary: "" },
    getBoundingClientRect: () => ({ top: 0, right: 1_000, bottom: 500, left: 0 }),
  };
  const surface = { getBoundingClientRect: () => surfaceRect };
  const trigger = {
    getBoundingClientRect: () => triggerRect,
    closest: (selector: string) =>
      selector === COMPOSA_OVERLAY_BOUNDARY_SELECTOR ? collisionBoundary
      : selector === COMPOSA_INSPECTOR_SURFACE_SELECTOR ? surface
      : { dataset: { composaMode: "light" } },
    focus: vi.fn(),
  };
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <AutoLayoutSettingsDialog open value={VALUE} onClose={onClose}
        trigger={<button type="button" aria-label="Auto-layout settings">Settings</button>} />,
      { createNodeMock: element => element.type === "span" ? { querySelector: () => trigger } : null },
    );
  });
  return { renderer: renderer!, onClose, collisionBoundary };
}

function radix(root: ReactTestInstance, name: string) {
  // The nested PopoverMenu dropdowns render mocked Content nodes too, so
  // disambiguate the outer inspector dialog by its role="dialog".
  if (name === "content") return root.find(node => node.props["data-radix-content"] && node.props.role === "dialog");
  return root.find(node => node.props[`data-radix-${name}`]);
}

describe("AutoLayoutSettingsDialog — anchored InspectorDialog contract (Composa#661)", () => {
  it("is the same 240px, elevation-400, left-anchored dialog as its inspector peers", () => {
    const { renderer, collisionBoundary } = renderOpen();
    const content = radix(renderer.root, "content");
    expect(content.props["aria-label"]).toBe("Auto layout settings");
    // The reported symptom: it was WIDER than the other inspector dialogs.
    expect(content.props.style.width).toBe(240);
    expect(content.props.style.boxShadow).toBe("var(--elevation-400)");
    expect(content.props.side).toBe("left");
    expect(content.props.align).toBe("start");
    expect(content.props.avoidCollisions).toBe(true);
    expect(content.props.collisionBoundary).toBe(collisionBoundary);
    expect(content.props.collisionPadding).toBe(ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING);
    expect(content.props.className).toContain(ANCHORED_INSPECTOR_OVERLAY_Z_CLASS);
    act(() => renderer.unmount());
  });

  it("anchors the side axis to the inspector SURFACE left edge, not the trigger", () => {
    const { renderer } = renderOpen();
    // The reported symptom: it did not open at the SIDE of the inspector panel.
    // A trigger-anchored dialog would place from triggerRect.x (920) and land on
    // top of the panel; a surface-anchored one collapses onto the surface edge.
    const rect = radix(renderer.root, "anchor").props.virtualRef.current.getBoundingClientRect();
    expect(rect.left).toBe(surfaceRect.left);
    expect(rect.right).toBe(surfaceRect.left);
    expect(rect.width).toBe(0);
    // Cross axis still tracks the trigger's vertical extent.
    expect(rect.top).toBe(triggerRect.top);
    act(() => renderer.unmount());
  });

  it("closes through the Escape dismissal path", () => {
    const { renderer, onClose } = renderOpen();
    const escape = { preventDefault: vi.fn() };
    act(() => radix(renderer.root, "content").props.onEscapeKeyDown(escape));
    expect(onClose).toHaveBeenCalledOnce();
    act(() => renderer.unmount());
  });
});
