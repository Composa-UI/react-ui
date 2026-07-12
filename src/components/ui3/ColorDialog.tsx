import { useEffect, useState, useRef } from "react";
import { clsx } from "clsx";
import { Image, Pipette, Blend, Contrast, Plus, Minus, RotateCcw, Disc, Diamond, Search, LayoutGrid, ChevronDown } from "lucide-react";
import { Modal, ModalHeader, ModalBody, ModalDivider, MODAL_WIDTHS } from "./Dialog";
import { hexToHsb, hsbToHex } from "../../lib/color";
import { Tabs } from "./Tabs";
import { Slider, PickerHandle, GradientStopHandle } from "./Slider";
import { InputField, ColorInput, NumericInputMulti } from "./Input";
import { Button } from "./Button";
import { Dropdown } from "./Dropdown";
import { Chit } from "./Chit";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FillType = "solid" | "linear" | "radial" | "angular" | "diamond" | "image";

export interface GradientStop {
  id: string;
  position: number;
  color: string;    // hex without #
  opacity: number;  // 0–100
}

export interface ColorDialogCapabilities { styles?: boolean; variables?: boolean; libraries?: boolean; }

interface ColorDialogProps {
  open: boolean;
  onClose: () => void;
  fillType?: FillType;
  onFillTypeChange?: (t: FillType) => void;
  hue?: number;
  saturation?: number;
  brightness?: number;
  opacity?: number;
  hex?: string;
  onHueChange?: (h: number) => void;
  onOpacityChange?: (o: number) => void;
  onHexChange?: (h: string) => void;
  gradientStops?: GradientStop[];
  onStopsChange?: (stops: GradientStop[]) => void;
  /** Library groups for the Libraries tab. Defaults to demo data so the
   * playground/stories keep working; hosts inject document tokens here. */
  libraries?: LibraryGroup[];
  /** Selecting a library color. Hosts get the full entry (id = token or
   * variable id) so they can BIND rather than copy; without a handler the
   * dialog applies the hex like any picker change. */
  onSelectLibraryColor?: (color: LibraryColor, group: LibraryGroup) => void;
  capabilities?: ColorDialogCapabilities;
  /** Restrict the dialog to a representable solid color (effects, text decoration, etc.). */
  solidOnly?: boolean;
  /** Selects which controlled representation seeds the picker model on each open session. */
  pickerSource?: "hex" | "hsb";
  /** "On this page" swatch hexes (with #). Defaults to demo swatches. */
  swatches?: string[];
  imageExposure?: number;
  imageContrast?: number;
  imageSaturation?: number;
  imageTemperature?: number;
  imageTint?: number;
  imageHighlights?: number;
  imageShadows?: number;
}

// ─── Library color data types ─────────────────────────────────────────────────

export interface LibraryColor {
  id: string;
  name: string;
  color: string;   // hex with #
  selected?: boolean;
}

export interface LibraryGroup {
  path: string;    // e.g. "_icon"  — rendered as ✦/_icon
  colors: LibraryColor[];
}

// Mock data matching the Figma screenshot
const MOCK_LIBRARY: LibraryGroup[] = [
  {
    path: "_icon",
    colors: [
      { id: "icon-default",   name: "icon-default",   color: "#1e1e1e", selected: true },
      { id: "icon-secondary", name: "icon-secondary",  color: "#4d4d4d" },
      { id: "icon-tertiary",  name: "icon-tertiary",   color: "#808080" },
    ],
  },
  {
    path: "_bg",
    colors: [
      { id: "bg-default",   name: "bg-default",   color: "#ffffff" },
      { id: "bg-secondary", name: "bg-secondary", color: "#f5f5f5" },
      { id: "bg-selected",  name: "bg-selected",  color: "#0d99ff" },
    ],
  },
];

// ─── Libraries Tab ────────────────────────────────────────────────────────────

function ColorChip({ color }: { color: string }) {
  const isLight = color === "#ffffff" || color === "#f5f5f5";
  return (
    <div
      className="size-[16px] shrink-0 rounded-[3px]"
      style={{
        backgroundColor: color,
        boxShadow: isLight
          ? "inset 0 0 0 1px rgba(0,0,0,0.1)"
          : "inset 0 0 0 0.5px rgba(0,0,0,0.08)",
      }}
    />
  );
}

