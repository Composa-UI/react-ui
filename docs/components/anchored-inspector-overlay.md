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

- Default placement is left/start with an 8px trigger offset and 8px collision
  padding. When the trigger is inside `[data-composa-overlay-boundary]`, the
  nearest marked workspace becomes the collision boundary; otherwise the
  viewport remains the fallback. Radix may flip or shift the surface to keep it
  visible.
- The surface height is capped by Radix's available-height measurement for that
  captured boundary. Dialog bodies remain responsible for their own scrolling.
- Portalled content mounts only after a real launch rectangle is captured. This
  prevents a top-left measuring flash and freezes the launch position while the
  inspector scrolls.
- Mode is captured from the trigger's nearest explicit `data-composa-mode` root.
  Mixed light/dark sibling fixtures must label both roots (`light` and `dark`);
  page order or the previously focused editor never selects the overlay theme.
- Focus is trapped by default and returns to the captured trigger on close.
- Escape and outside pointer interaction close through `onClose`.
- `blockOutsideDismiss` supports a nested picker without closing its owner.
- The overlay shares the canonical `z-50` floating-surface layer so menus,
  tooltips, and dialogs portalled later from inside it remain interactive above
  their owner.
- The compact default width is 240px. Consumers may provide a larger width when
  an approved dialog reference requires it.

`InspectorDialog` remains a compatibility wrapper and opts out of focus
trapping for existing non-modal Effects behavior. Its chrome is non-selectable
by default so dragging across labels or empty dialog space cannot create a
browser selection. Native `input` and `textarea` descendants explicitly restore
text selection, caret editing, drag selection, and Select All.

Use `?view=issue-77-anchored-overlay` in the playground for light/dark,
clipped-panel, workspace-boundary, and viewport-edge verification.

The component-level suite verifies controlled props and callbacks through a
Radix boundary mock. `npm run test:e2e` exercises the real Radix package in the
playground and proves body-portal escape, workspace/viewport collision, available
height capping, modal tab cycling, Escape/outside dismissal with trigger focus
return, nested-layer ownership, and the non-modal `InspectorDialog`
compatibility path. App E2E remains responsible for each product dialog body's
controlled values and engine round trip.
