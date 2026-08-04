import { type ReactNode } from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Dialog";

vi.mock("@radix-ui/react-dialog", async () => {
  const React = await import("react");
  const boundary = (name: string) => ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) =>
    React.createElement("div", { [`data-radix-${name}`]: "", ...props }, children);
  return { Root: boundary("root"), Portal: boundary("portal"), Overlay: boundary("overlay"), Content: boundary("content") };
});

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("Modal text-selection contract", () => {
  it("suppresses chrome selection and restores native or explicit copy surfaces", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <Modal open onClose={() => undefined}>
          <span>Chrome</span><input aria-label="Value" /><textarea aria-label="Notes" /><div contentEditable /><div data-composa-selectable>Copy me</div>
        </Modal>,
      );
    });
    const content = renderer!.root.find(node => node.props["data-radix-content"] !== undefined);
    expect(content.props.className).toContain("select-none");
    expect(content.props.className).toContain("[&_input]:select-text");
    expect(content.props.className).toContain("[&_textarea]:select-text");
    expect(content.props.className).toContain("[&_[contenteditable='true']]:select-text");
    expect(content.props.className).toContain("[&_[data-composa-selectable]]:select-text");
    act(() => renderer!.unmount());
  });
});
