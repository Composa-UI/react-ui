import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui3/Button";
import { ExportDialog, type ExportSettingsValue } from "@/components/ui3/ExportDialog";

// Non-modal inspector dialog: a labelled trigger opens the portalled surface,
// controlled by `open` (ModalFixture pattern). The dialog keeps no state — the
// four saved knobs are driven fully controlled and committed via onChange.
export default function ExportDialogFixture() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<ExportSettingsValue>({
    suffix: "@2x",
    colorProfile: "sRGB (same as file)",
    imageResampling: "Detailed",
    ignoreOverlappingLayers: false,
  });

  return (
    <ExportDialog
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <Button
          label="Export settings"
          variant="Secondary"
          icon={<Download size={14} strokeWidth={1.5} />}
          iconLead="left"
          onClick={() => setOpen(true)}
        />
      }
      value={value}
      onChange={patch => setValue(v => ({ ...v, ...patch }))}
    />
  );
}
