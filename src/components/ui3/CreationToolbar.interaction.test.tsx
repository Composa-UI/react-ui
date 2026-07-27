import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { CreationToolbar, type ToolId } from "./CreationToolbar";

function primaryButton(renderer: ReactTestRenderer, label: string) {
  return renderer.root.find(node =>
    node.type === "button" &&
    node.props["aria-label"] === label &&
    node.props["aria-haspopup"] === undefined);
}

function menuButton(renderer: ReactTestRenderer, label: string) {
  return renderer.root.find(node =>
    node.type === "button" &&
    node.props["aria-label"] === `${label} tools`);
}

describe("CreationToolbar remembered family choices", () => {
  it("keeps the controlled last-used shape after a one-shot return to Move", () => {
    const changes: ToolId[] = [];
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(<CreationToolbar activeTool="ellipse" shortcutPolicy="host" onToolChange={tool => changes.push(tool)} />);
    });

    expect(primaryButton(renderer, "Ellipse").props["aria-pressed"]).toBe(true);
    act(() => {
      renderer.update(<CreationToolbar activeTool="move" shortcutPolicy="host" onToolChange={tool => changes.push(tool)} />);
    });

    expect(primaryButton(renderer, "Move").props["aria-pressed"]).toBe(true);
    expect(primaryButton(renderer, "Ellipse").props["aria-pressed"]).toBe(false);
    expect(() => primaryButton(renderer, "Rectangle")).toThrow();

    act(() => menuButton(renderer, "Ellipse").props.onClick());
    const rememberedRow = renderer.root.find(node =>
      typeof node.type === "function" &&
      node.props.label === "Ellipse" &&
      node.props.type === "checkmark");
    expect(rememberedRow.props.checked).toBe(true);

    act(() => primaryButton(renderer, "Ellipse").props.onClick());
    expect(changes).toEqual(["ellipse"]);
  });

  it("updates remembered choices from host-owned shortcuts without mixing families", () => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(<CreationToolbar activeTool="hand" shortcutPolicy="host" />);
    });
    act(() => {
      renderer.update(<CreationToolbar activeTool="line" shortcutPolicy="host" />);
    });
    act(() => {
      renderer.update(<CreationToolbar activeTool="text" shortcutPolicy="host" />);
    });

    expect(primaryButton(renderer, "Hand").props["aria-pressed"]).toBe(false);
    expect(primaryButton(renderer, "Line").props["aria-pressed"]).toBe(false);
    expect(primaryButton(renderer, "Text").props["aria-pressed"]).toBe(true);
  });
});
