// Live preview fixture for EffectDetailsDialog — renders the REAL component from
// src. This is a non-modal inspector overlay, so (like ModalFixture) it is
// launched from a labelled trigger Button and its open + value state live on the
// always-mounted wrapper: the anchored body unmounts on close, so controlled
// state must sit outside it. A Drop shadow is shown because it exercises the full
// field set (position, blur, spread, color, opacity) plus the drop-only
// show-behind-transparent checkbox. `color` is intentionally omitted so the
// fixture carries no hardcoded hex — the component falls back to its data default.
import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui3/Button";
import { EffectDetailsDialog, type EffectDetailsValue } from "@/components/ui3/EffectDetailsDialog";

export default function EffectDetailsDialogFixture() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<EffectDetailsValue>({
    type: "Drop shadow",
    visible: true,
    x: 0,
    y: 4,
    blur: 8,
    spread: 0,
    opacity: 25,
    showBehindTransparent: false,
  });

  return (
    <EffectDetailsDialog
      open={open}
      value={value}
      onClose={() => setOpen(false)}
      onChange={patch => setValue(state => ({ ...state, ...patch }))}
      trigger={
        <Button
          label="Effect details"
          variant="Secondary"
          icon={<Sparkles size={14} strokeWidth={1.5} />}
          iconLead="left"
          onClick={() => setOpen(true)}
        />
      }
    />
  );
}
