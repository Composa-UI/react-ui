// Live preview fixtures — one small, representative, interactive example per
// annotated component (all 30). These render the REAL components imported from
// src, so the docs "Storybook" pane shows the true article, not a picture of it.
//
// Examples are adapted from src/playground.tsx where that helped. Components that
// portal (Modal) or would otherwise dominate the pane are rendered behind a
// trigger; every other component is rendered directly and is fully interactive.
import { useState, type ReactNode } from "react";
import { Play, Copy, Scissors, Clipboard, Trash2, Plus, Square } from "lucide-react";

import { Button } from "@/components/ui3/Button";
import { SplitButton } from "@/components/ui3/SplitButton";
import { Dropdown } from "@/components/ui3/Dropdown";
import { InputField, NumericInput, ColorInput } from "@/components/ui3/Input";
import { Checkbox } from "@/components/ui3/Checkbox";
import { RadioButton } from "@/components/ui3/RadioButton";
import { Switch } from "@/components/ui3/Switch";
import { SegmentedControl } from "@/components/ui3/SegmentedControl";
import { AlignmentControl, type AlignmentValue } from "@/components/ui3/AlignmentControl";
import { Slider } from "@/components/ui3/Slider";
import { Dial } from "@/components/ui3/Dial";
import { ColorWheel } from "@/components/ui3/ColorWheel";
import { NavRail } from "@/components/ui3/NavRail";
import { Tabs } from "@/components/ui3/Tabs";
import { Menu, MenuRow } from "@/components/ui3/Menu";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui3/Dialog";
import { Tooltip } from "@/components/ui3/Tooltip";
import { Notification } from "@/components/ui3/Notification";
import { ListCell } from "@/components/ui3/ListCell";
import { LayerList } from "@/components/ui3/LayerList";
import { Inspector } from "@/components/ui3/Inspector";
import { PanelSection } from "@/components/ui3/Panel";
import { SidePanel } from "@/components/ui3/SidePanel";
import { InspectorRailSwitcher, type InspectorRailView } from "@/components/ui3/InspectorRailSwitcher";
import { CreationToolbar } from "@/components/ui3/CreationToolbar";
import { CropToolbar, type CropAspect } from "@/components/ui3/CropToolbar";
import { EditorShell } from "@/components/ui3/EditorShell";

// A note attached to a fixture that intentionally shows a minimal / triggered
// example rather than a fully-inline one (surfaced in the preview pane).
export const FIXTURE_NOTES: Record<string, string> = {
  Modal:
    "Radix portals the dialog to document.body with a focus trap and scrim — click to open the real modal.",
  EditorShell:
    "Template shell shown with labelled stub regions filling its named slots.",
};

// ── Stateful wrappers ───────────────────────────────────────────────────────

function DropdownFixture() {
  const values = ["Auto", "Fixed", "Fill", "Hug"];
  const [i, setI] = useState(0);
  return (
    <Dropdown
      ariaLabel="Sizing"
      value={values[i]}
      onClick={() => setI(n => (n + 1) % values.length)}
    />
  );
}

function InputFieldFixture() {
  const [v, setV] = useState("Untitled layer");
  return <InputField label="Name" value={v} onChange={setV} placeholder="Untitled" />;
}

function NumericInputFixture() {
  const [n, setN] = useState(42);
  return <NumericInput ariaLabel="Width" value={n} min={0} max={999} suffix="px" onChange={setN} />;
}

function CheckboxFixture() {
  const [c, setC] = useState(true);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <Checkbox label="Snap to pixel grid" checked={c} onChange={setC} />
      <Checkbox label="Mixed selection" checked="mixed" />
      <Checkbox label="Disabled" checked disabled />
    </div>
  );
}

