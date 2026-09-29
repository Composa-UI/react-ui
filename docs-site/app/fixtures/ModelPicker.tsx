// Live preview fixture for ModelPicker — the compact, stroke-free composer-toolbar
// pill that shows the active model and opens the (host-owned) model menu. This is
// the trigger control only, so the fixture stands in for the host by cycling the
// committed provider label on click via useState, mirroring how a real selection
// travels back into `value`. Styling stays on the component's own c-* tokens —
// no hardcoded colors.
import { useState } from "react";

import { ModelPicker } from "@/components/ui3/ModelPicker";

export default function ModelPickerFixture() {
  const models = ["Auto", "Claude", "OpenAI"];
  const [i, setI] = useState(1);
  return (
    <ModelPicker
      value={models[i]}
      onClick={() => setI(n => (n + 1) % models.length)}
    />
  );
}
