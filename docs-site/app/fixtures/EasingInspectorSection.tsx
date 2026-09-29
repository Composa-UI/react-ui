// Live preview fixture for EasingInspectorSection — the canonical easing curve
// editor a rail hosts. It is a PanelSection (preset dropdown, Curve/Spring
// segmented control, draggable cubic-bézier preview, control-point inputs, cubic
// readout, and an Apply-to scope dropdown), so it renders directly inside a
// sized, rail-width container. The host owns the data model; here small local
// state stands in for it so the demo is interactive — starting on the custom
// preset so the two draggable control-point handles are visible.
import { useState } from "react";

import {
  EasingInspectorSection,
  type EasingInspectorValue,
} from "@/components/ui3/EasingInspectorSection";
import type { EasingApplyScope } from "@/components/ui3/easing";

export default function EasingInspectorSectionFixture() {
  const [value, setValue] = useState<EasingInspectorValue>({
    preset: "custom",
    controlPoints: [0.25, 0.1, 0.25, 1],
    editable: true,
  });
  const [scope, setScope] = useState<EasingApplyScope>("segment");

  return (
    <div style={{ width: 272, borderRadius: 8, border: "1px solid var(--color-border)", overflow: "hidden" }}>
      <EasingInspectorSection
        value={value}
        applyScope={scope}
        onChange={next => setValue(v => ({ ...v, ...next }))}
        onApplyScopeChange={setScope}
      />
    </div>
  );
}
