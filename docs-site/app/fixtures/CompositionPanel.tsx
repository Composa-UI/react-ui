// Live preview fixture for CompositionPanel — the default left-rail content: a
// draggable vertical split of the Slides list over the Layers tree. Renders the
// REAL component with a small, realistic layer tree and interactive split/width/
// selection state. Slide thumbnails use the component's built-in demo data so the
// fixture stays token-clean (no hardcoded thumbnail tints here).
import { useState } from "react";

import { CompositionPanel } from "@/components/ui3/CompositionPanel";
import type { LayerNode } from "@/components/ui3/LayerList";

// A compact, representative layer tree for a single slide (colourless — layer
// rows carry no fill, only type icons and names).
const LAYERS: LayerNode[] = [
  {
    id: "hero",
    name: "Hero",
    type: "frame",
    children: [
      { id: "headline", name: "Headline", type: "text" },
      { id: "subhead", name: "Subhead", type: "text" },
      { id: "logo", name: "Logo", type: "image" },
    ],
  },
  {
    id: "cta",
    name: "CTA button",
    type: "group",
    children: [
      { id: "cta-label", name: "Label", type: "text" },
      { id: "cta-fill", name: "Fill", type: "shape" },
    ],
  },
  { id: "backdrop", name: "Backdrop", type: "shape", locked: true },
];

export default function CompositionPanelFixture() {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("headline");
  const [split, setSplit] = useState(0.4);
  const [width, setWidth] = useState(240);

  return (
    <div style={{ height: 360, display: "flex" }}>
      <CompositionPanel
        slidesTitle="Launch deck"
        layers={LAYERS}
        selectedLayerId={selectedLayerId}
        onLayerSelectionChange={id => setSelectedLayerId(id)}
        split={split}
        onSplitChange={setSplit}
        width={width}
        onWidthChange={setWidth}
      />
    </div>
  );
}
