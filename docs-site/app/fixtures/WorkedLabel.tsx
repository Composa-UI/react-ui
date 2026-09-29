import { useState } from "react";

import { WorkedLabel } from "@/components/ui3/WorkedLabel";

// Live demo for WorkedLabel — the agent work indicator shown above a response.
// Renders the "worked" state with a controlled disclosure so the chevron toggle
// is interactive; the reasoning steps expand/collapse on click.
export default function WorkedLabelFixture() {
  const [expanded, setExpanded] = useState(true);
  return (
    <WorkedLabel
      seconds="16s"
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      steps={[
        "Reading the conversation context...",
        "Determining the best approach...",
        "Formulating a response...",
      ]}
    />
  );
}
