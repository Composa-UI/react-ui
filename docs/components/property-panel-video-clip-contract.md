# PropertyPanel video-clip contract

`PropertyPanel` remains presentational in `mode="video-clip"`. The editor owns clip and media data; omitted callbacks retain the editable demo fallback.

- Header: controlled clip instance name. The existing compact options-menu pattern exposes Replace video and Delete clip callbacks without moving the header or changing its dimensions.
- Source: controlled read-only filename, resolution, and source-duration labels.
- Timeline: controlled start and duration in seconds. End remains derived as Start + Duration; editing End emits a new duration while preserving Start.
- Trim: controlled Trim in and Trim out values in seconds. Clipped duration remains a derived read-only label.
- Playback: controlled speed using the canonical options `0.25×`, `0.5×`, `0.75×`, `1×`, `1.25×`, `1.5×`, `2×`, and `4×`.
- Deferred affordances: Volume remains disabled with its existing “Audio coming soon” tooltip. Project video export remains the existing disabled project/app-shell affordance; the clip inspector does not invent a second export action.

Use `?view=clip-contract` for the controlled example. The normal video-clip inspector story continues to exercise demo fallbacks.
