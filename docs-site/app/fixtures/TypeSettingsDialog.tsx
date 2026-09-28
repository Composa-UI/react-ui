// Live preview fixture for TypeSettingsDialog — an anchored, non-modal
// typography dialog that floats beside the inspector rail. It portals through
// InspectorDialog, so (like ModalFixture / StrokeSettingsDialogFixture) this
// launches it from a labelled trigger Button via controlled open/onClose state.
// Fully controlled: onChange emits a TypeSettingsPatch that merges into local
// type state and re-renders the dialog. Supplies one representative selection —
// no mixed / read-only / keyframe variants here.
import { useState } from "react";
import { Type } from "lucide-react";

import {
  TypeSettingsDialog,
  type TypeSettingsValue,
} from "@/components/ui3/TypeSettingsDialog";
import { Button } from "@/components/ui3/Button";

export default function TypeSettingsDialogFixture() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<TypeSettingsValue>({
    align: "left",
    verticalAlign: "top",
    decoration: "none",
    textCase: "none",
    weight: 500,
    lineHeight: 120,
    letterSpacing: 0,
  });

  return (
    <TypeSettingsDialog
      open={open}
      value={value}
      onChange={patch => setValue(prev => ({ ...prev, ...patch }))}
      onClose={() => setOpen(false)}
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
    />
  );
}
