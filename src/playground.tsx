import { PropertyPanel } from "./components/ui3/PropertyPanel";
import SlidesTemplate from "./imports/SlidesTemplate";
import { SlidesPanel, type SlideData } from "./components/ui3/SlidesPanel";
import { SlideInspector } from "./components/ui3/SlideInspector";
import { Timeline } from "./components/ui3/Timeline";
import { LayerList } from "./components/ui3/LayerList";
import { NavRail } from "./components/ui3/NavRail";
import thumb0 from "./imports/SlidesTemplate/9bf3285fa6c14222923aa8fcd4bf31f6e40807d9.png";
import thumb1 from "./imports/SlidesTemplate/201951eb24dd285dd0794f4e790b8175c012bf20.png";
import thumb2 from "./imports/SlidesTemplate/4f36d4cb9f77c2e380641dd47deb24943efa0b8a.png";
import thumb3 from "./imports/SlidesTemplate/16da0f3d572c4e81a81819ed074b78b9021856c1.png";
import thumb4 from "./imports/SlidesTemplate/fb3c95b27b7857955e04f62e905c22514cca029c.png";
import thumb5 from "./imports/SlidesTemplate/6c2145074f835f12139b4a2a5e3bd8475c1fe34a.png";

const DEMO_SLIDES: SlideData[] = [
  { n: 1,  thumb: thumb0, selected: true },
  { n: 2,  thumb: thumb1, group: true, expanded: true },
  { n: 3,  thumb: thumb2, sub: true, comment: 3 },
  { n: 4,  thumb: thumb3, sub: true, motion: true },
  { n: 5,  thumb: thumb4, group: true, expanded: true, stacked: true, motion: true },
  { n: 10, thumb: thumb5 },
  { n: 11, thumb: thumb1 },
  { n: 12, thumb: thumb2 },
  { n: 13, thumb: thumb3 },
];

export default function Playground() {
  // ?view=slides = componentized SlidesPanel; ?view=slides-raw = the raw Figma export
  // (side-by-side fidelity check); default = property-panel fidelity set.
  const view = new URLSearchParams(window.location.search).get("view");

  if (view === "slides-raw") {
    return (
      <div style={{ height: "100vh", width: "100vw" }}>
        <SlidesTemplate />
      </div>
    );
  }

  if (view === "editor") {
    // Full reskinned design-mode editor shell: nav rail · layers · canvas · inspector · timeline
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", background: "#e6e6e6" }}>
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <NavRail />
          <LayerList />
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "70%", aspectRatio: "16/9", background: "#fff", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }} />
          </div>
          <PropertyPanel elementType="frame" />
        </div>
        <div style={{ padding: 8, background: "#fff", borderTop: "1px solid #e6e6e6" }}>
          <Timeline height={220} />
        </div>
      </div>
    );
  }

  if (view === "layers") {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", background: "#e6e6e6" }}>
        <NavRail />
        <LayerList />
        <div style={{ flex: 1 }} />
      </div>
    );
  }

  if (view === "timeline") {
    return (
      <div style={{ height: "100vh", width: "100vw", background: "#e6e6e6", padding: 24, boxSizing: "border-box" }}>
        <Timeline height={360} />
      </div>
    );
  }

  if (view === "slides") {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", background: "#1e1e1e" }}>
        <SlidesPanel slides={DEMO_SLIDES} />
        <div style={{ flex: 1 }} />
        <SlideInspector />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 20, padding: 24, height: "100%", background: "#e6e6e6", boxSizing: "border-box", overflowX: "auto" }}>
      <div style={{ height: "96%", flex: "0 0 auto" }}>
        <div style={{ font: "600 11px system-ui", marginBottom: 6, color: "#555" }}>component (§5.1)</div>
        <PropertyPanel elementType="component" />
      </div>
      <div style={{ height: "96%", flex: "0 0 auto" }}>
        <div style={{ font: "600 11px system-ui", marginBottom: 6, color: "#555" }}>frame (§5.6)</div>
        <PropertyPanel elementType="frame" />
      </div>
      <div style={{ height: "96%", flex: "0 0 auto" }}>
        <div style={{ font: "600 11px system-ui", marginBottom: 6, color: "#555" }}>multiSelect (§5.8 — ColorInput)</div>
        <PropertyPanel multiSelect />
      </div>
    </div>
  );
}
