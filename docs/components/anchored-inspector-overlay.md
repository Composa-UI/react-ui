# Anchored inspector overlay

`AnchoredInspectorOverlay` is the shared UI boundary for inspector-owned
dialogs and popovers that must escape panel clipping while remaining attached
to the control that launched them.

## Ownership

- The UI component owns trigger-rectangle capture, body portal rendering,
  collision-aware flip/shift, focus trapping and return, Escape dismissal,
  outside-click dismissal, light/dark mode propagation, and surface anatomy.
- The application owns whether the overlay is open, document values, commands,
  undo/history, persistence, validation, and engine adapters.
- Individual Fill, Stroke, Effects, Typography, Animation Styles, and Auto
  Layout Settings bodies remain separate issue slices.

## Contract

- Default placement is left/start with an 8px trigger offset and 8px viewport
  collision padding. Radix may flip or shift the surface to keep it visible.
- Portalled content mounts only after a real launch rectangle is captured. This
  prevents a top-left measuring flash and freezes the launch position while the
  inspector scrolls.
- Mode is captured from the trigger's nearest explicit `data-composa-mode` root.
  Mixed light/dark sibling fixtures must label both roots (`light` and `dark`);
  page order or the previously focused editor never selects the overlay theme.
- Focus is trapped by default and returns to the captured trigger on close.
- Escape and outside pointer interaction close through `onClose`.
- `blockOutsideDismiss` supports a nested picker without closing its owner.
- The compact default width is 240px. Consumers may provide a larger width when
  an approved dialog reference requires it.

`InspectorDialog` remains a compatibility wrapper and opts out of focus
trapping for existing non-modal Effects behavior.

Use `?view=issue-77-anchored-overlay` in the playground for light/dark,
clipped-panel, and viewport-edge verification.

The component-level suite executes capture, virtual-anchor, portal, collision,
focus, and dismissal event contracts through a Radix boundary mock. Final
browser geometry (actual flip direction and tab-cycle behavior) remains an app
E2E responsibility once consumers wire individual dialog bodies.
