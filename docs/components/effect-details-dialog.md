# Effect details dialog

`EffectDetailsDialog` is the canonical UI3 inspector dialog for editing one effect. It is presentational and controlled: the host owns the effect document value, history, persistence, rendering, and validation.

## Contract

- `value.type` selects Drop shadow, Inner shadow, Layer blur, or Background blur.
- Shadow effects expose X, Y, blur, spread, color, and opacity.
- Drop shadow additionally exposes `showBehindTransparent`.
- Blur effects expose only their blur radius.
- Header visibility toggles `value.visible`.
- Every edit emits a partial patch through `onChange`; closing emits no document mutation.

The dialog uses the shared Radix-backed `InspectorDialog`: it captures the launch rectangle, portals to the left of the inspector, restores trigger focus, dismisses on outside click or Escape, propagates mode, and uses UI3 tokens. It is intentionally non-modal and does not trap focus. Effect color is restricted to the shared solid-color dialog and respects host capability gates. The compact Effects row remains a summary/trigger; application behavior stays outside `@composa/ui`.
