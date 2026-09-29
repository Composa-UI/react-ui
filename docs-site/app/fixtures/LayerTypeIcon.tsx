// Live preview fixture for LayerTypeIcon — the canonical element-type glyph shown
// beside a layer's name in the Layers panel and the element timeline. Renders the
// REAL component as the annotation's own example (an auto-layout frame:
// type="frame", horizontal mode, centre counter-align) next to a layer name, the
// row pairing the icon is designed for: the glyph carries no accessible name, so
// the layer's name in the row is its label. Tokens only — the glyph resolves its
// own c-* icon token and the name uses a c-* text token; no hardcoded colors.
import { LayerTypeIcon } from "@/components/ui3/LayerTypeIcon";

export default function LayerTypeIconFixture() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: 200 }}>
      <LayerTypeIcon type="frame" autoLayoutMode="horizontal" autoLayoutAlign="center" />
      <span style={{ fontSize: 13, color: "var(--color-text)" }}>Hero frame</span>
    </div>
  );
}