function RadioFixture() {
  const [v, setV] = useState("fill");
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <RadioButton label="Fill" checked={v === "fill"} onChange={() => setV("fill")} />
      <RadioButton label="Fit" checked={v === "fit"} onChange={() => setV("fit")} />
      <RadioButton label="Stretch" checked={v === "stretch"} onChange={() => setV("stretch")} />
    </div>
  );
}

function SwitchFixture() {
  const [s, setS] = useState(true);
  return <Switch label="Auto layout" checked={s} onCheckedChange={setS} />;
}

function SegmentedFixture() {
  const [v, setV] = useState("horizontal");
  return (
    <SegmentedControl
      ariaLabel="Flow direction"
      className="w-[200px]"
      value={v}
      onChange={setV}
      segments={[
        { value: "vertical", label: "Vertical" },
        { value: "horizontal", label: "Horizontal" },
        { value: "wrap", label: "Wrap" },
      ]}
    />
  );
}

function AlignmentFixture() {
  const [v, setV] = useState<AlignmentValue>("mc");
  return <AlignmentControl ariaLabel="Alignment" value={v} onChange={setV} />;
}

function SliderFixture() {
  const [v, setV] = useState(64);
  return (
    <div style={{ width: 220 }}>
      <Slider ariaLabel="Opacity" value={v} min={0} max={100} onChange={setV} />
    </div>
  );
}

function DialFixture() {
  const [v, setV] = useState(45);
  return <Dial label="Reverb" value={v} min={0} max={100} suffix="%" onChange={setV} />;
}

function ColorInputFixture() {
  const [color, setColor] = useState("#795ee4");
  const [opacity, setOpacity] = useState(100);
  return (
    <ColorInput
      ariaLabel="Fill"
      color={color}
      opacity={opacity}
      onColorChange={setColor}
      onOpacityChange={setOpacity}
    />
  );
}

function NavRailFixture() {
  const [active, setActive] = useState("composition");
  return (
    <div style={{ height: 360, display: "flex" }}>
      <NavRail active={active} onSelect={setActive} />
    </div>
  );
}

function TabsFixture() {
  const [v, setV] = useState("design");
  return (
    <Tabs
      value={v}
      onChange={setV}
      tabs={[
        { value: "design", label: "Design" },
        { value: "animate", label: "Animate" },
      ]}
    />
  );
}

function MenuFixture() {
  return (
    <Menu>
      <MenuRow type="simple" label="Copy" shortcut="⌘C" onClick={() => undefined} />
      <MenuRow type="simple" label="Paste" shortcut="⌘V" onClick={() => undefined} />
      <MenuRow type="divider" />
      <MenuRow type="simple" label="Delete" destructive shortcut="⌫" onClick={() => undefined} />
    </Menu>
  );
}

function MenuRowFixture() {
  const [snap, setSnap] = useState(true);
  return (
    <Menu>
      <MenuRow type="heading" label="Arrange" />
      <MenuRow
        type="checkmark"
        label="Snap to pixels"
        selectionRole="checkbox"
        checked={snap}
        onClick={() => setSnap(s => !s)}
      />
      <MenuRow type="complex" label="Bring forward" sublabel="Move up one layer" onClick={() => undefined} />
      <MenuRow type="expand" label="Align" hasSubmenu onClick={() => undefined} />
      <MenuRow type="divider" />
      <MenuRow type="toolbar">
        <Button ariaLabel="Copy" variant="Ghost" size="small" icon={<Copy size={14} strokeWidth={1.5} />} />
        <Button ariaLabel="Cut" variant="Ghost" size="small" icon={<Scissors size={14} strokeWidth={1.5} />} />
        <Button ariaLabel="Paste" variant="Ghost" size="small" icon={<Clipboard size={14} strokeWidth={1.5} />} />
        <Button ariaLabel="Delete" variant="Ghost" size="small" icon={<Trash2 size={14} strokeWidth={1.5} />} />
      </MenuRow>
    </Menu>
  );
}

