# Timeline viewport and aggregate-key contract

`Timeline` owns time-axis rendering and gestures while the host owns editor state. The optional `viewport` / `defaultViewport` pair uses composition-local milliseconds and follows the package's controlled/uncontrolled conventions. `onViewportChange` identifies `wheel-zoom`, `wheel-pan`, `zoom-control`, `keyframe-reveal`, and `edge-drag`; viewport changes are presentation state and do not emit document gesture boundaries.

Ctrl/Cmd + wheel zooms around the pointer's position in the track area. Horizontal wheel input pans without changing the visible duration; Shift + vertical wheel is the documented mouse-wheel pan fallback. DOM delta modes are normalized to pixels and the native listener is explicitly non-passive. The accessible Timeline zoom slider changes the same viewport around its center. Rulers, blocks, property lanes, drag deltas, aggregate keys, and both playhead surfaces use the same viewport transform and clip at the plot boundary.

Master mode presents Compositions, Base video, and a non-interactive Audio seam.
The Audio row advertises future track ownership without exposing fake clips or
editing controls before the app has an audio document model.

Without a controlled viewport or explicit `defaultViewport`, the untouched timeline follows the full duration when duration or mode changes. Once the user zooms or pans, later context changes clamp the current window instead of destroying that zoom. An explicit `defaultViewport` is always treated as an intentional initial window.

Composition-local keyframe drags auto-pan continuously inside a 32 CSS-pixel
edge zone of the actual property lane. A quadratic ramp reaches 720 CSS pixels
per second at and beyond the edge; animation-frame elapsed time is capped at
32ms. Auto-pan preserves zoom and playhead time, clamps at the composition
duration, and emits `edge-drag`. Master blocks, media clips, ruler scrub, and
keyboard edits do not opt into this behavior.

`interactionContextKey` is separate from the viewport. It gives controlled
hosts an explicit cancellation boundary when the active composition/project
changes without changing mode or duration.

Tracks may provide visual `depth` and controlled `expanded` state. Expansion only controls that track's property rows and emits `onTrackExpandedChange`; product hierarchy remains host-owned. If the callback is absent, the disclosure is a non-focusable visual affordance rather than a no-op button.

Aggregate keys are an opt-in capability enabled by `onAggregateKeyframeSelect`; without that callback, no aggregate indicators render. When enabled, the layer row derives aggregate keys by exact millisecond equality across its property tracks. An aggregate is complete when every property has a key at that time. Selecting one emits the stable underlying keyframe IDs and exposes complete/partial status in its accessible name. Legacy numeric keyframes retain their exact individual callback IDs; property-qualified identities are used only for aggregation.
