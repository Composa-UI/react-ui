// Live preview fixture for PropertyPanel — the capability-driven default
// inspector. It is a fixed-width (PANEL_W) surface that fills its host's height
// and scrolls its section stack internally, so it renders inside a sized,
// rail-width container rather than behind a trigger. The host owns the document
// model; here small local state stands in for it so the element inspector is
// interactive (Position + Appearance edits commit, Typography is controlled).
// Selection-gated sections it does not receive fall back to the component's own
// demo data, giving a representative composite surface without hand-authored
// colors.
import { useState } from "react";

import {
  PropertyPanel,
  type ElementTypographySettings,
} from "@/components/ui3/PropertyPanel";

export default function PropertyPanelFixture() {
  const [x, setX] = useState(160);
  const [y, setY] = useState(96);
  const [width, setWidth] = useState(320);
  const [height, setHeight] = useState(64);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [typography, setTypography] = useState<ElementTypographySettings>({
    fontFamily: "Inter",
    fontWeight: "Medium",
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
    align: "left",
    verticalAlign: "top",
  });

  return (
    <div
      style={{
        height: 460,
        display: "flex",
        overflow: "hidden",
        borderRadius: 8,
        border: "1px solid var(--color-border)",
      }}
    >
      <PropertyPanel
        mode="element"
        elementType="text"
        capabilities={{ variables: true }}
        x={x}
        y={y}
        rotation={rotation}
        width={width}
        height={height}
        opacity={opacity}
        typography={typography}
        onXChange={setX}
        onYChange={setY}
        onRotationChange={setRotation}
        onWidthChange={setWidth}
        onHeightChange={setHeight}
        onOpacityChange={setOpacity}
        onTypographyChange={patch => setTypography(t => ({ ...t, ...patch }))}
      />
    </div>
  );
}
