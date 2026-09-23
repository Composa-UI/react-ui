# Inspector capability gates

`PropertyPanel` accepts an `InspectorCapabilities` object with `styles`, `variables`, and `libraries` flags. The application owns these availability decisions; the UI remains presentational and does not infer backend support.

- `styles: false` omits inspector style entry points and reveals ordinary typography controls instead of an attached-style surface.
- `variables: false` removes variable creation entry points from PropertyPanel-owned color dialogs.
- `libraries: false` removes the Libraries tab from those dialogs and returns an already-open library view to Custom.

All flags default to `true` for standalone design-system demos. Capability gates do not disable core fills, strokes, effects, color editing, or ordinary dropdowns. Consumers can restore a capability later without replacing components or migrating document state.

## Slide template — composition-driven (DEC-097)

The slide Template style section is no longer a capability flag. `capabilities.templates` has been retired: the section is composition-driven and renders **iff its data is provided** via the `slideTemplate?: SlideTemplateStyle` prop (`{ name?, fonts? }`). Pass an empty object (`slideTemplate={{}}`) to show the section with its default preview, supply `name`/`fonts` to reflect the active template, or omit the prop entirely to omit the section. This mirrors the other presence-driven sections (`mask`, `generatedControls`): the section set is composed from provided data rather than derived from a boolean gate.
