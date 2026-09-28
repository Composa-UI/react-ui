// Live preview fixture for FontPickerDialog — an anchored, non-modal font
// picker. Like ModalFixture, this overlay portals and needs an open state, so
// it renders behind a labelled trigger Button: click the trigger to open the
// dialog, pick a family (each row previews in its own face), and the owner
// applies the choice and closes. Driven controlled off `value`/`onSelect`.
import { useState } from "react";
import { Type } from "lucide-react";

import { Button } from "@/components/ui3/Button";
import { FontPickerDialog } from "@/components/ui3/FontPickerDialog";

export default function FontPickerDialogFixture() {
  const [open, setOpen] = useState(false);
  const [font, setFont] = useState("Inter");
  return (
    <FontPickerDialog
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <Button
          label={font}
          variant="Secondary"
          icon={<Type size={14} strokeWidth={1.5} />}
          iconLead="left"
          onClick={() => setOpen(true)}
        />
      }
      value={font}
      onSelect={name => {
        setFont(name);
        setOpen(false);
      }}
    />
  );
}
