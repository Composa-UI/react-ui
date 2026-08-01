import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  PanelReorderableEntry, PanelSegmentedRow, PanelFieldRow,
  panelEntryDropZone, panelEntryReorderTarget,
} from "./Panel";

// Composa#661 item 7: the stackable sections (Fill · Stroke · Effects) were
// draggable but painted no drop indicator, so the only feedback was the grip's
// grab cursor — you could not see where an entry would land. The layer list
// already answers that with a 2px insertion line; PanelReorderableEntry gives
// every stackable section the same affordance from one primitive.

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("panelEntryDropZone", () => {
  const rect = { top: 100, height: 32 };

  it("splits the row in half — top edge inserts before, bottom edge after", () => {
    expect(panelEntryDropZone(100, rect)).toBe("before");
    expect(panelEntryDropZone(115, rect)).toBe("before");
    expect(panelEntryDropZone(116, rect)).toBe("after");
    expect(panelEntryDropZone(131, rect)).toBe("after");
  });

  it("degrades to `before` for an unmeasured row instead of dividing by zero", () => {
    expect(panelEntryDropZone(0, { top: 0, height: 0 })).toBe("before");
  });
});

// The host contract is `onReorder(id, targetId)` = "remove id, re-insert at
// targetId's original index", which lands the entry after the target when
// dragging down and before it when dragging up. Dropping on the far half of a
// row therefore has to name the neighbouring row, or the insertion line would
// promise a gap the drop does not honour.
describe("panelEntryReorderTarget", () => {
  const ids = ["a", "b", "c", "d"];
  /** What the host's remove-then-insert-at-index actually produces. */
  const applyHostReorder = (source: string, target: string) => {
    const next = [...ids];
    next.splice(next.indexOf(source), 1);
    next.splice(ids.indexOf(target), 0, source);
    return next;
  };

  it("lands the entry in exactly the gap the insertion line was drawn at", () => {
    expect(applyHostReorder("a", panelEntryReorderTarget(ids, "a", "c", "after")!)).toEqual(["b", "c", "a", "d"]);
    expect(applyHostReorder("a", panelEntryReorderTarget(ids, "a", "c", "before")!)).toEqual(["b", "a", "c", "d"]);
    expect(applyHostReorder("d", panelEntryReorderTarget(ids, "d", "b", "before")!)).toEqual(["a", "d", "b", "c"]);
    expect(applyHostReorder("d", panelEntryReorderTarget(ids, "d", "b", "after")!)).toEqual(["a", "b", "d", "c"]);
  });

  it("reports a no-op for a drop into the gap the entry already occupies", () => {
    expect(panelEntryReorderTarget(ids, "b", "a", "after")).toBeNull();
    expect(panelEntryReorderTarget(ids, "b", "c", "before")).toBeNull();
    expect(panelEntryReorderTarget(ids, "b", "b", "before")).toBeNull();
    expect(panelEntryReorderTarget(ids, "b", "missing", "after")).toBeNull();
  });
});

describe("PanelReorderableEntry", () => {
  const ids = ["a", "b", "c"];
  const dragEvent = (clientY: number, data: Record<string, string> = {}) => ({
    clientY,
    preventDefault: vi.fn(),
    dataTransfer: {
      setData: (key: string, value: string) => { data[key] = value; },
      getData: (key: string) => data[key] ?? "",
      effectAllowed: "",
    },
    currentTarget: {
      getBoundingClientRect: () => ({ top: 0, height: 32 }),
      contains: () => false,
    },
    relatedTarget: null,
  });

  const stack = (onReorder?: (id: string, targetId: string) => void, entryIds = ids) => {
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(<>{entryIds.map(id => (
        <PanelReorderableEntry key={id} id={id} ids={entryIds} onReorder={onReorder}>
          <span data-entry={id} />
        </PanelReorderableEntry>
      ))}</>);
    });
    return renderer!;
  };
  const wrapperFor = (renderer: ReactTestRenderer, id: string): ReactTestInstance =>
    renderer.root.findAll(node => node.type === "div" && node.props?.draggable !== undefined)
      .find(node => node.findAll(child => child.props?.["data-entry"] === id).length > 0)!;
  const indicators = (renderer: ReactTestRenderer) =>
    renderer.root.findAll(node => node.props?.["data-composa-reorder-indicator"] !== undefined);

  it("paints an insertion line on the hovered half of the row, and only there", () => {
    const renderer = stack(() => undefined);
    // Nothing hovered → nothing painted. The rows exist, so this is not vacuous.
    expect(renderer.root.findAll(node => node.props?.["data-entry"] !== undefined)).toHaveLength(3);
    expect(indicators(renderer)).toHaveLength(0);

    act(() => wrapperFor(renderer, "c").props.onDragOver(dragEvent(4)));
    let painted = indicators(renderer);
    expect(painted).toHaveLength(1);
    expect(painted[0].props["data-composa-reorder-indicator"]).toBe("before");
    expect(painted[0].props.className).toContain("top-0");

    act(() => wrapperFor(renderer, "c").props.onDragOver(dragEvent(28)));
    painted = indicators(renderer);
    expect(painted).toHaveLength(1);
    expect(painted[0].props["data-composa-reorder-indicator"]).toBe("after");
    expect(painted[0].props.className).toContain("bottom-0");

    act(() => renderer.unmount());
  });

  it("clears the line when the drag leaves the row", () => {
    const renderer = stack(() => undefined);
    act(() => wrapperFor(renderer, "b").props.onDragOver(dragEvent(4)));
    expect(indicators(renderer)).toHaveLength(1);
    act(() => wrapperFor(renderer, "b").props.onDragLeave(dragEvent(4)));
    expect(indicators(renderer)).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it("emits the reorder target that matches the line it drew", () => {
    const onReorder = vi.fn();
    const renderer = stack(onReorder);
    const transfer: Record<string, string> = {};
    act(() => wrapperFor(renderer, "a").props.onDragStart(dragEvent(0, transfer)));
    act(() => wrapperFor(renderer, "c").props.onDrop(dragEvent(28, transfer))); // bottom half → after "c"
    expect(onReorder).toHaveBeenCalledWith("a", "c");

    onReorder.mockClear();
    act(() => wrapperFor(renderer, "c").props.onDrop(dragEvent(4, transfer)));  // top half → before "c"
    expect(onReorder).toHaveBeenCalledWith("a", "b");
    act(() => renderer.unmount());
  });

  it("stays inert for a single-entry stack — nothing to reorder", () => {
    const onReorder = vi.fn();
    const renderer = stack(onReorder, ["only"]);
    const wrapper = wrapperFor(renderer, "only");
    expect(wrapper.props.draggable).toBe(false);
    act(() => wrapper.props.onDrop(dragEvent(28, { "text/plain": "only" })));
    expect(onReorder).not.toHaveBeenCalled();
    act(() => renderer.unmount());
  });
});

describe("PanelSegmentedRow", () => {
  it("always reserves the trailing 24px slot", () => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PanelSegmentedRow label="Text resizing" left={<span />} />); });
    expect(renderer!.root.findByType(PanelFieldRow).props.reserveRightSlot).toBe(true);
    act(() => renderer!.unmount());
  });
});
