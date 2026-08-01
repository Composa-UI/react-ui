// ─── Native drag-image suppression ───────────────────────────────────────────
// Every HTML5 drag paints a translucent snapshot of the dragged element under
// the cursor unless the dragstart handler says otherwise. The owner has asked
// for that ghost gone twice — once for the stackable inspector sections
// (Fill · Stroke · Effects) and once for the layer list — so the suppression
// lives in ONE helper that both surfaces call. `grep -rn setDragImage src/`
// returned nothing before this: no pass had ever attempted it.
//
// Why a 1×1 transparent element rather than something more direct:
//  · `setDragImage(null, 0, 0)` is not honoured — the type rejects it and
//    browsers fall back to the default snapshot.
//  · `preventDefault()` on dragstart cancels the drag outright.
//  · Hiding the source row (`display:none`, `opacity:0`) during dragstart also
//    blanks the row itself, and in WebKit cancels the drag.
// A detached-but-attached transparent node is the only cross-browser way.
//
// Removing the ghost does NOT leave a drag unexplained: both surfaces already
// paint a 2px accent insertion line at the drop gap (PanelReorderableEntry's
// `data-composa-reorder-indicator`; LayerList's `dropZone`), which is the
// feedback that actually tells you where the entry lands.

/** The slice of a drag event this helper needs. A React `DragEvent` satisfies it. */
export interface NativeDragImageEvent {
  dataTransfer: Pick<DataTransfer, "setDragImage"> | null;
  /** Used to reach the document the row actually lives in (portals, iframes). */
  currentTarget?: { ownerDocument?: Document | null } | null;
}

/**
 * Replace the browser's default drag ghost with a 1×1 transparent node.
 *
 * Safe to call in a non-DOM environment and on a `dataTransfer` that does not
 * implement `setDragImage` — it simply does nothing, leaving the drag itself
 * untouched. Call it AFTER any `preventDefault()` early-return, so an aborted
 * drag never allocates a node.
 */
export function suppressNativeDragImage(event: NativeDragImageEvent): void {
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer || typeof dataTransfer.setDragImage !== "function") return;
  const doc = event.currentTarget?.ownerDocument ?? (typeof document === "undefined" ? null : document);
  const body = doc?.body;
  if (!doc || !body) return;

  const ghost = doc.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.setAttribute("data-composa-drag-ghost", "");
  // Off-screen rather than `display:none`: a node with no box produces no drag
  // image at all in Chrome, which falls back to the default snapshot.
  ghost.style.cssText =
    "position:fixed;top:-10000px;left:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;";
  body.appendChild(ghost);
  dataTransfer.setDragImage(ghost, 0, 0);
  // The node only has to exist for the synchronous snapshot setDragImage takes;
  // a macrotask later the drag owns its image and the node is dead weight.
  setTimeout(() => { try { body.removeChild(ghost); } catch { /* already detached */ } }, 0);
}
