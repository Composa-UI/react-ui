# Timeline and AssetsPanel contracts

Both components remain presentational. Hosts own project state and side effects; omitting controlled props retains the existing playground data and local interaction state.

## Timeline

- Transport: `playing` / `onPlayingChange`, `loop` / `onLoopChange`, `onStop`, and `onAddKeyframe(timeMs)` bind the existing Play, Stop, Loop, and slide-only diamond controls.
- Master blocks: `onBlockMove(id, startMs)` and `onBlockTrim(id, edge, timeMs)` report drags from the existing block body and edge grips.
- Keyframes: tracks and properties accept optional stable IDs; keyframes accept legacy millisecond numbers or `{ id, timeMs, selected }` records. Add, select, Shift-add, move, and delete callbacks include stable track/property/keyframe context.
- `playhead` remains independently controllable and is the time supplied by add-keyframe callbacks.
- Slide-local transport and playhead remain visible and operable when `tracks` is
  empty; composition duration exists independently of layer count.
- Video/audio waveform bars keep a 2px vertical inset and render varied supplied
  peaks rather than touching the strip boundary.

The callback layer does not mutate document data. A controlled host updates blocks or keyframes in response, while the demo fallback continues to render the original sample tracks.

## AssetsPanel

- `assets`, search query, type filter, and selected ID retain controlled/uncontrolled behavior.
- Selection passes the card mouse event so a host can implement modifier-based selection without recreating the grid.
- `onUpload` binds the existing header and empty-state actions.
- `onDropFiles` receives browser `File` objects from a panel drop. `dropActive`, `defaultDropActive`, and `onDropActiveChange` control the existing drop overlay.
- Insert, add-to-timeline, delete, context-menu, and retry callbacks remain unchanged.
- Every thumbnail has a resting `c-border` inset ring so white media remains
  distinguishable from the panel; selection strengthens the same token family.

Use `?view=controlled-contracts` for Timeline transport and `?view=assets-contract` for AssetsPanel search/filter/selection. These examples add no application behavior to the UI package.
