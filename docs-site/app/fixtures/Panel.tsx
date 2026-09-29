// Live fixture for Panel — the fixed-width right-rail surface that stacks its
// PanelSection children top-to-bottom. Composed from the real primitives so the
// docs "Live demo" shows the true article: a compact inspector rail with two
// sections of interactive numeric field rows. Tokens only — no hardcoded colors.
import { useState } from "react";

import { Panel, PanelSection, PanelFieldRow } from "@/components/ui3/Panel";
import { NumericInput } from "@/components/ui3/Input";

export default function PanelFixture() {
  const [x, setX] = useState(120);
  const [y, setY] = useState(64);
  const [w, setW] = useState(240);
  const [h, setH] = useState(160);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(100);

  return (
    <Panel>
      <PanelSection title="Position">
        <PanelFieldRow
          left={<NumericInput ariaLabel="X position" iconLead="X" value={x} onChange={setX} />}
          right={<NumericInput ariaLabel="Y position" iconLead="Y" value={y} onChange={setY} />}
        />
        <PanelFieldRow
          left={<NumericInput ariaLabel="Width" iconLead="W" value={w} min={0} onChange={setW} />}
          right={<NumericInput ariaLabel="Height" iconLead="H" value={h} min={0} onChange={setH} />}
        />
      </PanelSection>
      <PanelSection title="Appearance">
        <PanelFieldRow
          left={<NumericInput ariaLabel="Rotation" iconLead="R" value={rotation} min={-360} max={360} suffix="°" onChange={setRotation} />}
          right={<NumericInput ariaLabel="Opacity" value={opacity} min={0} max={100} suffix="%" onChange={setOpacity} />}
        />
      </PanelSection>
    </Panel>
  );
}
