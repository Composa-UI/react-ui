# Base clips and layer-tree event contracts

## Timeline base-video row

The existing 32px Base video row accepts `baseClips` without changing the dock layout. Each `BaseClipBlock` supplies a stable ID, name, `[startMs, endMs]` range, selected state, and optional thumbnail or tint.

- Click and double-click emit select/open callbacks.
- Dragging the existing block body emits a new start time.
- Dragging the existing edge grips emits start/end trim times plus optional `{ source, millisecondsPerPixel }` detail so controlled hosts can apply zoom-independent magnetic snapping. Pointer and keyboard sources are distinguished; the legacy three-argument callback remains compatible.
- An omitted or empty `baseClips` array preserves the previous empty placeholder lane.

## LayerList

The existing layer row remains the visual and interaction owner.

- Existing lock and visibility glyphs are semantic buttons that emit the next `locked` or `visible` state.
- The treeitem keeps `aria-label={node.name}` so child action labels do not change the stable row name used by selection and consumer tests.
- Controlled hosts may pass `selectedIds` for true multi-row selection. `onSelectionChange` receives normalized `{ toggle, range, visibleOrder }` data from either pointer or keyboard activation so the host can implement Cmd/Ctrl toggle and Shift-range semantics safely against the currently expanded tree; the legacy `selectedId` contract remains compatible.
- Multiple selected rows render distinct or merged selection ranges without converting selected descendants into a single parent selection.
- Double-click requests rename; right-click emits the row context-menu event.
- When reorder or reparent callbacks are supplied, existing rows become draggable. Dropping in a group row’s middle third requests reparenting; dropping above or below requests reorder before or after.
- These callbacks do not mutate the provided tree. Controlled hosts update `layers`; omitted callbacks preserve the original demo and selection behavior.
- `CompositionPanel` forwards every seam with the `onLayer…` prefix so the application can consume the composed Compositions/Layers template without reaching into `LayerList`.

Use `?view=base-clips-contract` and `?view=layers-contract` for controlled examples. No drag indicators, menus, or inline rename fields are added by these seams.
