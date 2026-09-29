// Live preview fixture for MultiChoiceCard — the inline single-select choice
// card embedded in an agent response: a lettered set of options with one active
// at a time. Renders the REAL component, controlled via selected/onSelect so the
// pick highlights in place. Tokens only — the card, badge, and label styling all
// come from the component's c-* utilities.
import { useState } from "react";

import { MultiChoiceCard } from "@/components/ui3/MultiChoiceCard";

// A small, representative set of lettered options for one inline decision.
const CHOICES = [
  { letter: "A", label: "Single column" },
  { letter: "B", label: "Two columns" },
  { letter: "C", label: "Sidebar + content" },
];

export default function MultiChoiceCardFixture() {
  const [choice, setChoice] = useState<string | null>("A");

  return (
    <div style={{ width: 280 }}>
      <MultiChoiceCard
        question="Which layout do you want?"
        choices={CHOICES}
        selected={choice}
        onSelect={setChoice}
      />
    </div>
  );
}
