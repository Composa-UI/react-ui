# Overlay theme contract

Radix renders dialogs and tooltips under `document.body`, outside the editor shell that owns `data-composa-mode`. `Modal` and `Tooltip` therefore mirror the active Composa mode onto their portalled content so token utilities resolve exactly as they do inside the shell.

- The application continues to own the active mode on its shell root.
- Overlay components own propagation across the portal boundary.
- Wrap each independently themed editor root's overlay-producing subtree in `ComposaModeProvider`; it anchors to the nearest `data-composa-mode` root, so mixed light/dark editors do not leak mode into one another.
- Consumers must not repair portal colors with app-specific CSS overrides.
- Menus that are intentionally always dark retain their existing explicit dark mode.
- Inspector `PopoverMenu` content uses the shared Radix portal with nearest-root mode, Escape/outside dismissal, trigger-focus return, and viewport collision padding. Menus may escape an inspector's clipped panel bounds but must flip or shift before crossing the viewport edge.

Use `?view=overlay-theme-contract` in the playground to inspect an open modal and hover tooltip inside a dark shell. Switching or removing the shell mode is observed without remounting the overlay component.
