# Color and opacity keyframe placement

Owner review ledger row70 requires the diamond immediately to the right of the
value it animates. When independent color and opacity controls are present,
ColorInput renders: swatch/hex → color diamond → opacity/% → opacity diamond.
The color diamond must precede the opacity input in DOM and visual order.

Use canonical FieldShell and FieldAction seams, focus treatment, disabled state
and pressed state. No app-specific CSS or new animation state is introduced.
ColorInput instances without the independent color action retain their existing
joined color/opacity field. Variable and hidden-opacity behavior is unchanged.
