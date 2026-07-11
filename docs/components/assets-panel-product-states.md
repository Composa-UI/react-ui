# Assets panel product-state contract

`AssetsPanel` preserves the 240px UI3 shell while exposing asset behavior to the application. The component never uploads, inserts, renames, or deletes media itself.

## Controlled data

- Pass `assets` with stable IDs, `kind`, `status`, and optional `progress`, `errorMessage`, and `inUseCount`.
- Control search and filtering with `query` / `onQueryChange` and `filter` / `onFilterChange`.
- Control selection with `selectedId` / `onSelect`.
- `status: "uploading"` renders progress; `status: "error"` renders the error and invokes `onRetry`.
- Empty projects and empty search/filter results retain distinct states.

## Product actions

- Images invoke `onInsert`; videos invoke `onAddToTimeline` from both double-click and the quick/context actions.
- Rename uses the existing dialog and calls `onRename(id, trimmedName)` on confirmation.
- Delete calls `onDelete` immediately when `inUseCount` is zero. Referenced assets show the existing confirmation dialog first and include the reference count.
- Right-click opens the existing UI3 menu and also invokes `onContextMenu`, allowing the host to observe or coordinate the action.
- Upload selection and file drops remain host-owned through `onUpload` and `onDropFiles`.

## Ownership

The panel owns transient presentation state such as open menus and dialogs. The application owns the asset collection and every resulting mutation. Omitting controlled props preserves the standalone demo fallback used for visual review.

Use `?view=assets-contract` in the playground to inspect ready image/video actions, upload progress, upload failure/retry, rename, in-use deletion, search, and filtering.
