// Live preview fixture for StrokeSettingsDialog — a non-modal inspector dialog,
// anchored beside the inspector rail, for editing a selection's stroke style,
// join, and cap. It portals through InspectorDialog, so (like ModalFixture) this
// launches it from a labelled trigger Button via controlled open/onClose state.
// Fully controlled: onChange emits Partial<{style, join, cap}> patches that merge
// into local stroke state and re-render the dialog. Exposes ONLY the three
// engine-backed properties — no width profile, miter angle, or Dynamic/Brush tabs.
import { useState } from "react";
import { Spline } from "lucide-react";

import {
  StrokeSettingsDialog,
  type StrokeSettingsValue,
} from "@/components/ui3/StrokeSettingsDialog";
import { Button } from "@/components/ui3/Button";

export default function StrokeSettingsDialogFixture() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<StrokeSettingsValue>({
    style: "solid",
    join: "miter",
    cap: "round",
  });

  return (
    <StrokeSettingsDialog
      open={open}
      value={value}
      onChange={patch => setValue(prev => ({ ...prev, ...patch }))}
      onClose={() => setOpen(false)}
      trigger={
        <Button
          ariaLabel="Stroke settings"
          variant="Secondary"
          size="small"
          iconLead="center"
          icon={<Spline size={14} strokeWidth={1.5} />}
          onClick={() => setOpen(o => !o)}
        />
      }
    />
  );
}
