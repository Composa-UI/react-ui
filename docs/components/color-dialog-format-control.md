# Color dialog format control

The Color dialog owns a presentation-only format chooser for its editable color
value. The chooser exposes **Hex**, **RGB**, **CSS**, **HSL**, and **HSB** in one
canonical `PopoverMenu`; activating the trigger must not silently cycle formats.

- The trigger is labelled `Color format: {current}`.
- Menu rows use radio selection semantics and expose the current format.
- Pointer, Enter, or Space chooses the exact requested format in one action.
- Choosing a format changes only the dialog's local representation. It never
  calls color, hue, or opacity mutation callbacks.
- Escape, outside dismissal, overlay placement, and trigger focus return remain
  owned by the shared `PopoverMenu` primitive.

The application continues to own persisted paint values. This control introduces
no product or document state.
