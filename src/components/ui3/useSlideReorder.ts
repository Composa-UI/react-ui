import { useEffect, useRef, useState, type PointerEvent } from "react";

type Item = { id: string; selected?: boolean };
type Slot = { id: string; start: number; end: number };
export function reorderInsertion(slots: readonly Slot[], moving: readonly string[], coordinate: number) {
  const remaining = slots.filter(slot => !moving.includes(slot.id));
  const index = remaining.findIndex(slot => coordinate < (slot.start + slot.end) / 2);
  const targetIndex = index < 0 ? remaining.length : index;
  const position = remaining[targetIndex]?.start ?? remaining.at(-1)?.end ?? slots[0]?.start ?? 0;
  return { targetIndex, position };
}

/** Presentation-only insertion preview; the host commits one document edit. */
export function useSlideReorder(items: readonly Item[], onReorder: ((ids: string[], index: number) => void) | undefined, disabled = false) {
  const [preview, setPreview] = useState<{ ids: string[]; position: number } | null>(null);
  const active = useRef<{ id: string; pointerId: number; x: number; y: number; axis: "x" | "y"; slots: Slot[]; ids: string[]; moved: boolean; targetIndex: number; cleanup: () => void } | null>(null);
  const suppressClick = useRef(false);
  const latest = useRef({ items, onReorder, disabled }); latest.current = { items, onReorder, disabled };
  const cancel = () => {
    const state = active.current; active.current = null;
    if (state) { state.cleanup(); suppressClick.current = state.moved; }
    setPreview(null);
  };
  const identity = items.map(item => item.id).join("\0");
  useEffect(() => { cancel(); }, [identity, disabled]);
  useEffect(() => () => { active.current?.cleanup(); active.current = null; }, []);
  const begin = (event: PointerEvent, id: string, elements: readonly HTMLElement[], axis: "x" | "y") => {
    if (!onReorder || disabled || event.button !== 0 || !event.isPrimary) return;
    const item = items.find(item => item.id === id); if (!item) return;
    cancel(); suppressClick.current = false;
    const ids = item.selected ? items.filter(item => item.selected).map(item => item.id) : [id];
    const slots = elements.map((element, index) => {
      const box = element.getBoundingClientRect();
      return { id: items[index]?.id ?? "", start: axis === "x" ? box.left : box.top, end: axis === "x" ? box.right : box.bottom };
    });
    const state = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, axis, slots, ids, moved: false, targetIndex: 0, cleanup: () => {} };
    let lastPoint = { x: event.clientX, y: event.clientY };
    let frame = 0;
    const scrollViewport = axis === "y" ? elements[0]?.closest<HTMLElement>("[data-composa-scroll-viewport]") : null;
    const refreshPreview = () => {
      state.slots = elements.map((element,index) => { const box = element.getBoundingClientRect(); return { id: slots[index].id, start: axis === "x" ? box.left : box.top, end: axis === "x" ? box.right : box.bottom }; });
      const insertion = reorderInsertion(state.slots, ids, axis === "x" ? lastPoint.x : lastPoint.y);
      state.targetIndex = insertion.targetIndex; setPreview({ ids, position: insertion.position });
    };
    const scroll = () => {
      if (active.current !== state) return;
      if (state.moved && scrollViewport) {
        const box = scrollViewport.getBoundingClientRect();
        const delta = lastPoint.y < box.top + 32 ? -12 : lastPoint.y > box.bottom - 32 ? 12 : 0;
        if (delta && lastPoint.x >= box.left && lastPoint.x <= box.right) { scrollViewport.scrollTop += delta; refreshPreview(); }
      }
      frame = requestAnimationFrame(scroll);
    };
    const move = (e: globalThis.PointerEvent) => {
      if (e.pointerId !== state.pointerId || active.current !== state) return;
      if (e.buttons === 0) { cancel(); return; }
      lastPoint = {x:e.clientX,y:e.clientY};
      if (!state.moved && Math.hypot(e.clientX-state.x, e.clientY-state.y) < 4) return;
      state.moved = true; suppressClick.current = true; e.preventDefault();
      refreshPreview();
    };
    const finish = (e: globalThis.PointerEvent) => {
      if (e.pointerId !== state.pointerId || active.current !== state) return;
      const commit = state.moved && e.type === "pointerup" && !latest.current.disabled;
      cancel();
      if (commit) {
        const original = items.map(item => item.id);
        const remaining = original.filter(id => !ids.includes(id));
        const next = [...remaining.slice(0,state.targetIndex), ...ids, ...remaining.slice(state.targetIndex)];
        if (next.some((id,index) => id !== original[index])) latest.current.onReorder?.(ids,state.targetIndex);
      }
    };
    const escape = (e: globalThis.KeyboardEvent) => { if(e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); } };
    const blur = () => cancel();
    state.cleanup = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("contextmenu",blur,true);
      window.removeEventListener("pointermove",move); window.removeEventListener("pointerup",finish); window.removeEventListener("pointercancel",finish);
      window.removeEventListener("keydown",escape,true); window.removeEventListener("blur",blur);
    };
    active.current = state;
    frame = requestAnimationFrame(scroll);
    window.addEventListener("contextmenu",blur,true);
    window.addEventListener("pointermove",move,{passive:false}); window.addEventListener("pointerup",finish); window.addEventListener("pointercancel",finish);
    window.addEventListener("keydown",escape,true); window.addEventListener("blur",blur);
    event.stopPropagation();
  };
  const clickCapture = (event: { preventDefault(): void; stopPropagation(): void }) => {
    if (!suppressClick.current) return;
    suppressClick.current = false; event.preventDefault(); event.stopPropagation();
  };
  const step = (id: string, direction: -1 | 1) => {
    if (!onReorder || disabled) return;
    const item = items.find(item => item.id === id); if (!item) return;
    const ids = item.selected ? items.filter(item => item.selected).map(item => item.id) : [id];
    const first = items.findIndex(item => ids.includes(item.id));
    const target = Math.max(0, Math.min(items.length - ids.length, first + direction));
    if (target !== first) onReorder(ids,target);
  };
  return { begin, preview, clickCapture, cancel, step };
}
