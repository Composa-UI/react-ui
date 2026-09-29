// Live preview fixture for InspectorDialog — renders the REAL component from src.
// This is a non-modal inspector overlay that portals above the canvas, so (like
// ModalFixture) it launches from a labelled trigger Button and its open state
// lives on the always-mounted wrapper. InspectorDialog captures the `trigger`
// for anchoring; the first element child (InspectorDialogHeader) becomes the drag
// handle. The body is a small, representative Type-settings surface with a
// controlled numeric size input so the demo is interactive.
import { useState } from "react";
import { Type } from "lucide-react";

import { Button } from "@/components/ui3/Button";
import { InspectorDialog, InspectorDialogHeader } from "@/components/ui3/InspectorDialog";
import { NumericInput } from "@/components/ui3/Input";

export default function InspectorDialogFixture() {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(16);

  return (
    <InspectorDialog
      open={open}
      onClose={() => setOpen(false)}
      ariaLabel="Type settings"
      trigger={
        <Button
          ariaLabel="Type settings"
          variant="Secondary"
          size="small"
          iconLead="center"
          icon={<Type size={14} strokeWidth={1.5} />}
          onClick={() => setOpen(o => !o)}
        />
      }
    >
      <InspectorDialogHeader title="Type" onClose={() => setOpen(false)} />
      <div style={{ padding: "12px 16px 16px", display: "grid", gap: 8 }}>
        <NumericInput ariaLabel="Font size" value={size} min={1} max={999} suffix="px" onChange={setSize} />
      </div>
    </InspectorDialog>
  );
}
