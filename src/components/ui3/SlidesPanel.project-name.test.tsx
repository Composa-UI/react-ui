import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { SlidesPanel } from "./SlidesPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function projectButton(root: ReactTestInstance, name: string) {
  return root.find(node => node.type === "button" && node.props["aria-label"] === name);
}

function projectInput(root: ReactTestInstance) {
  return root.find(node => node.type === "input" && node.props["aria-label"] === "Project name");
}

function renderProjectName(
  title: string,
  onCommit: (name: string) => void,
  onMenu: (trigger: HTMLButtonElement) => void = () => undefined,
) {
  let renderer: ReactTestRenderer;
  const focus = vi.fn();
  const select = vi.fn();
  act(() => {
    renderer = create(
      <SlidesPanel slides={[]} title={title} onTitleChange={onCommit} onTitleMenu={onMenu} />,
      { createNodeMock: element => element.type === "input" ? { focus, select } : null },
    );
  });
  return { renderer: renderer!, focus, select };
}

describe("project-name combo", () => {
  it("keeps the title and chevron as distinct project-labelled controls", () => {
    const onMenu = vi.fn();
    const { renderer } = renderProjectName("Product review", () => undefined, onMenu);
    const trigger = {} as HTMLButtonElement;

    act(() => projectButton(renderer.root, "Project options").props.onClick({ currentTarget: trigger }));

    expect(onMenu).toHaveBeenCalledWith(trigger);
    expect(renderer.root.findAll(node => node.type === "input")).toHaveLength(0);
    expect(projectButton(renderer.root, "Rename project Product review")).toBeTruthy();
    act(() => renderer.unmount());
  });

  it("selects the full value and trims one Enter commit", () => {
    const commits = vi.fn();
    const { renderer, focus, select } = renderProjectName("Product review", commits);

    act(() => projectButton(renderer.root, "Rename project Product review").props.onClick());
    expect(projectInput(renderer.root).props.value).toBe("Product review");
    expect(focus).toHaveBeenCalledOnce();
    expect(select).toHaveBeenCalledOnce();

    act(() => projectInput(renderer.root).props.onChange({ target: { value: "  Launch cut  " } }));
    const event = { key: "Enter", preventDefault: vi.fn() };
    act(() => projectInput(renderer.root).props.onKeyDown(event));

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(commits).toHaveBeenCalledOnce();
    expect(commits).toHaveBeenCalledWith("Launch cut");
    expect(renderer.root.findAll(node => node.type === "input")).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it("commits a changed blur but cancels Escape and ignores empty or identity edits", () => {
    const commits = vi.fn();
    const { renderer } = renderProjectName("Product review", commits);
    const begin = () => act(() => projectButton(renderer.root, "Rename project Product review").props.onClick());
    const change = (value: string) => act(() => projectInput(renderer.root).props.onChange({ target: { value } }));

    begin();
    change("Launch cut");
    act(() => projectInput(renderer.root).props.onBlur());
    expect(commits).toHaveBeenLastCalledWith("Launch cut");

    begin();
    change("Cancelled");
    const escape = { key: "Escape", preventDefault: vi.fn() };
    act(() => projectInput(renderer.root).props.onKeyDown(escape));
    expect(escape.preventDefault).toHaveBeenCalledOnce();
    expect(commits).toHaveBeenCalledTimes(1);

    begin();
    change("   ");
    act(() => projectInput(renderer.root).props.onBlur());
    begin();
    change("  Product review  ");
    act(() => projectInput(renderer.root).props.onBlur());
    expect(commits).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
  });
});
