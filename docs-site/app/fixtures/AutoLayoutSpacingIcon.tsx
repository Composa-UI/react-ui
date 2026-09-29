// Live preview fixture for AutoLayoutSpacingIcon — the decorative lead glyph that
// sits in front of a Gap/Padding numeric editor in the Inspector. Renders the REAL
// component as the canonical `kind="gap" axis="horizontal"` glyph beside a
// controlled NumericInput (useState), the pairing the icon is designed for: the
// glyph carries no accessible name, the numeric field's own label does. Tokens
// only — the glyph inherits currentColor from the row and the caption uses a c-*
// text token; no hardcoded colors.
import { useState } from "react";

import { AutoLayoutSpacingIcon } from "@/components/ui3/AutoLayoutSpacingIcon";
import { NumericInput } from "@/components/ui3/Input";

export default function AutoLayoutSpacingIconFixture() {
  const [gap, setGap] = useState(16);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: 200 }}>
      <AutoLayoutSpacingIcon kind="gap" axis="horizontal" />
      <NumericInput
        ariaLabel="Horizontal gap"
        value={gap}
        min={0}
        max={999}
        suffix="px"
        onChange={setGap}
      />
    </div>
  );
}