function LibrariesTab({
  groups,
  onSelect,
}: {
  groups: LibraryGroup[];
  onSelect?: (color: LibraryColor, group: LibraryGroup) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(
    () => groups.flatMap(g => g.colors).find(c => c.selected)?.id ?? "",
  );

  const filtered = groups.map(group => ({
    ...group,
    colors: group.colors.filter(c =>
      !search || c.name.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter(g => g.colors.length > 0);

  return (
    <>
      {/* Search row */}
      <div className="flex items-center h-[40px] border-b border-c-border shrink-0">
        <span className="shrink-0 flex items-center justify-center size-[40px] text-c-icon-secondary">
          <Search size={12} strokeWidth={1.5} />
        </span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search"
          className={clsx(
            "flex-1 h-full bg-transparent outline-none",
            FONT, "text-[11px] font-[450] text-c-text placeholder:text-c-text-tertiary",
          )}
        />
      </div>

      {/* Filter / view-mode row */}
      <div className="flex items-center justify-between px-[8px] h-[40px] border-b border-c-border shrink-0">
        <Dropdown value="All libraries" size="default" className="w-[104px]" />
        <button className="flex items-center justify-center size-[24px] rounded-c-sm text-c-icon hover:bg-c-bg-hover">
          <LayoutGrid size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Color list */}
      <div className="flex-1 overflow-y-auto pb-[16px]">
        {filtered.map(group => (
          <div key={group.path}>
            {/* Section header — ✦/path notation matching Figma */}
            <div className="flex items-center h-[32px] px-[16px]">
              <span className={clsx(FONT, "text-[11px] font-[450] text-c-text truncate")}>
                ✦/{group.path}
              </span>
            </div>

            {/* Color rows */}
            {group.colors.map(color => {
              const isSelected = color.id === selectedId;
              return (
                <button
                  key={color.id}
                  onClick={() => {
                    setSelectedId(color.id);
                    onSelect?.(color, group);
                  }}
                  className={clsx(
                    "flex items-center w-full h-[32px] pl-[16px] pr-[4px] gap-[8px]",
                    "hover:bg-c-bg-hover text-left outline-none",
                    isSelected && "bg-c-bg-secondary",
                  )}
                >
                  {/* 24px leading slot with 16px chip centered inside */}
                  <span className="shrink-0 flex items-center justify-center size-[24px]">
                    <ColorChip color={color.color} />
                  </span>
                  <span className={clsx(FONT, "text-[11px] font-[450] text-c-text truncate")}>
                    {color.name}
                  </span>
                </button>
              );
            })}
          </div>
        ))}

        {/* Selected path indicator at bottom — shows full token path */}
        {selectedId && (
          <>
            <ModalDivider className="mt-[4px]" />
            <div className="flex items-center h-[32px] px-[16px]">
              <span className={clsx(FONT, "text-[11px] font-[450] text-c-text-secondary truncate")}>
                ✦/{groups
                  .flatMap(g => g.colors.map(c => ({ ...c, path: g.path })))
                  .find(c => c.id === selectedId)
                  ?.path ?? ""}
                /{selectedId}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Fill-type icons — CSS-based to avoid SVG gradient ID collisions ──────────
// Primary color via currentColor / text-c-icon.

function FillTypeIcon({ type }: { type: FillType }) {
  if (type === "solid") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <rect x="1" y="1" width="10" height="10" rx="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (type === "linear") {
    return (
      <div className="size-[12px] rounded-[1.5px] overflow-hidden">
        <div
          className="size-full"
          style={{ background: "linear-gradient(to right, currentColor, transparent)" }}
        />
      </div>
    );
  }
  if (type === "radial")  return <Disc    size={12} strokeWidth={1.5} />;
  if (type === "angular") return <RotateCcw size={12} strokeWidth={1.5} />;
  if (type === "diamond") return <Diamond  size={12} strokeWidth={1.5} />;
  if (type === "image")   return <Image    size={12} strokeWidth={1.5} />;
  return null;
}

// ─── Toolbar icon button ───────────────────────────────────────────────────────

function Btn({ onClick, label, active, children }: {
  onClick?: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center size-[24px] rounded-c-sm",
        "text-c-icon",   // primary — user noted icons should not default to muted
        active ? "bg-c-bg-secondary" : "hover:bg-c-bg-hover",
        "transition-colors",
      )}
    >
      {children}
    </button>
  );
}

// ─── Image adjustment slider row ─────────────────────────────────────────────

const FONT = "font-[family-name:var(--composa-font-family)]";

function AdjustRow({ label, value, onChange }: {
  label: string; value: number; onChange?: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-[8px] px-[16px] h-[28px]">
      <span className={clsx(FONT, "text-[11px] font-[450] text-c-text-secondary w-[88px] shrink-0 truncate")}>
        {label}
      </span>
      <Slider value={value} onChange={onChange} min={-100} max={100} defaultValue={0} />
    </div>
  );
}

// ─── Gradient stop row ────────────────────────────────────────────────────────

function StopRow({
  stop, onPosition, onOpacity, onColor, onRemove,
}: {
  stop: GradientStop;
  onPosition: (id: string, v: number) => void;
  onOpacity: (id: string, v: number) => void;
  onColor: (id: string, hex: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-[8px] px-[16px] h-[32px]">
      {/* position % */}
      <div className="w-[52px] flex items-center h-[24px] rounded-c-md bg-c-bg ring-1 ring-inset ring-c-border overflow-hidden">
        <input
          value={String(stop.position)}
          onChange={e => onPosition(stop.id, parseFloat(e.target.value) || 0)}
          className={clsx("flex-1 min-w-0 h-full bg-transparent outline-none px-[6px]", FONT, "text-[11px] text-c-text")}
        />
        <span className={clsx(FONT, "text-[11px] text-c-text-secondary pr-[6px]")}>%</span>
      </div>
      {/* the stop color uses the same ColorInput as the panels */}
      <div className="flex-1 min-w-0">
        <ColorInput fullWidth color={`#${stop.color}`} opacity={stop.opacity} onColorChange={v => onColor(stop.id, v)} onOpacityChange={v => onOpacity(stop.id, v)} />
      </div>
      <button
        onClick={() => onRemove(stop.id)}
        className="shrink-0 flex items-center justify-center size-[24px] rounded-c-md text-c-icon hover:bg-c-bg-hover"
      >
        <Minus size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ─── ColorDialog ─────────────────────────────────────────────────────────────

const DEFAULT_STOPS: GradientStop[] = [
  { id: "1", position: 0,   color: "000000", opacity: 100 },
  { id: "2", position: 100, color: "666666", opacity: 100 },
];

const FILL_TYPES: FillType[] = ["solid", "linear", "radial", "angular", "diamond", "image"];
const COLOR_FORMATS = ["Hex", "RGB", "CSS", "HSL", "HSB"];

export function ColorDialog({
  open,
  onClose,
  fillType: fillTypeProp,
  onFillTypeChange,
  hue: hueProp = 0,
  saturation: satProp = 0,
  brightness: briProp = 100,
  opacity: opacityProp = 100,
  hex: hexProp = "FFFFFF",
  onHueChange,
  onOpacityChange,
  onHexChange,
  gradientStops: stopsProp,
  onStopsChange,
  libraries = MOCK_LIBRARY,
  onSelectLibraryColor,
  capabilities,
  solidOnly = false,
  pickerSource = "hsb",
  swatches = ["#383838", "#f5f5f5", "#1e1e1e", "#ffffff", "#0d99ff", "#ff24bd"],
  imageExposure = 0,
  imageContrast = 0,
  imageSaturation = 0,
  imageTemperature = 0,
  imageTint = 0,
  imageHighlights = 0,
  imageShadows = 0,
}: ColorDialogProps) {
  const [fillType, setFillType] = useState<FillType>(fillTypeProp ?? "solid");
  const [activeTab, setActiveTab] = useState("custom");
  const stylesAvailable = capabilities?.styles ?? true;
  const variablesAvailable = capabilities?.variables ?? true;
  const librariesAvailable = capabilities?.libraries ?? true;
  useEffect(() => { if (!librariesAvailable && activeTab === "libraries") setActiveTab("custom"); }, [activeTab, librariesAvailable]);
  const [hue,     setHue]     = useState(hueProp);
  const [opacity, setOpacity] = useState(opacityProp);
  const [hex,     setHex]     = useState(hexProp);
  const [stops,   setStops]   = useState<GradientStop[]>(stopsProp ?? DEFAULT_STOPS);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      const picker = pickerSource === "hex" ? hexToHsb(hexProp) : { hue: hueProp, saturation: satProp ?? 100, brightness: briProp ?? 100 };
      setFillType(solidOnly ? "solid" : fillTypeProp ?? "solid");
      setHue(picker.hue); setOpacity(opacityProp); setHex(hexProp);
      setSat(picker.saturation); setBri(picker.brightness); setStops(stopsProp ?? DEFAULT_STOPS);
    }
    wasOpen.current = open;
  }, [open, solidOnly, pickerSource, fillTypeProp, hueProp, opacityProp, hexProp, satProp, briProp, stopsProp]);

  // Interactive 2D picker — saturation (x) × brightness (y)
  const [sat, setSat] = useState(satProp ?? 100);
  const [bri, setBri] = useState(briProp ?? 100);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const updatePicker = (e: { clientX: number; clientY: number }) => {
    const el = canvasRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nextSat = Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 100);
    const nextBri = Math.round((1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))) * 100);
    setSat(nextSat);
    setBri(nextBri);
    // The picker commits a concrete color — consumers only speak hex.
    const nextHex = hsbToHex(hue, nextSat, nextBri);
    setHex(nextHex);
    onHexChange?.(nextHex);
  };

  const [colorFormat, setColorFormat] = useState("Hex");
  const cycleFormat = () => setColorFormat(f => COLOR_FORMATS[(COLOR_FORMATS.indexOf(f) + 1) % COLOR_FORMATS.length]);
  const isSingleFmt = colorFormat === "Hex" || colorFormat === "CSS";
  const handleFillType = (t: FillType) => { setFillType(t); onFillTypeChange?.(t); };
  const handleHue      = (v: number)   => {
    setHue(v);
    onHueChange?.(v);
    const nextHex = hsbToHex(v, sat, bri);
    setHex(nextHex);
    onHexChange?.(nextHex);
  };
  const handleOpacity  = (v: number)   => { setOpacity(v);  onOpacityChange?.(v); };
  const handleHex      = (v: string)   => { setHex(v);      onHexChange?.(v); };

  const commitStops = (next: GradientStop[]) => {
    setStops(next);
    onStopsChange?.(next);
  };
  const handleStopPos  = (id: string, v: number) =>
    commitStops(stops.map(x => x.id === id ? { ...x, position: Math.min(100, Math.max(0, v)) } : x));
  const handleStopOp   = (id: string, v: number) =>
    commitStops(stops.map(x => x.id === id ? { ...x, opacity: Math.min(100, Math.max(0, v)) } : x));
  const handleStopColor = (id: string, hexValue: string) =>
    commitStops(stops.map(x => x.id === id ? { ...x, color: hexValue.replace(/^#/, "") } : x));
  const handleStopRemove = (id: string) => commitStops(stops.filter(x => x.id !== id));
  const handleStopAdd    = () =>
    commitStops([...stops, { id: String(Date.now()), position: 50, color: "888888", opacity: 100 }]);

  const hueColor = `hsl(${hue}, 100%, 50%)`;
  const pickerColor = `hsl(${hue}, ${sat}%, ${(bri * (100 - sat / 2) / 100)}%)`;
  // Canvas gradient: saturation (left→right) × brightness (top→bottom)
  const canvasBg = `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, ${hueColor})`;

  const isGradient = fillType === "linear" || fillType === "radial" || fillType === "angular" || fillType === "diamond";

  // ── Header: Custom / Libraries tabs only — fill type is in the toolbar ────

  const headerTabs = (
    <Tabs
      value={activeTab}
      onChange={setActiveTab}
      tabs={[
        { value: "custom",    label: "Custom" },
        ...(librariesAvailable ? [{ value: "libraries", label: "Libraries" }] : []),
      ]}
    />
  );

  return (
    <Modal open={open} onClose={onClose} width={MODAL_WIDTHS.compact} backdrop={false}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <ModalHeader
        variant="tabs"
        title="Color"
        tabs={headerTabs}
        onClose={onClose}
        actions={(stylesAvailable || variablesAvailable) ? (
          <Btn label={stylesAvailable && variablesAvailable ? "New style or variable" : stylesAvailable ? "New style" : "New variable"}>
            <Plus size={14} strokeWidth={1.5} />
          </Btn>
        ) : undefined}
      />

      {/* ── Custom tab: toolbar + body ───────────────────────────────────── */}
      {activeTab === "custom" && (
        <>
          {/* Toolbar: fill-type tabs (left) + utility icons (right) */}
          {!solidOnly && <div className="flex items-center justify-between px-[8px] h-[40px] border-b border-c-border shrink-0">
            {/* Three fill-type tabs — gradient TYPE (linear/radial/…) lives in the dropdown, not here */}
            <div className="flex items-center gap-[2px]">
              <Btn label="Solid" active={fillType === "solid"} onClick={() => handleFillType("solid")}>
                <FillTypeIcon type="solid" />
              </Btn>
              <Btn label="Gradient" active={isGradient} onClick={() => handleFillType("linear")}>
                <FillTypeIcon type="linear" />
              </Btn>
              <Btn label="Image" active={fillType === "image"} onClick={() => handleFillType("image")}>
                <FillTypeIcon type="image" />
              </Btn>
            </div>
            <div className="flex items-center gap-[2px]">
              {isGradient && <Btn label="Swap gradient"><RotateCcw size={14} strokeWidth={1.5} /></Btn>}
              <Btn label="Blend mode"><Blend size={14} strokeWidth={1.5} /></Btn>
              <Btn label="Check color contrast"><Contrast size={14} strokeWidth={1.5} /></Btn>
            </div>
          </div>}

          {/* Gradient type selector */}
          {isGradient && (
            <div className="flex items-center gap-[8px] px-[8px] h-[40px] border-b border-c-border shrink-0">
              <Dropdown
                value={fillType.charAt(0).toUpperCase() + fillType.slice(1)}
                size="default"
                className="w-[96px]"
                onClick={() => {
                  const order: FillType[] = ["linear", "radial", "angular", "diamond"];
                  const next = order[(order.indexOf(fillType) + 1) % order.length];
                  handleFillType(next);
                }}
              />
            </div>
          )}

          <ModalBody scrollable={fillType === "image"}>

        {/* ── SOLID ──────────────────────────────────────────────────────── */}
        {fillType === "solid" && (
          <>
            {/* Color canvas — draggable saturation/brightness picker */}
            <div
              ref={canvasRef}
              className="relative mx-[16px] mt-[16px] cursor-crosshair touch-none select-none"
              style={{ height: 208, width: 208 }}
              onPointerDown={e => { setDragging(true); updatePicker(e); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic */ } }}
              onPointerMove={e => { if (dragging) updatePicker(e); }}
              onPointerUp={e => { setDragging(false); e.currentTarget.releasePointerCapture(e.pointerId); }}
            >
              {/* Gradient fill — rounded-c-md (5px) per spec, clips gradient only */}
              <div
                className="absolute inset-0 rounded-c-md overflow-hidden pointer-events-none"
                style={{ background: canvasBg }}
              />
              {/* Inset shadow ring — clips to same radius */}
              <div className="absolute inset-0 rounded-c-md pointer-events-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" />
              {/* PickerHandle — position from saturation/brightness */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                style={{ left: (sat / 100) * 208, top: (1 - bri / 100) * 208 }}
              >
                <PickerHandle color={pickerColor} />
              </div>
            </div>

            {/* Eyedropper + hue + opacity sliders */}
            <div className="flex items-center gap-[12px] px-[16px] pt-[12px] pb-[8px]">
              <Btn label="Sample color">
                <Pipette size={14} strokeWidth={1.5} />
              </Btn>
              <div className="flex-1 flex flex-col gap-[6px]">
                <Slider
                  value={hue} onChange={handleHue} min={0} max={360}
                  trackVariant="gradient"
                  trackGradient="linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)"
                />
                <Slider
                  value={opacity} onChange={handleOpacity} min={0} max={100}
                  trackVariant="alpha"
                  trackGradient={`linear-gradient(to right, transparent, ${hueColor})`}
                />
              </div>
            </div>

            {/* Format dropdown (its OWN control) + value using the proper input, not combined */}
            <div className="flex items-center gap-[8px] px-[16px] pb-[8px]">
              <div className="w-[64px] shrink-0">
                <Dropdown value={colorFormat} onClick={cycleFormat} fullWidth />
              </div>
              {colorFormat === "Hex" ? (
                <div className="flex-1 min-w-0">
                  <ColorInput fullWidth color={`#${hex}`} opacity={opacity} onColorChange={handleHex} onOpacityChange={handleOpacity} />
                </div>
              ) : colorFormat === "CSS" ? (
                <div className="flex-1 min-w-0">
                  <InputField value={`rgb(30, 30, 30, ${(opacity / 100).toFixed(2)})`} onChange={() => {}} />
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <NumericInputMulti values={(colorFormat === "RGB" ? [30, 30, 30, opacity] : [0, 0, 12, opacity]).map(v => ({ value: v })) as [{ value: number }, { value: number }, { value: number }, { value: number }]} />
                </div>
              )}
            </div>

            <ModalDivider />

            {/* Swatch set selector */}
            <div className="px-[16px] pt-[12px] pb-[4px]">
              <Dropdown value="On this page" size="default" className="w-full" />
            </div>

            {/* Color swatches — injected document colors; click applies */}
            <div className="flex flex-wrap gap-[8px] px-[16px] py-[8px] pb-[16px]">
              {swatches.map(c => (
                <button
                  key={c}
                  className="rounded-[3px] size-[16px] ring-1 ring-inset ring-[rgba(0,0,0,0.1)]"
                  style={{ backgroundColor: c }}
                  aria-label={c}
                  onClick={() => handleHex(c.replace("#", ""))}
                />
              ))}
            </div>
          </>
        )}

        {/* ── GRADIENT ──────────────────────────────────────────────────── */}
        {isGradient && (
          <>
            {/* Gradient preview bar — stop handles on TOP (caret points down), squarish bar */}
            <div className="px-[16px] pt-[8px] pb-[8px]">
              <div className="relative h-[34px]">
                {stops.map(stop => (
                  <GradientStopHandle
                    key={stop.id}
                    color={`#${stop.color}`}
                    style={{ position: "absolute", left: `calc(${stop.position}% - 12px)`, top: 0 }}
                  />
                ))}
              </div>
              <div
                className="h-[16px] rounded-c-sm ring-1 ring-inset ring-[rgba(0,0,0,0.1)]"
                style={{
                  background: `linear-gradient(to right, #${stops[0]?.color ?? "000"}, #${stops[stops.length - 1]?.color ?? "666"})`,
                }}
              />
            </div>

            <ModalDivider />

            {/* Stops header */}
            <div className="flex items-center justify-between px-[16px] h-[32px]">
              <span className={clsx(FONT, "text-[11px] font-[550] text-c-text")}>Stops</span>
              <button
                onClick={handleStopAdd}
                className="flex items-center justify-center size-[24px] rounded-c-sm text-c-icon hover:bg-c-bg-hover"
              >
                <Plus size={12} strokeWidth={1.5} />
              </button>
            </div>

            {stops.map(stop => (
              <StopRow
                key={stop.id}
                stop={stop}
                onPosition={handleStopPos}
                onOpacity={handleStopOp}
                onColor={handleStopColor}
                onRemove={handleStopRemove}
              />
            ))}

            <div className="pb-[16px]" />
          </>
        )}

        {/* ── IMAGE ─────────────────────────────────────────────────────── */}
        {fillType === "image" && (
          <>
            {/* Upload / preview area */}
            <div
              className="relative mx-[16px] mt-[16px] mb-[8px] rounded-c-md overflow-hidden flex items-center justify-center"
              style={{
                height: 160,
                backgroundImage: "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%)",
                backgroundSize: "16px 16px",
              }}
            >
              <Button variant="Primary" label="Upload from computer" />
            </div>

            {/* Image adjustments */}
            <div className="flex flex-col gap-[2px] pb-[16px]">
              <AdjustRow label="Exposure"    value={imageExposure}    />
              <AdjustRow label="Contrast"    value={imageContrast}    />
              <AdjustRow label="Saturation"  value={imageSaturation}  />
              <AdjustRow label="Temperature" value={imageTemperature} />
              <AdjustRow label="Tint"        value={imageTint}        />
              <AdjustRow label="Highlights"  value={imageHighlights}  />
              <AdjustRow label="Shadows"     value={imageShadows}     />
            </div>
          </>
        )}
          </ModalBody>
        </>
      )}

      {/* ── Libraries tab ────────────────────────────────────────────────── */}
      {librariesAvailable && activeTab === "libraries" && (
        <ModalBody scrollable={false} className="flex flex-col overflow-hidden">
          <LibrariesTab
            groups={libraries}
            onSelect={(color, group) => {
              if (onSelectLibraryColor) onSelectLibraryColor(color, group);
              else handleHex(color.color.replace("#", ""));
            }}
          />
        </ModalBody>
      )}
    </Modal>
  );
}
