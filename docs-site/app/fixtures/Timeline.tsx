// Live preview fixture for Timeline (composite). Renders the REAL component in
// slide-local mode — a slide's element-animation view (ms) driven entirely by
// controlled data, matching the annotation's authored `code.example`.
import { useState } from "react";

import { Timeline, type Track } from "@/components/ui3/Timeline";

// Small, representative slide-local layer set: two animated layers with a couple
// of property tracks each, keyframes inside the 5s window. Tokens/props only — no
// hardcoded colors (selection/accent colouring is owned by the component).
const TRACKS: Track[] = [
  {
    id: "title",
    name: "Title",
    type: "text",
    expanded: true,
    bar: [0, 3200],
    props: [
      { id: "title-opacity", name: "Opacity", value: 100, bar: [0, 1200], keyframes: [0, 600, 1200] },
      { id: "title-y", name: "Position", accent: true, keyframes: [0, 800, 2400] },
    ],
  },
  {
    id: "badge",
    name: "Badge",
    type: "image",
    bar: [1600, 4600],
    props: [
      { id: "badge-scale", name: "Scale", value: 80, keyframes: [1600, 2600, 4600] },
    ],
  },
];

export default function TimelineFixture() {
  const [playhead, setPlayhead] = useState(1200);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedRow, setSelectedRow] = useState<string | null>("title-opacity");

  return (
    <div style={{ width: "100%" }}>
      <Timeline
        mode="slide"
        tracks={TRACKS}
        duration={5000}
        height={240}
        playhead={playhead}
        onPlayheadChange={(ms) => setPlayhead(ms)}
        playing={playing}
        onPlayingChange={setPlaying}
        autoKeyframe={recording}
        onAutoKeyframeChange={setRecording}
        selectedTimelineRowId={selectedRow}
        onPropertyRowSelect={(propertyId) => setSelectedRow(propertyId)}
        onBack={() => undefined}
      />
    </div>
  );
}
