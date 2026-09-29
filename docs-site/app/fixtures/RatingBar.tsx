// Live preview fixture for RatingBar — the thumbs up/down feedback row shown
// beneath an AI response, with a trailing info affordance. Rendered controlled
// via vote/onVote so the active pick highlights in place and re-clicking the
// active vote clears it. Tokens only — the icons and states come entirely from
// the component's own c-* utilities.
import { useState } from "react";

import { RatingBar, type RatingVote } from "@/components/ui3/RatingBar";

export default function RatingBarFixture() {
  const [vote, setVote] = useState<RatingVote>(null);

  return (
    <div style={{ width: 120 }}>
      <RatingBar vote={vote} onVote={setVote} />
    </div>
  );
}