function ModalFixture() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button label="Open modal" variant="Secondary" onClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)} width={320}>
        <ModalHeader title="Share project" onClose={() => setOpen(false)} />
        <ModalBody>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
            A blocking task rendered in a focus-trapped, Escape-dismissable dialog.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button label="Cancel" variant="Secondary" onClick={() => setOpen(false)} />
          <Button label="Done" variant="Primary" onClick={() => setOpen(false)} />
        </ModalFooter>
      </Modal>
    </>
  );
}

function ListCellFixture() {
  return (
    <div style={{ width: 240 }}>
      <ListCell label="Rectangle" leading={<Square size={14} strokeWidth={1.5} />} shortcut="⌘1" onClick={() => undefined} />
      <ListCell label="Selected cell" variant="selected" leading={<Square size={14} strokeWidth={1.5} />} onClick={() => undefined} />
      <ListCell label="Disabled cell" variant="disabled" leading={<Square size={14} strokeWidth={1.5} />} />
      <ListCell label="Delete" variant="destructive" leading={<Trash2 size={14} strokeWidth={1.5} />} onClick={() => undefined} />
    </div>
  );
}

function LayerListFixture() {
  return (
    <div style={{ width: 260, height: 240, overflow: "auto" }}>
      <LayerList />
    </div>
  );
}

function inspectorBody(): ReactNode {
  return (
    <Inspector aria-label="Design inspector">
      <PanelSection title="Position">
        <div style={{ padding: "0 16px 8px", display: "grid", gap: 8 }}>
          <NumericInput ariaLabel="X" value={120} suffix="x" onChange={() => undefined} />
          <NumericInput ariaLabel="Y" value={64} suffix="y" onChange={() => undefined} />
        </div>
      </PanelSection>
      <PanelSection title="Fill">
        <div style={{ padding: "0 16px 8px" }}>
          <ColorInput ariaLabel="Fill" color="#795ee4" onColorChange={() => undefined} />
        </div>
      </PanelSection>
      <PanelSection title="Opacity" muted />
    </Inspector>
  );
}

function InspectorFixture() {
  return (
    <div style={{ width: 260, height: 320, overflow: "hidden", borderRadius: 8 }}>
      {inspectorBody()}
    </div>
  );
}

function PanelSectionFixture() {
  return (
    <div style={{ width: 260 }}>
      <PanelSection title="Layout" defaultOpen collapsible>
        <div style={{ padding: "0 16px 8px", display: "grid", gap: 8 }}>
          <SegmentedControl
            ariaLabel="Flow"
            value="row"
            onChange={() => undefined}
            segments={[
              { value: "row", label: "Row" },
              { value: "col", label: "Column" },
            ]}
          />
          <NumericInput ariaLabel="Gap" value={8} suffix="px" onChange={() => undefined} />
        </div>
      </PanelSection>
    </div>
  );
}

function SidePanelFixture() {
  return (
    <div style={{ height: 320, display: "flex" }}>
      <SidePanel defaultWidth={240} resizeLabel="Resize left panel">
        <div style={{ padding: 12, display: "grid", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6 }}>LAYERS</div>
          <ListCell label="Frame" leading={<Square size={14} strokeWidth={1.5} />} onClick={() => undefined} />
          <ListCell label="Text" leading={<Square size={14} strokeWidth={1.5} />} onClick={() => undefined} />
          <ListCell label="Image" leading={<Square size={14} strokeWidth={1.5} />} onClick={() => undefined} />
        </div>
      </SidePanel>
    </div>
  );
}

function InspectorRailSwitcherFixture() {
  const [view, setView] = useState<InspectorRailView>("inspector");
  return (
    <div style={{ height: 340, display: "flex" }}>
      <InspectorRailSwitcher
        active={view}
        onChange={setView}
        inspector={inspectorBody()}
        agent={
          <div style={{ padding: 16, fontSize: 13, lineHeight: 1.6, height: "100%" }}>
            Agent panel content lives here — the host owns each pane's internal navigation.
          </div>
        }
      />
    </div>
  );
}

