// Live preview fixture for SlideInspector — the slides-mode right rail.
// SlideInspector is a self-contained composite: it takes no props and owns its
// own tab (Design/Prototype) and fill-type (Solid/Gradient/Image) state, plus
// hardcoded demo content (slide name, template, colours). We render the real
// component inside a bounded-height flex container so its `h-full` panel shows
// a representative surface in the preview pane (it is PANEL_W = 290px wide).
import { SlideInspector } from "@/components/ui3/SlideInspector";

export default function SlideInspectorFixture() {
  return (
    <div style={{ height: 420, display: "flex" }}>
      <SlideInspector />
    </div>
  );
}
