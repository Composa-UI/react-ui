# PropertyPanel slide contract

`PropertyPanel` remains presentational in `mode="slide"`. The editor owns slide data and passes controlled values and callbacks; omitting them retains the editable demo fallbacks used by the playground.

## Controlled groups

- Header: `slideName`, `onSlideNameChange`, `onDuplicateSlide`, and `onDeleteSlide`.
- Timing: `slideStart` and `slideDuration`, expressed in seconds. Editing End emits a derived duration while preserving Start.
- Slide state: `slideSkipped` and `onSlideSkippedChange`, exposed through the existing slide-options menu.
- Background: type, color, and opacity values plus matching callbacks. The existing segmented control, compact color row, and shared color dialog own the interaction.
- Transition: type, direction, duration in milliseconds, and easing plus matching callbacks. Direction is visible only for Push, Slide, and Wipe; duration and easing are hidden for None.

Use `?view=slide-contract` in the playground to exercise the controlled contract. The normal slide inspector remains the uncontrolled/demo example. Neither mode introduces product state into `@composa/ui`.

`SlideData.onClick` receives the row mouse event so hosts can implement additive Cmd/Ctrl selection and Shift-range selection while the slide row remains owned by the kit. Existing zero-argument callbacks remain assignable.
