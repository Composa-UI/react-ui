# PropertyPanel project and still-export contracts

## Project mode

Project mode remains the static V1 inspector described by the product spec.

- `projectName` controls the existing static header label; it is intentionally not editable in V1.
- Canvas width, height, and frame rate accept controlled values and callbacks. Frame rate uses the canonical 24, 25, 30, and 60 fps options.
- Master duration and playhead accept controlled values and callbacks in seconds.
- The project Export section remains visibly disabled. Both MP4 and Export project carry the tooltip `Video export coming soon`; no video-export callback is exposed in V1.

## Element, selection, and slide still export

The existing Export section is shared by Element mode, multi-selection, and Slide mode.

- `exportSettings` contains stable rows with `id`, `scale`, `suffix`, and `format` (`PNG` or `JPG`).
- Add, remove, and update callbacks map to the section’s existing plus button, remove action, and row fields.
- In an expanded row, the trailing Remove export action aligns with the first
  input boxes after their labels. Optional Quality and Frame rate rows do not
  pull it lower. The action remains the final DOM item and keeps its existing
  accessible label and controlled callback.
- When at least one row exists, the existing full-width secondary action invokes `onExport` and uses `exportTargetName` for its label.
- Omitting `exportSettings` keeps the section’s editable local demo fallback.

Use `?view=project-contract` and `?view=export-contract` for controlled examples.
The export fixture accepts `exportMode=static|frame` and `format=PNG|JPG` query
parameters for deterministic geometry acceptance.
