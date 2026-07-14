# PropertyPanel element contracts

Element-mode sections remain presentational and retain their standalone demo state when controlled values are omitted.

- Appearance exposes opacity, blend mode, and uniform or independent corner radii.
- Layout exposes freeform/auto-layout mode, gap, padding, alignment, width/height sizing modes, constraints, and clipping through shared controls. Plain frames expose Freeform; active auto-layout exposes Vertical, Horizontal, and Wrap in that order. Auto-layout's first row combines Flow + Gap and repeats the section-header settings action; both settings triggers emit `onAutoLayoutSettingsRequest` for the same host-owned dialog. Alignment is separate, followed by Padding and Dimensions. Gap is one controlled-or-standalone numeric combo: Fixed keeps the numeric edit-session contract, Auto represents space-between distribution, and entering Wrap atomically restores the last Fixed value because Wrap exposes Fixed only. Its leading icon follows the primary flow axis.
- Every Dimensions row uses the same menu-backed numeric sizing fields. The host supplies `layout.availableWidthModes` / `availableHeightModes` (the valid intersection for a mixed selection), mode mixed flags, and optional min/max values. Hug, Fill, and Mixed are visible in the trigger segment while the resolved numeric size remains editable. Editing a relative size emits `onSizingChange(axis, { mode: "fixed", value })` as one semantic action.
- Sizing menus expose Fixed (with the current resolved value), valid Hug/Fill choices, and Add/Remove min/max actions. Constraint fields appear below in the shared Min W / Min H / Max W / Max H grid and participate in the panel's numeric edit-session callbacks. `onSizingConstraintChange` owns constraint mutations. Apply variable is omitted unless the variables capability is enabled; `onApplySizingVariable` owns the enabled action.
- Typography exposes family, weight, size, line height, letter spacing, horizontal alignment, vertical alignment, and the optional applied-style name. Detaching the existing style row clears `styleName`.
- Fill, Stroke, and Effects accept ordered, stable-ID rows. Existing plus, field/dialog, eye, drag row, and minus affordances emit add, update, toggle, reorder, and remove callbacks. Stroke additionally exposes weight and inside/center/outside alignment.
- Layout guides are composition-owned editor chrome and therefore do not render in Element mode.
- Multi-selection continues to use the existing mixed-state-capable inputs and now reaches the Position section’s multi-select affordance.

The UI package never mutates controlled arrays. Hosts apply emitted patches and pass the next state back. Use `?view=element-contract` for side-by-side text and auto-layout contract examples.
