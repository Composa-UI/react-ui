# Base clips and layer-tree event contracts

## Timeline base-video row

The existing 32px Base video row accepts `baseClips` without changing the dock layout. Each `BaseClipBlock` supplies a stable ID, name, `[startMs, endMs]` range, selected state, and optional thumbnail or tint.

- Click and double-click emit select/open callbacks.
- Dragging the existing block body emits a new start time.
- Dragging the existing edge grips emits start/end trim times.
- An omitted or empty `baseClips` array preserves the previous empty placeholder lane.

## LayerList

The existing layer row remains the visual and interaction owner.

- Existing lock and visibility glyphs are semantic buttons that emit the next `locked` or `visible` state.
- Double-click requests rename; right-click emits the row context-menu event.
- When reorder or reparent callbacks are supplied, existing rows become draggable. Dropping in a group row’s middle third requests reparenting; dropping above or below requests reorder before or after.
- These callbacks do not mutate the provided tree. Controlled hosts update `layers`; omitted callbacks preserve the original demo and selection behavior.

Use `?view=base-clips-contract` and `?view=layers-contract` for controlled examples. No drag indicators, menus, or inline rename fields are added by these seams.
