# Icon semantics

Composa controls consume icons by product meaning rather than choosing a
different glyph in each component. `IconSemantics.tsx` is the canonical registry
for those mappings.

## Settings entry points

Use the `settings` semantic for every button that opens a settings surface. It
maps to Lucide `Settings2` and renders at the normal dense-control size and
stroke: 16 by 16 pixels with a 1.5 stroke.

Current consumers include:

- Auto Layout Settings
- Type Settings
- Stroke Settings
- Template Settings
- Comp Transition Settings
- Object Animation Settings

Do not substitute `SlidersHorizontal`, tune, or filter variants based on the
contents of an individual settings surface. The entry-point meaning is
consistent even when the opened dialog contains different controls. New
settings triggers should resolve `iconForSemantic("settings")` rather than
importing a Lucide settings glyph directly.
