import { renderToStaticMarkup } from "react-dom/server";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { AlignmentControl } from "./AlignmentControl";
import { SegmentedControl } from "./SegmentedControl";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function keyEvent(key: string) {
  return { key, preventDefault: vi.fn(), stopPropagation: vi.fn() };
}

function button(root: ReactTestInstance, label: string) {
  return root.find(node => node.type === "button" && node.props["aria-label"] === label);
}

describe("Segmented control anatomy", () => {
  it("uses background contrast for selection without internal separator strokes", () => {
    const html = renderToStaticMarkup(
      <SegmentedControl
        ariaLabel="Flow"
        segments={[
          { value: "vertical", label: "Vertical" },
          { value: "horizontal", label: "Horizontal" },
        ]}
        value="horizontal"
        onChange={() => undefined}
      />,
    );

    expect(html).toContain('data-composa-segmented-surface="true"');
    expect(html).toContain('data-state="selected"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("bg-c-bg text-c-text");
    expect(html).toContain("focus-visible:ring-c-border-selected-strong");
    expect(html).not.toContain("ring-c-border-translucent");
    expect(html).not.toMatch(/\bborder-[lr]\b/);
  });

  it("exports the canonical 3x3 alignment value contract on the shared surface", () => {
    const html = renderToStaticMarkup(
      <AlignmentControl value="br" onChange={() => undefined} />,
    );

    expect(html).toContain('data-composa-component="AlignmentControl"');
    expect(html).toContain('role="radiogroup"');
    expect(html.match(/role="radio"/g)).toHaveLength(9);
    expect(html).toMatch(/data-state="selected"[^>]*aria-checked="true" aria-label="Bottom right"/);
    expect(html).toContain("grid-cols-3");
  });

  it("moves focus and controlled selection across segmented options", () => {
    const changes: string[] = [];
    const focus = new Map<string, ReturnType<typeof vi.fn>>();
    let renderer: ReturnType<typeof create>;
    const render = (value: string) => (
      <SegmentedControl
        ariaLabel="Flow"
        segments={[
          { value: "vertical", ariaLabel: "Vertical" },
          { value: "horizontal", ariaLabel: "Horizontal" },
          { value: "wrap", ariaLabel: "Wrap" },
        ]}
        value={value}
        onChange={next => changes.push(next)}
      />
    );
    act(() => {
      renderer = create(render("horizontal"), {
        createNodeMock: element => {
          if (element.type !== "button") return null;
          const mock = vi.fn();
          focus.set(element.props["aria-label"], mock);
          return { focus: mock };
        },
      });
    });

    expect(button(renderer!.root, "Horizontal").props["aria-pressed"]).toBe(true);
    expect(button(renderer!.root, "Horizontal").props.tabIndex).toBe(0);
    expect(button(renderer!.root, "Vertical").props.tabIndex).toBe(-1);

    const right = keyEvent("ArrowRight");
    act(() => button(renderer!.root, "Horizontal").props.onKeyDown(right));
    expect(changes).toEqual(["wrap"]);
    expect(focus.get("Wrap")).toHaveBeenCalledOnce();
    expect(right.preventDefault).toHaveBeenCalledOnce();

    act(() => renderer!.update(render("wrap")));
    expect(button(renderer!.root, "Wrap").props["aria-pressed"]).toBe(true);
    expect(button(renderer!.root, "Wrap").props.tabIndex).toBe(0);
    expect(button(renderer!.root, "Horizontal").props.tabIndex).toBe(-1);

    act(() => button(renderer!.root, "Wrap").props.onKeyDown(keyEvent("Home")));
    act(() => button(renderer!.root, "Wrap").props.onKeyDown(keyEvent("End")));
    expect(changes).toEqual(["wrap", "vertical", "wrap"]);
    act(() => renderer!.unmount());
  });

  it("uses spatial arrows and roving focus for the controlled alignment radiogroup", () => {
    const changes: string[] = [];
    const focus = new Map<string, ReturnType<typeof vi.fn>>();
    let renderer: ReturnType<typeof create>;
    const render = (value: "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br") => (
      <AlignmentControl value={value} onChange={next => changes.push(next)} />
    );
    act(() => {
      renderer = create(render("mc"), {
        createNodeMock: element => {
          if (element.type !== "button") return null;
          const mock = vi.fn();
          focus.set(element.props["aria-label"], mock);
          return { focus: mock };
        },
      });
    });

    expect(button(renderer!.root, "Middle center").props.tabIndex).toBe(0);
    expect(button(renderer!.root, "Top left").props.tabIndex).toBe(-1);
    act(() => button(renderer!.root, "Middle center").props.onKeyDown(keyEvent("ArrowRight")));
    expect(changes).toEqual(["mr"]);
    expect(focus.get("Middle right")).toHaveBeenCalledOnce();

    act(() => renderer!.update(render("mr")));
    expect(button(renderer!.root, "Middle right").props["aria-checked"]).toBe(true);
    expect(button(renderer!.root, "Middle right").props.tabIndex).toBe(0);
    act(() => button(renderer!.root, "Middle right").props.onKeyDown(keyEvent("ArrowDown")));
    act(() => button(renderer!.root, "Middle right").props.onKeyDown(keyEvent("Home")));
    act(() => button(renderer!.root, "Middle right").props.onKeyDown(keyEvent("End")));
    expect(changes).toEqual(["mr", "br", "tl", "br"]);
    expect(focus.get("Bottom right")).toHaveBeenCalledTimes(2);
    expect(focus.get("Top left")).toHaveBeenCalledOnce();
    act(() => renderer!.unmount());
  });

  it("wraps horizontal alignment arrows within each three-cell row", () => {
    const changes: string[] = [];
    const focused: string[] = [];
    let renderer: ReturnType<typeof create>;
    const render = (value: "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br") => (
      <AlignmentControl value={value} onChange={next => changes.push(next)} />
    );
    act(() => {
      renderer = create(render("tr"), {
        createNodeMock: element => {
          if (element.type !== "button") return null;
          return { focus: () => focused.push(element.props["aria-label"]) };
        },
      });
    });

    const navigate = (
      value: "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br",
      label: string,
      key: "ArrowLeft" | "ArrowRight" | "ArrowDown",
    ) => {
      act(() => renderer!.update(render(value)));
      act(() => button(renderer!.root, label).props.onKeyDown(keyEvent(key)));
    };

    navigate("tr", "Top right", "ArrowRight");
    navigate("tl", "Top left", "ArrowLeft");
    navigate("mr", "Middle right", "ArrowRight");
    navigate("ml", "Middle left", "ArrowLeft");
    navigate("br", "Bottom right", "ArrowRight");
    navigate("bl", "Bottom left", "ArrowLeft");
    navigate("tr", "Top right", "ArrowDown");

    expect(changes).toEqual(["tl", "tr", "ml", "mr", "bl", "br", "mr"]);
    expect(focused).toEqual([
      "Top left", "Top right",
      "Middle left", "Middle right",
      "Bottom left", "Bottom right",
      "Middle right",
    ]);
    act(() => renderer!.unmount());
  });
});