function CropToolbarFixture() {
  const [aspect, setAspect] = useState<CropAspect>("free");
  const [zoom, setZoom] = useState(1.15);
  return (
    <CropToolbar
      aspect={aspect}
      onAspectChange={setAspect}
      onResizeToFill={() => undefined}
      zoom={zoom}
      onZoomChange={setZoom}
      onCancel={() => undefined}
      onDone={() => undefined}
    />
  );
}

function EditorShellFixture() {
  const stub = (label: string, width?: number) => (
    <div
      style={{
        width: width ?? "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        borderRight: "1px solid var(--color-border)",
        color: "var(--color-text-secondary)",
        font: "600 11px system-ui",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </div>
  );
  return (
    <div style={{ width: "100%", height: 320, border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
      <EditorShell
        aria-label="Composa editor"
        navRail={stub("Nav", 48)}
        leftPanel={stub("Left panel", 160)}
        canvas={stub("Canvas")}
        inspector={inspectorBody()}
        timeline={
          <div
            style={{
              height: 84,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--color-bg)",
              borderTop: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              font: "600 11px system-ui",
            }}
          >
            Timeline
          </div>
        }
      />
    </div>
  );
}

// ── Registry: component name -> live preview ────────────────────────────────

export const FIXTURES: Record<string, () => ReactNode> = {
  Button: () => (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <Button label="Primary" variant="Primary" onClick={() => undefined} />
      <Button label="Secondary" variant="Secondary" onClick={() => undefined} />
      <Button label="Ghost" variant="Ghost" onClick={() => undefined} />
      <Button label="Delete" variant="Destructive" onClick={() => undefined} />
      <Button label="Disabled" variant="Primary" disabled />
    </div>
  ),
  SplitButton: () => (
    <SplitButton
      icon={<Play size={14} strokeWidth={1.5} />}
      actionLabel="Play"
      menuLabel="Playback options"
      onIconClick={() => undefined}
      onChevronClick={() => undefined}
    />
  ),
  Dropdown: () => <DropdownFixture />,
  InputField: () => <InputFieldFixture />,
  NumericInput: () => <NumericInputFixture />,
  Checkbox: () => <CheckboxFixture />,
  RadioButton: () => <RadioFixture />,
  Switch: () => <SwitchFixture />,
  SegmentedControl: () => <SegmentedFixture />,
  AlignmentControl: () => <AlignmentFixture />,
  Slider: () => <SliderFixture />,
  Dial: () => <DialFixture />,
  ColorInput: () => <ColorInputFixture />,
  ColorWheel: () => <ColorWheel ariaLabel="Color wheel" defaultHue={264} defaultSaturation={0.5} />,
  NavRail: () => <NavRailFixture />,
  Tabs: () => <TabsFixture />,
  Menu: () => <MenuFixture />,
  MenuRow: () => <MenuRowFixture />,
  Modal: () => <ModalFixture />,
  Tooltip: () => (
    <Tooltip label="Align left" hotkey="⌥A" delayDuration={0}>
      <Button label="Hover me" variant="Secondary" icon={<Plus size={14} strokeWidth={1.5} />} iconLead="left" />
    </Tooltip>
  ),
  Notification: () => (
    <Notification
      message="Video exported to Downloads"
      actions={[{ label: "Show" }, { label: "Dismiss" }]}
    />
  ),
  ListCell: () => <ListCellFixture />,
  LayerList: () => <LayerListFixture />,
  Inspector: () => <InspectorFixture />,
  PanelSection: () => <PanelSectionFixture />,
  SidePanel: () => <SidePanelFixture />,
  InspectorRailSwitcher: () => <InspectorRailSwitcherFixture />,
  CreationToolbar: () => <CreationToolbar />,
  CropToolbar: () => <CropToolbarFixture />,
  EditorShell: () => <EditorShellFixture />,
};
