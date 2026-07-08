import { PropertyPanel } from "./components/ui3/PropertyPanel";

export default function Playground() {
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
