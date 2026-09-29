// Live preview fixture for UserBubble — a right-aligned user turn in the Agent
// chat thread: a text bubble with an optional context chip floating above it and
// a 24px avatar to its right. Renders the REAL component with the "element"
// selection chip (the authored annotation example). Presentational only, so
// there is nothing to control; tokens come entirely from the component's own
// c-* utilities.
import { UserBubble } from "@/components/ui3/UserBubble";

export default function UserBubbleFixture() {
  return (
    <div style={{ width: 320, display: "flex", justifyContent: "flex-end" }}>
      <UserBubble
        text="Turn this into a video"
        chip={{ type: "element", label: "Hero Section", kind: "frame" }}
      />
    </div>
  );
}
