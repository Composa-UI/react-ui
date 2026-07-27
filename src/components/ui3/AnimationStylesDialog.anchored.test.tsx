import { act, create, type ReactTestInstance } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING,
  ANCHORED_INSPECTOR_OVERLAY_Z_CLASS,
  COMPOSA_OVERLAY_BOUNDARY_SELECTOR,
} from "./AnchoredInspectorOverlay";
import { AnimationStylesDialog, type AnimationStyleGroup } from "./AnimationStylesDialog";

// Exercise the REAL InspectorDialog → AnchoredInspectorOverlay chain (only Radix is
// mocked) so the migration's placement/elevation/focus contract is proven end to end
// for THIS dialog: 240px, elevation-400 token, left-anchored collision-safe preset,
// clipping, focus return, and light/dark capture.
vi.mock("@radix-ui/react-popover", async () => {
  const React = await import("react");
  const boundary = (name: string) => ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("div", { [`data-radix-${name}`]: true, ...props }, children);
  return { Root: boundary("root"), Anchor: boundary("anchor"), Portal: boundary("portal"), Content: boundary("content") };
});

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => vi.unstubAllGlobals());

const GROUPS: AnimationStyleGroup[] = [
  { label: "Basic", options: [{ value: "fade-in", label: "Fade In" }, { value: "move-in", label: "Move In" }] },
];

const rect = { x: 920, y: 80, width: 24, height: 24, top: 80, right: 944, bottom: 104, left: 920, toJSON: () => ({}) } as DOMRect;

function renderOpen(mode: "light" | "dark", onClose = vi.fn()) {
  const focus = vi.fn();
  const collisionBoundary = {
    dataset: { composaOverlayBoundary: "" },
    getBoundingClientRect: () => ({ top: 0, right: 1_000, bottom: 500, left: 0 }),
  };
  const trigger = {
    getBoundingClientRect: () => rect,
    closest: (selector: string) => selector === COMPOSA_OVERLAY_BOUNDARY_SELECTOR
      ? collisionBoundary
      : { dataset: { composaMode: mode } },
    focus,
  };
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <AnimationStylesDialog open onClose={onClose} title="Build in styles" groups={GROUPS} value="fade-in" onSelect={vi.fn()}
        trigger={<button type="button" aria-label="Open styles">Fade In</button>} />,
      { createNodeMock: element => element.type === "span" ? { querySelector: () => trigger } : null },
    );
  });
  return { renderer: renderer!, onClose, focus, collisionBoundary };
}

function radix(root: ReactTestInstance, name: string) {
  return root.find(node => node.props[`data-radix-${name}`]);
}

describe("AnimationStylesDialog — anchored InspectorDialog contract (#303)", () => {
  it("mounts as a 240px, elevation-400, left-anchored collision-safe dialog", () => {
    const { renderer, collisionBoundary } = renderOpen("light");
    const content = radix(renderer.root, "content");
    expect(content.props.role).toBe("dialog");
    expect(content.props["aria-label"]).toBe("Build in styles");
    expect(content.props.style.width).toBe(240);
    expect(content.props.style.boxShadow).toBe("var(--elevation-400)");
    expect(content.props.side).toBe("left");
    expect(content.props.align).toBe("start");
    expect(content.props.avoidCollisions).toBe(true);
    expect(content.props.sticky).toBe("always");
    expect(content.props.collisionBoundary).toBe(collisionBoundary);
    expect(content.props.collisionPadding).toBe(ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING);
    expect(content.props.className).toContain(ANCHORED_INSPECTOR_OVERLAY_Z_CLASS);
    expect(content.props.className).toContain("max-w-[calc(100vw-16px)]");
    act(() => renderer.unmount());
  });

  it("is non-modal but still renders the migrated content (title + a searchable, grouped list)", () => {
    const { renderer } = renderOpen("light");
    const content = radix(renderer.root, "content");
    expect(content.props["aria-modal"]).toBe(false);
    expect(content.findAll(node => node.props["aria-label"] === "Search animation styles")).toHaveLength(1);
    expect(content.findAll(node => node.children?.[0] === "Build in styles").length).toBeGreaterThanOrEqual(1);
    expect(content.findAll(node => node.children?.[0] === "Fade In").length).toBeGreaterThanOrEqual(1);
    act(() => renderer.unmount());
  });

  it.each(["light", "dark"] as const)("captures %s mode from the anchoring trigger", mode => {
    const { renderer } = renderOpen(mode);
    expect(radix(renderer.root, "content").props["data-composa-mode"]).toBe(mode);
    act(() => renderer.unmount());
  });

  it("returns focus to the captured Style trigger after dismissal", () => {
    const { renderer, focus } = renderOpen("light");
    const event = { preventDefault: vi.fn() };
    act(() => radix(renderer.root, "content").props.onCloseAutoFocus(event));
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
    act(() => renderer.unmount());
  });

  it("closes through the Escape dismissal path", () => {
    const { renderer, onClose } = renderOpen("light");
    const escape = { preventDefault: vi.fn() };
    act(() => radix(renderer.root, "content").props.onEscapeKeyDown(escape));
    expect(onClose).toHaveBeenCalledOnce();
    act(() => renderer.unmount());
  });
});
