import { useState } from "react";
import { Upload, Play, Pause, Star } from "lucide-react";
import { IconButton } from "@/components/ui3/IconButton";

// Default action, an active toggle (Play/Pause → aria-pressed), and a disabled
// button — the three states a consumer picks between.
export default function IconButtonFixture() {
  const [playing, setPlaying] = useState(false);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <IconButton label="Upload" icon={<Upload size={16} strokeWidth={1.5} />} onClick={() => undefined} />
      <IconButton
        label={playing ? "Pause" : "Play"}
        active={playing}
        onClick={() => setPlaying(p => !p)}
        icon={playing ? <Pause size={16} strokeWidth={1.5} /> : <Play size={16} strokeWidth={1.5} />}
      />
      <IconButton label="Favourite (unavailable)" disabled icon={<Star size={16} strokeWidth={1.5} />} />
    </div>
  );
}
