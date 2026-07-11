# Overlay theme contract

Radix renders dialogs and tooltips under `document.body`, outside the editor shell that owns `data-composa-mode`. `Modal` and `Tooltip` therefore mirror the active Composa mode onto their portalled content so token utilities resolve exactly as they do inside the shell.

- The application continues to own the active mode on its shell root.
- Overlay components own propagation across the portal boundary.
- Consumers must not repair portal colors with app-specific CSS overrides.
- Menus that are intentionally always dark retain their existing explicit dark mode.

Use `?view=overlay-theme-contract` in the playground to inspect an open modal and hover tooltip inside a dark shell. Switching or removing the shell mode is observed without remounting the overlay component.
