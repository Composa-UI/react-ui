# PropertyPanel element contracts

Element-mode sections remain presentational and retain their standalone demo state when controlled values are omitted.

- Appearance exposes opacity, blend mode, and uniform or independent corner radii.
- Layout exposes freeform/auto-layout mode, gap, padding, alignment, width/height sizing modes, and clipping through the existing flow, dimension, matrix, field, and checkbox anatomy. Gap is one controlled-or-standalone numeric combo: Fixed keeps the numeric edit-session contract, Auto represents space-between distribution, and entering Wrap atomically restores the last Fixed value because Wrap exposes Fixed only. Its leading icon follows the primary flow axis.
- Typography exposes family, weight, size, line height, letter spacing, horizontal alignment, vertical alignment, and the optional applied-style name. Detaching the existing style row clears `styleName`.
- Fill, Stroke, and Effects accept ordered, stable-ID rows. Existing plus, field/dialog, eye, drag row, and minus affordances emit add, update, toggle, reorder, and remove callbacks. Stroke additionally exposes weight and inside/center/outside alignment.
- Layout guides are composition-owned editor chrome and therefore do not render in Element mode.
- Multi-selection continues to use the existing mixed-state-capable inputs and now reaches the Position section’s multi-select affordance.

The UI package never mutates controlled arrays. Hosts apply emitted patches and pass the next state back. Use `?view=element-contract` for side-by-side text and auto-layout contract examples.
