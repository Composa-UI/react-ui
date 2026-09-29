// Live preview fixture for ColorDialog — renders the REAL component from src.
// This is an overlay/dialog (a non-modal InspectorDialog anchored to its
// trigger), so — like ModalFixture / ColorAdjustmentsDialogFixture — it is
// launched from a labelled trigger Button and its open + value state lives on
// the always-mounted wrapper: the anchored surface unmounts on close, so any
// controlled value must live outside it.
import { useState } from "react";
import { Palette } from "lucide-react";

import { Button } from "@/components/ui3/Button";
import { ColorDialog, type FillType } from "@/components/ui3/ColorDialog";

export default function ColorDialogFixture() {
  const [open, setOpen] = useState(false);
  // Picker hex is carried WITHOUT a leading "#", matching the component's
  // controlled contract (its default is "FFFFFF").
  const [hex, setHex] = useState("795EE4");
  const [hue, setHue] = useState(264);
  const [fillType, setFillType] = useState<FillType>("solid");

  return (
    <div style={{ width: 200 }}>
      <ColorDialog
        open={open}
        onClose={() => setOpen(false)}
        trigger={
          <Button
            label="Fill color"
            variant="Secondary"
            icon={<Palette size={14} strokeWidth={1.5} />}
            iconLead="left"
            onClick={() => setOpen(true)}
          />
        }
        hex={hex}
        onHexChange={setHex}
        hue={hue}
        onHueChange={setHue}
        fillType={fillType}
        onFillTypeChange={setFillType}
      />
    </div>
  );
}
