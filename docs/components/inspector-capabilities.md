# Inspector capability gates

`PropertyPanel` accepts an `InspectorCapabilities` object with `templates`, `styles`, `variables`, and `libraries` flags. The application owns these availability decisions; the UI remains presentational and does not infer backend support.

- `templates: false` omits the slide Template style section.
- `styles: false` omits inspector style entry points and reveals ordinary typography controls instead of an attached-style surface.
- `variables: false` removes variable creation entry points from PropertyPanel-owned color dialogs.
- `libraries: false` removes the Libraries tab from those dialogs and returns an already-open library view to Custom.

All flags default to `true` for standalone design-system demos. Capability gates do not disable core fills, strokes, effects, color editing, or ordinary dropdowns. Consumers can restore a capability later without replacing components or migrating document state.
