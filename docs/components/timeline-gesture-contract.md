# Timeline gesture-boundary contract

`Timeline` exposes optional `onGestureStart` and `onGestureEnd` callbacks for host-owned transaction history. They wrap pointer drags without replacing the existing move and trim callbacks.

- One start fires on pointer down for a keyframe, slide block, or base clip.
- One end fires on pointer up with `{ cancelled: false }`.
- Pointer cancellation, lost capture, or Escape ends with `{ cancelled: true }` so the host can cancel instead of commit.
- Bubbling terminal events are deduplicated by the active gesture guard.
- Keyboard selection, opening, and trim steps remain discrete operations and do not emit pointer-gesture boundaries.

`TimelineGestureTarget` identifies the entity and action (`move`, `trim-start`, or `trim-end`); keyframe targets also include their track and property context.
