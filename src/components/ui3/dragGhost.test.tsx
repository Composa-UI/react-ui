import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { PanelReorderableEntry } from "./Panel";
import { LayerList, type LayerNode } from "./LayerList";
import { suppressNativeDragImage } from "./dragImage";

// Iteration-3 owner feedback, twice over: "I still see ghost while dragging"
// (stackable inspector sections) and "I think we should remove ghost for layer
// list as well". Both surfaces set `draggable` and never called setDragImage —
// `grep -rn setDragImage src/` returned nothing in the whole repo — so the
// browser painted its default translucent snapshot of the dragged row.
//
// These tests drive the REAL onDragStart handlers with a dataTransfer carrying a
// setDragImage spy, so they fail if either surface stops suppressing, or if one
// is wired and the other is forgotten.

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** A document stand-in — the unit tests run with no DOM (vitest `node` env). */
function fakeDocument() {
  const attached: { style: { cssText: string }; attrs: Record<string, string> }[] = [];
  const detached: unknown[] = [];
  const body = {
    appendChild: (node: (typeof attached)[number]) => { attached.push(node); return node; },
    removeChild: (node: unknown) => { detached.push(node); return node; },
  };
  return {
    body,
    attached,
    detached,
    createElement: () => {
      const attrs: Record<string, string> = {};
      return { style: { cssText: "" }, attrs, setAttribute: (k: string, v: string) => { attrs[k] = v; } };
    },
  };
}

/** A dragstart event whose dataTransfer records what the handler did to it. */
function dragStartEvent(doc: ReturnType<typeof fakeDocument> | null = fakeDocument()) {
  const setDragImage = vi.fn();
  const data: Record<string, string> = {};
  return {
    setDragImage,
    data,
    doc,
    event: {
      preventDefault: vi.fn(),
      dataTransfer: {
        setDragImage,
        setData: (key: string, value: string) => { data[key] = value; },
        getData: (key: string) => data[key] ?? "",
        effectAllowed: "",
      },
      currentTarget: { ownerDocument: doc },
    },
  };
}

describe("suppressNativeDragImage", () => {
  it("hands the drag a 1x1 transparent off-screen node instead of the row snapshot", () => {
    const { event, setDragImage, doc } = dragStartEvent();
    suppressNativeDragImage(event as never);

    expect(setDragImage).toHaveBeenCalledTimes(1);
    const [ghost, x, y] = setDragImage.mock.calls[0];
    expect([x, y]).toEqual([0, 0]);
    // Same node that was put in the document — a detached node yields no image.
    expect(doc!.attached).toEqual([ghost]);
    expect(ghost.attrs["aria-hidden"]).toBe("true");
    expect(ghost.style.cssText).toContain("width:1px");
    expect(ghost.style.cssText).toContain("height:1px");
    expect(ghost.style.cssText).toContain("opacity:0");
    // Off-screen, NOT display:none — Chrome falls back to the default snapshot
    // for a node with no box.
    expect(ghost.style.cssText).not.toContain("display:none");
  });

  it("cleans the node up rather than leaking one per drag", async () => {
    vi.useFakeTimers();
    try {
      const { event, doc } = dragStartEvent();
      suppressNativeDragImage(event as never);
      // Assert the node exists before asserting it is cleaned up — otherwise
      // "nothing attached, nothing detached" would satisfy this vacuously.
      expect(doc!.attached).toHaveLength(1);
      expect(doc!.detached).toHaveLength(0);
      vi.runAllTimers();
      expect(doc!.detached).toEqual(doc!.attached);
    } finally {
      vi.useRealTimers();
    }
  });

  it("no-ops without a document or a setDragImage implementation, leaving the drag alone", () => {
    const withoutDoc = dragStartEvent(null);
    suppressNativeDragImage(withoutDoc.event as never);
    expect(withoutDoc.setDragImage).not.toHaveBeenCalled();

    expect(() => suppressNativeDragImage({ dataTransfer: null } as never)).not.toThrow();
    expect(() => suppressNativeDragImage({ dataTransfer: {} } as never)).not.toThrow();
  });
});

describe("stackable inspector sections drag without a ghost", () => {
  const ids = ["a", "b", "c"];
  const stack = () => {
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(<>{ids.map(id => (
        <PanelReorderableEntry key={id} id={id} ids={ids} onReorder={() => undefined}>
          <span data-entry={id} />
        </PanelReorderableEntry>
      ))}</>);
    });
    return renderer!;
  };
  const wrapperFor = (renderer: ReactTestRenderer, id: string): ReactTestInstance =>
    renderer.root.findAll(node => node.type === "div" && node.props?.draggable !== undefined)
      .find(node => node.findAll(child => child.props?.["data-entry"] === id).length > 0)!;

  it("suppresses the native drag image on dragstart, without dropping the payload", () => {
    const renderer = stack();
    const wrapper = wrapperFor(renderer, "b");
    expect(wrapper.props.draggable).toBe(true); // the row is really draggable

    const { event, setDragImage, data } = dragStartEvent();
    act(() => wrapper.props.onDragStart(event));

    expect(setDragImage).toHaveBeenCalledTimes(1);
    // The reorder payload and effect must survive the suppression.
    expect(data["text/plain"]).toBe("b");
    expect(event.dataTransfer.effectAllowed).toBe("move");
    act(() => renderer.unmount());
  });
});

describe("layer list drags without a ghost", () => {
  const layers: LayerNode[] = [
    { id: "a", name: "Card", type: "shape" },
    { id: "b", name: "Motto", type: "text" },
  ];
  const rowFor = (renderer: ReactTestRenderer, name: string): ReactTestInstance =>
    renderer.root.find(node => node.props?.role === "treeitem" && node.props?.["aria-label"] === name);

  const render = (props: Partial<Parameters<typeof LayerList>[0]> = {}) => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<LayerList layers={layers} selectedIds={[]} onReorder={() => undefined} {...props} />); });
    return renderer!;
  };

  it("suppresses the native drag image on a row dragstart, keeping the layer payload", () => {
    const renderer = render();
    const row = rowFor(renderer, "Motto");
    expect(row.props.draggable).toBe(true); // not vacuous: the row really drags

    const { event, setDragImage, data } = dragStartEvent();
    act(() => row.props.onDragStart(event));

    expect(setDragImage).toHaveBeenCalledTimes(1);
    expect(JSON.parse(data["application/x-composa-layers"])).toEqual(["b"]);
    expect(data["text/plain"]).toBe("b");
    act(() => renderer.unmount());
  });

  it("leaves an aborted drag completely untouched", () => {
    // A multi-selection containing a locked layer yields no drag roots, so the
    // handler preventDefaults and returns before any payload is set. It must not
    // allocate a ghost on that path either.
    const renderer = render({
      layers: [{ id: "a", name: "Card", type: "shape", locked: true }, { id: "b", name: "Motto", type: "text" }],
      selectedIds: ["a", "b"],
    });
    const row = rowFor(renderer, "Motto");
    const { event, setDragImage, doc } = dragStartEvent();
    act(() => row.props.onDragStart(event));

    expect(event.preventDefault).toHaveBeenCalledTimes(1); // the drag really aborted
    expect(setDragImage).not.toHaveBeenCalled();
    expect(doc!.attached).toHaveLength(0);
    act(() => renderer.unmount());
  });
});
