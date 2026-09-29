// Live preview fixture for AiResponse — a completed agent turn in the chat
// thread: a left-aligned message body with a trailing thumbs up/down rating bar.
// Renders the REAL component with the RatingBar controlled via vote/onVote so the
// pick highlights in place. Tokens only — body text and rating icons all come
// from the component's own c-* utilities.
import { useState } from "react";

import { AiResponse } from "@/components/ui3/AiResponse";
import type { RatingVote } from "@/components/ui3/RatingBar";

export default function AiResponseFixture() {
  const [vote, setVote] = useState<RatingVote>(null);

  return (
    <div style={{ width: 320 }}>
      <AiResponse ratingProps={{ vote, onVote: setVote }}>
        Here&apos;s the <strong>staggered fade-in</strong> applied to your title —
        the headline eases in first, then the button follows ~120ms later.
      </AiResponse>
    </div>
  );
}
