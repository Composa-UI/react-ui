// Live preview fixture for UndoCard — the version-status card shown below an
// agent canvas edit: a state label plus a Secondary Undo/Redo toggle. Renders
// the REAL component controlled via reverted/onToggle so the label and button
// flip in place between "Current version" / Undo and "Reverted" / Redo. Tokens
// only — the card shape, label color, and button all come from the component's
// own c-* utilities and the Button primitive.
import { useState } from "react";

import { UndoCard } from "@/components/ui3/UndoCard";

export default function UndoCardFixture() {
  const [reverted, setReverted] = useState(false);

  return (
    <div style={{ width: 320 }}>
      <UndoCard reverted={reverted} onToggle={setReverted} />
    </div>
  );
}
