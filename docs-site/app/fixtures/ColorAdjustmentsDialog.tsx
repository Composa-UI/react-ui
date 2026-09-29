// Live preview fixture for ColorAdjustmentsDialog — renders the REAL component
// from src. This is an overlay/dialog, so (like ModalFixture) it is launched
// from a labelled trigger Button and its open state lives on the always-mounted
// wrapper, matching the component's contract: the anchored body unmounts on
// close, so controlled value state must live outside it.
import { useState } from "react";
import { Sun } from "lucide-react";

import { Button } from "@/components/ui3/Button";
import { ColorAdjustmentsDialog } from "@/components/ui3/ColorAdjustmentsDialog";

// The Light group's engine-backed sliders we bind here; every other key keeps
// its own internal cosmetic state (per the component's controlled contract).
const CONTROLLED_KEYS = ["exposure", "contrast"] as const;

export default function ColorAdjustmentsDialogFixture() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, number>>({ exposure: 15, contrast: 10 });
  const [modified, setModified] = useState(false);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 200 }}>
        <ColorAdjustmentsDialog
          group="light"
          open={open}
          onClose={() => setOpen(false)}
          values={values}
          controlledKeys={CONTROLLED_KEYS}
          onValueChange={(key, value) => setValues(state => ({ ...state, [key]: value }))}
          onModifiedChange={setModified}
          trigger={
            <Button
              label="Light adjustments"
              variant="Secondary"
              icon={<Sun size={14} strokeWidth={1.5} />}
              iconLead="left"
              onClick={() => setOpen(true)}
            />
          }
        />
      </div>
      <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
        {modified ? "Modified" : "Default"}
      </span>
    </div>
  );
}
