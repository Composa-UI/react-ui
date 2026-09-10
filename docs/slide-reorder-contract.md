# Slide reorder callbacks

SlidesPanel.onReorder, CompositionPanel.onSlideReorder and Timeline.onBlockReorder
emit (stableIds, targetIndex), where targetIndex addresses the remaining list after
removing every moving ID. Selected items retain source order. SlidesPanel requires
SlideData.id on every row for reorder; legacy display-only consumers still work.
The host owns document mutation, timing, selection and undo.

A four-pixel pointer threshold distinguishes dragging from ordinary activation.
The UI previews an insertion line and commits once on pointerup. Escape, pointer
cancellation, window blur, context menus, item-order changes, unmount and a disabled
lane clear the preview. No-op order drops emit no callback. Pointer listeners are
removed on every exit. Thumbnail edge scrolling keeps offscreen insertion reachable.

Keyboard: Alt+Up/Down in thumbnails, Alt+Left/Right in the composition lane. Existing
navigation/open/rename keys remain. Timeline reorder is additive: consumers that
omit onBlockReorder retain their existing onBlockMove callback and timing gestures.
Trimming remains separate. A locked composition lane omits mutation handlers and
blocks keyboard reorder while retaining selection/open/context-menu access.

Playground: ?view=slide-reorder-contract. Full app behavior and persisted timing
must be verified in the consuming project; this package owns neither.
