import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { MODAL_STACK_GAP } from "./Dialog";
import { ShareModal, type SharePerson } from "./ShareModal";

// Exercise the REAL Modal → ModalCard chain (only Radix is mocked) so RP-3's
// two-card contract is proven where it actually lives: share on top, a separate
// floating card beneath it holding Export. A test against a mocked ./Dialog
// could only prove ShareModal passed props to something.
vi.mock("@radix-ui/react-dialog", async () => {
  const React = await import("react");
  const boundary = (name: string) =>
    ({ children, asChild: _asChild, ...props }: { children?: React.ReactNode; asChild?: boolean } & Record<string, unknown>) =>
      React.createElement("div", { [`data-radix-${name}`]: true, ...props }, children);
  return {
    Root: boundary("root"), Portal: boundary("portal"), Overlay: boundary("overlay"),
    Content: boundary("content"), Title: boundary("title"), Close: boundary("close"),
  };
});

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const OWNER: SharePerson[] = [{ id: "you", name: "Samuel", you: true, owner: true, color: "purple", initial: "S" }];

// The card surface — a stacked Modal must paint it per card, not on the container.
const SURFACE = ["rounded-c-lg", "shadow-c-500"] as const;

function render(props: Partial<React.ComponentProps<typeof ShareModal>> = {}) {
  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(<ShareModal open onClose={() => undefined} people={OWNER} {...props} />);
  });
  return renderer.root;
}

const hasClass = (node: ReactTestInstance, cls: string) =>
  typeof node.props.className === "string" && node.props.className.split(" ").includes(cls);

function cards(root: ReactTestInstance) {
  return root.findAll(node => typeof node.type === "string" && node.props["data-composa-modal-card"] !== undefined);
}

function content(root: ReactTestInstance) {
  return root.find(node => typeof node.type === "string" && node.props["data-radix-content"] !== undefined);
}

function byLabel(root: ReactTestInstance, label: string) {
  return root.findAll(node => node.type === "button" && node.props["aria-label"] === label);
}

function text(node: ReactTestInstance | string): string {
  if (typeof node === "string") return node;
  return (node.children ?? []).map(text).join("");
}

describe("ShareModal export card (RP-3)", () => {
  it("adds an Export cell only once the host owns an export action", () => {
    // Container first: without it an absence assertion proves nothing.
    const bare = render();
    expect(text(bare)).toContain("Share this project");
    expect(byLabel(bare, "Export")).toHaveLength(0);
    expect(cards(bare)).toHaveLength(0);

    const wired = render({ onExport: () => undefined });
    expect(text(wired)).toContain("Share this project");
    expect(byLabel(wired, "Export")).toHaveLength(1);
  });

  it("routes the Export cell to the host handler", () => {
    const onExport = vi.fn();
    const root = render({ onExport });
    act(() => { byLabel(root, "Export")[0].props.onClick(); });
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("floats export as a second card beneath share, not as one tall card", () => {
    const root = render({ onExport: () => undefined });

    // Two sibling cards, each carrying its own surface…
    const stack = cards(root);
    expect(stack).toHaveLength(2);
    for (const card of stack) for (const cls of SURFACE) expect(hasClass(card, cls)).toBe(true);

    // …and the container carrying none of it, so the gap shows through.
    const container = content(root);
    for (const cls of SURFACE) expect(hasClass(container, cls)).toBe(false);
    expect(container.props.style).toMatchObject({ gap: MODAL_STACK_GAP });

    // Share stays share: the invite flow is in the first card, Export in the second.
    expect(text(stack[0])).toContain("Share this project");
    expect(byLabel(stack[0], "Export")).toHaveLength(0);
    expect(byLabel(stack[1], "Export")).toHaveLength(1);
    expect(text(stack[1])).not.toContain("Share this project");
  });

  it("leaves the single-card modal untouched when there is no second card", () => {
    const root = render();
    const container = content(root);
    for (const cls of SURFACE) expect(hasClass(container, cls)).toBe(true);
    expect(container.props.style).not.toHaveProperty("gap");
  });

  it("keeps Share an invite flow — Export is a sibling control, not a rename", () => {
    const root = render({ onExport: () => undefined, onInvite: () => undefined });
    const shareCard = cards(root)[0];
    expect(text(shareCard)).toContain("Who has access");
    expect(shareCard.findAll(node => node.type === "input")).toHaveLength(1);
    // The export cell opens a dialog, so it must not claim to open a menu.
    expect(byLabel(root, "Export")[0].props["aria-haspopup"]).toBe("dialog");
  });
});
