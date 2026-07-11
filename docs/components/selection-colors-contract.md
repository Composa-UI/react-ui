# Selection Colors contract

Selection Colors is always expanded in Slide mode and element multi-select mode. The section has no collapsed chip summary or expand affordance.

- When `selectionColors` is supplied, every controlled color renders as an editable row with its stable ID.
- An explicit empty array renders `No shared colors`.
- Demo colors appear only when the prop is absent.
- ColorDialog editing and inspector capability gates remain available per their existing contracts.

Use `?view=slide-contract` for controlled rows and `?view=selection-colors-empty` for the explicit-empty state.
