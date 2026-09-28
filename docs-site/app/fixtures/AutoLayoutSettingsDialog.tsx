// Live preview fixture for AutoLayoutSettingsDialog — a non-modal inspector
// dialog for an auto-layout frame's secondary settings (stroke inclusion,
// canvas stacking, text-baseline alignment). It portals through InspectorDialog,
// so this launches it from a labelled trigger Button through controlled
// open/onClose state (the ModalFixture pattern). `mode: "horizontal"` renders all
// three rows and keeps the text-baseline toggle applicable. Fully controlled:
// onChange patches merge into local value state and re-render the dialog.
import { useState } from "react";
import { Settings2 } from "lucide-react";

import {
  AutoLayoutSettingsDialog,
  type AutoLayoutSettingsValue,
} from "@/components/ui3/AutoLayoutSettingsDialog";
import { Button } from "@/components/ui3/Button";

export default function AutoLayoutSettingsDialogFixture() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<AutoLayoutSettingsValue>({
    mode: "horizontal",
    textBaseline: false,
    strokeSizing: "excluded",
    canvasStacking: "last-on-top",
  });

  return (
    <AutoLayoutSettingsDialog
      open={open}
      value={value}
      onClose={() => setOpen(false)}
      onChange={patch => setValue(prev => ({ ...prev, ...patch }))}
      trigger={
        <Button
          ariaLabel="Auto layout settings"
          variant="Secondary"
          size="small"
          iconLead="center"
          icon={<Settings2 size={14} strokeWidth={1.5} />}
          onClick={() => setOpen(o => !o)}
        />
      }
    />
  );
}
