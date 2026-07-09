import { useState, Fragment, type ReactNode } from "react";
import { clsx } from "clsx";
import {
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  RotateCw, FlipHorizontal, FlipVertical,
  Link2, Link2Off, MoreHorizontal,
  AlignHorizontalJustifyCenter,
  Maximize2, Plus, Eye, Square,
  Rows2, Columns, WrapText,
  Settings2, BookOpen, Diamond,
  Crosshair, Grid3x3, ExternalLink, Unlink,
  Minus, EyeOff, SlidersHorizontal, AlignJustify, Maximize, ChevronDown,
  MoveHorizontal, MoveVertical, Play,
} from "lucide-react";
import { CirclesFour } from "@phosphor-icons/react";
import {
  Panel, PanelSection, PanelFieldRow, PanelFullRow, PanelRow,
  IconButtonRow, PanelActionBtn, PanelEntry, ScrollArea, type IconBtn,
} from "./Panel";
import { Tabs } from "./Tabs";
import { NumericInput, InputField, ColorInput, ComboInput } from "./Input";
import { Dropdown } from "./Dropdown";
import { SegmentedControl } from "./SegmentedControl";
import { Chit } from "./Chit";
import { Checkbox } from "./Checkbox";
import { ColorDialog } from "./ColorDialog";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { AnimatePanel } from "./AnimatePanel";
import { Avatar } from "./Avatar";
import { SplitButton } from "./SplitButton";
import { Button } from "./Button";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ElementType = "text" | "frame" | "frame-auto" | "shape" | "component" | "group";

type BlendMode = string;

// Full grouped list (matches the study panel); dividers render between groups.
// "Pass through" is the default — when selected, the blend-mode row is hidden.
const BLEND_GROUPS: string[][] = [
  ["Pass through", "Normal"],
  ["Darken", "Multiply", "Plus darker", "Color burn"],
  ["Lighten", "Screen", "Plus lighter", "Color dodge"],
  ["Overlay", "Soft light", "Hard light"],
  ["Difference", "Exclusion"],
  ["Hue", "Saturation", "Color", "Luminosity"],
];

const FONT = "font-[family-name:var(--composa-font-family)]";
const BODY = clsx(FONT, "text-[11px] font-[450] leading-[16px] tracking-[0.055px] text-c-text");

// ─── Small icon for panel use ─────────────────────────────────────────────────
const S = 16; // icon size in panel (24px button frame, 16px glyph = Figma inset)
const si = (n: number) => n; // alias for clarity

// Dual-tone blend/droplet glyph — grey fill + current-colour stroke (an original
// SVG in the UI3 style; not a lifted Figma asset).
function BlendDroplet({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M8 2.2c0 0 4 4.1 4 7a4 4 0 0 1-8 0c0-2.9 4-7 4-7Z"
        fill="var(--color-c-icon-secondary)"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Shared blend-mode menu (grouped + checkmark on current). Render fn → receives
// `close` from PopoverMenu.
function blendMenu(current: BlendMode, onPick: (m: BlendMode) => void) {
  return (close: () => void) => (
    <Menu minWidth={190}>
      {BLEND_GROUPS.map((group, gi) => (
        <Fragment key={gi}>
          {gi > 0 && <MenuRow type="divider" />}
          {group.map(m => (
            <MenuRow
              key={m}
              type="checkmark"
              label={m}
              checked={current === m}
              onClick={() => { onPick(m); close(); }}
            />
          ))}
        </Fragment>
      ))}
    </Menu>
  );
}

// ─── 9×9 icon groups ──────────────────────────────────────────────────────────
// Alignment grid for auto-layout — 3×3 grid of IconButtons

function AlignmentGrid({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (v: string) => void;
}) {
  const grid = [
    ["tl","tc","tr"],
    ["ml","mc","mr"],
    ["bl","bc","br"],
  ];
  const icons: Record<string, ReactNode> = {
    tl: <AlignLeft size={16} strokeWidth={1.5} />,
    tc: <AlignCenter size={16} strokeWidth={1.5} />,
    tr: <AlignRight size={16} strokeWidth={1.5} />,
    ml: <AlignLeft size={16} strokeWidth={1.5} />,
    mc: <AlignCenter size={16} strokeWidth={1.5} />,
    mr: <AlignRight size={16} strokeWidth={1.5} />,
    bl: <AlignLeft size={16} strokeWidth={1.5} />,
    bc: <AlignCenter size={16} strokeWidth={1.5} />,
    br: <AlignRight size={16} strokeWidth={1.5} />,
  };

  return (
    <div className="flex flex-col gap-px w-[72px]">
      {grid.map((row, ri) => (
        <div key={ri} className="flex gap-px">
          {row.map(cell => (
            <button
              key={cell}
              aria-label={cell}
              onClick={() => onChange?.(cell)}
              className={clsx(
                "flex items-center justify-center size-[24px] rounded-[2px]",
                "text-c-icon transition-colors",
                value === cell ? "bg-c-bg-selected" : "bg-c-bg-secondary hover:bg-c-bg-hover",
              )}
            >
              {icons[cell]}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Section: Position ────────────────────────────────────────────────────────

interface PositionSectionProps {
  x?: number; y?: number; rotation?: number;
  onXChange?: (v: number) => void;
  onYChange?: (v: number) => void;
  onRotationChange?: (v: number) => void;
  multiSelect?: boolean;
}

function PositionSection({
  x = 0, y = 0, rotation = 0,
  onXChange, onYChange, onRotationChange,
  multiSelect = false,
}: PositionSectionProps) {
  const hAlignBtns: IconBtn[] = [
    { icon: <AlignLeft       size={S} strokeWidth={1.5} />, label: "Align left",   value: "left" },
    { icon: <AlignCenter     size={S} strokeWidth={1.5} />, label: "Align center", value: "hcenter" },
    { icon: <AlignRight      size={S} strokeWidth={1.5} />, label: "Align right",  value: "right" },
  ];
  const vAlignBtns: IconBtn[] = [
    { icon: <AlignStartVertical size={S} strokeWidth={1.5} />, label: "Align top",    value: "top" },
    { icon: <AlignCenterVertical size={S} strokeWidth={1.5} />, label: "Align middle", value: "vcenter" },
    { icon: <AlignEndVertical   size={S} strokeWidth={1.5} />, label: "Align bottom", value: "bottom" },
  ];
  const rotateBtns: IconBtn[] = [
    { icon: <RotateCw       size={S} strokeWidth={1.5} />, label: "Rotate 90° CW" },
    { icon: <FlipHorizontal size={S} strokeWidth={1.5} />, label: "Flip horizontal" },
    { icon: <FlipVertical   size={S} strokeWidth={1.5} />, label: "Flip vertical" },
  ];

  return (
    <PanelSection
      title="Position"
      rightActions={
        <PanelActionBtn icon={<Maximize2 size={16} strokeWidth={1.5} />} label="Absolute position" />
      }
    >
      {/* Alignment */}
      <PanelFieldRow
        label="Alignment"
        left={<IconButtonRow buttons={hAlignBtns} fill />}
        right={<IconButtonRow buttons={vAlignBtns} fill />}
        rightAction={multiSelect
          ? <PanelActionBtn icon={<MoreHorizontal size={16} strokeWidth={1.5} />} label="More alignment" />
          : undefined}
      />

      {/* X / Y */}
      <PanelFieldRow
        label="Position"
        left={
          <NumericInput
            iconLead={<span className={clsx(FONT, "text-[11px] font-normal")}>X</span>}
            value={x} onChange={onXChange} defaultValue={0}
          />
        }
        right={
          <NumericInput
            iconLead={<span className={clsx(FONT, "text-[11px] font-normal")}>Y</span>}
            value={y} onChange={onYChange} defaultValue={0}
          />
        }
      />

      {/* Rotation */}
      <PanelFieldRow
        label="Rotation"
        left={
          <NumericInput
            iconLead={<RotateCw size={16} strokeWidth={1.5} />}
            value={rotation} onChange={onRotationChange} min={-360} max={360} suffix="°"
          />
        }
        right={<IconButtonRow buttons={rotateBtns} fill />}
      />
    </PanelSection>
  );
}

// ─── Section: Layout — Frame (no auto-layout) ─────────────────────────────────

interface LayoutFrameProps {
  width?: number; height?: number;
  cornerRadius?: number;
  clipContent?: boolean;
  onWidthChange?: (v: number) => void;
  onHeightChange?: (v: number) => void;
}

function LayoutFrameSection({
  width = 0, height = 0, cornerRadius = 0,
  clipContent = false,
  onWidthChange, onHeightChange,
}: LayoutFrameProps) {
  const [lockAspect, setLockAspect] = useState(false);
  const [flow, setFlow] = useState("v");

  const flowBtns: IconBtn[] = [
    { icon: <AlignHorizontalJustifyCenter size={S} strokeWidth={1.5} />, label: "Freeform", value: "none" },
    { icon: <Columns size={S} strokeWidth={1.5} />, label: "Horizontal", value: "h" },
    { icon: <Rows2 size={S} strokeWidth={1.5} />, label: "Vertical", value: "v" },
    { icon: <WrapText size={S} strokeWidth={1.5} />, label: "Wrap", value: "wrap" },
  ];

  return (
    <PanelSection
      title="Layout"
      rightActions={
        <>
          <PanelActionBtn icon={<Maximize2 size={16} strokeWidth={1.5} />} label="Resize to fit" />
          <PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add auto-layout" />
        </>
      }
    >
      {/* Flow */}
      <PanelFieldRow
        label="Flow"
        left={<SegmentedControl segments={flowBtns.map(b => ({ value: b.value!, icon: b.icon }))} value={flow} onChange={setFlow} className="w-full" />}
      />

      {/* W / H */}
      <PanelFieldRow
        label="Dimensions"
        left={
          <NumericInput
            iconLead={<span className={FONT}>W</span>}
            value={width} onChange={onWidthChange}
          />
        }
        right={
          <NumericInput
            iconLead={<span className={FONT}>H</span>}
            value={height} onChange={onHeightChange}
          />
        }
        rightAction={
          <PanelActionBtn
            icon={lockAspect ? <Link2 size={16} strokeWidth={1.5} /> : <Link2Off size={16} strokeWidth={1.5} />}
            label="Lock aspect ratio"
            active={lockAspect}
            onClick={() => setLockAspect(v => !v)}
          />
        }
      />

      {/* Corner radius moved to Appearance */}

      {/* Clip content */}
      <PanelFullRow height={28}>
        <Checkbox defaultChecked={clipContent} label="Clip content" />
      </PanelFullRow>
    </PanelSection>
  );
}

// ─── Section: Layout — Auto-layout ────────────────────────────────────────────

interface LayoutAutoProps {
  width?: number; height?: number;
  widthMode?: "fixed" | "hug" | "fill";
  heightMode?: "fixed" | "hug" | "fill";
  gap?: number;
  paddingTop?: number; paddingRight?: number;
  paddingBottom?: number; paddingLeft?: number;
  alignValue?: string;
}

function LayoutAutoSection({
  width = 240, height = 0,
  widthMode = "hug", heightMode = "fill",
  gap = 0,
  paddingTop = 16, paddingRight = 0, paddingBottom = 8, paddingLeft = 0,
  alignValue = "mc",
}: LayoutAutoProps) {
  const [lockAspect, setLockAspect] = useState(false);
  const [flow, setFlow] = useState("v");
  const [align, setAlign] = useState(alignValue);

  const flowBtns: IconBtn[] = [
    { icon: <Columns  size={S} strokeWidth={1.5} />, label: "Horizontal",  value: "h" },
    { icon: <Rows2    size={S} strokeWidth={1.5} />, label: "Vertical",    value: "v" },
    { icon: <WrapText size={S} strokeWidth={1.5} />, label: "Wrap",        value: "wrap" },
    { icon: <AlignHorizontalJustifyCenter size={S} strokeWidth={1.5} />, label: "Freeform", value: "none" },
  ];

  const modeLabel = (m: string) =>
    m === "hug" ? "Hug" : m === "fill" ? "Fill" : "Fixed";

  return (
    <PanelSection
      title="Auto layout"
      rightActions={
        <PanelActionBtn icon={<Settings2 size={16} strokeWidth={1.5} />} label="Auto-layout settings" />
      }
    >
      {/* Flow */}
      <PanelFieldRow
        label="Flow"
        left={<SegmentedControl segments={flowBtns.map(b => ({ value: b.value!, icon: b.icon }))} value={flow} onChange={setFlow} className="w-full" />}
      />

      {/* W / H with mode — InputField with inlineDropdown shows value + mode */}
      <PanelFieldRow
        label="Dimensions"
        left={
          <InputField
            defaultValue={String(width)}
            inlineLabel={<span className={FONT}>W</span>}
            inlineDropdown={{ value: modeLabel(widthMode) }}
          />
        }
        right={
          <InputField
            defaultValue={String(height)}
            inlineLabel={<span className={FONT}>H</span>}
            inlineDropdown={{ value: modeLabel(heightMode) }}
          />
        }
        rightAction={
          <PanelActionBtn
            icon={lockAspect ? <Link2 size={16} strokeWidth={1.5} /> : <Link2Off size={16} strokeWidth={1.5} />}
            label="Lock aspect ratio"
            active={lockAspect}
            onClick={() => setLockAspect(v => !v)}
          />
        }
      />

      {/* Alignment 3×3 + Gap */}
      <div className="flex items-start pl-[16px] pr-[8px] gap-[8px] py-[8px]">
        <AlignmentGrid value={align} onChange={setAlign} />
        <div className="flex flex-col gap-[4px] flex-1">
          <NumericInput
            iconLead={<span className={FONT}>{"]·["}</span>}
            defaultValue={gap} min={0} suffix="px"
          />
          <Dropdown value="Auto" size="default" />
        </div>
        <PanelActionBtn icon={<Settings2 size={16} strokeWidth={1.5} />} label="Gap settings" />
      </div>

      {/* Padding — cross layout */}
      <div className="px-[16px] pb-[4px]">
        <span className={clsx(FONT, "text-[9px] font-[450] text-c-text-secondary tracking-[0.05em]")}>Padding</span>
        <div className="grid grid-cols-2 gap-[4px] mt-[4px]">
          <NumericInput iconLead={<span className={FONT}>↑</span>} defaultValue={paddingTop}  min={0} />
          <NumericInput iconLead={<span className={FONT}>→</span>} defaultValue={paddingRight} min={0} />
          <NumericInput iconLead={<span className={FONT}>↓</span>} defaultValue={paddingBottom} min={0} />
          <NumericInput iconLead={<span className={FONT}>←</span>} defaultValue={paddingLeft} min={0} />
        </div>
      </div>

      {/* Clip content */}
      <PanelFullRow height={28}>
        <Checkbox defaultChecked={false} label="Clip content" />
      </PanelFullRow>
    </PanelSection>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────

interface AppearanceSectionProps {
  opacity?: number;
  blendMode?: BlendMode;
  onOpacityChange?: (v: number) => void;
}

function AppearanceSection({
  opacity = 100, blendMode = "Pass through", onOpacityChange,
}: AppearanceSectionProps) {
  const subLabel = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary mb-[3px]");
  const [indivCorners, setIndivCorners] = useState(false);
  const [blend, setBlend] = useState<BlendMode>(blendMode);
  const cornerGlyphs = ["┌", "┐", "└", "┘"]; // TL TR BL BR
  return (
    <PanelSection
      title="Appearance"
      rightActions={
        <>
          <PanelActionBtn icon={<Eye size={16} strokeWidth={1.5} />} label="Visibility" />
          {/* Blend mode — dual-tone droplet; opens the grouped blend menu */}
          <PopoverMenu
            align="right"
            trigger={<PanelActionBtn icon={<BlendDroplet size={16} />} label="Blend mode" active={blend !== "Pass through"} />}
          >
            {blendMenu(blend, setBlend)}
          </PopoverMenu>
        </>
      }
    >
      {/* Opacity + Corner radius — each labeled; reserved slot holds the independent-corners toggle */}
      <div className="flex items-end gap-[8px] pl-[16px] pr-[16px] pt-[3px]">
        <div className="flex-1 min-w-0">
          <div className={subLabel}>Opacity</div>
          <NumericInput value={opacity} onChange={onOpacityChange} min={0} max={100} suffix="%" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={subLabel}>Corner radius</div>
          <NumericInput iconLead={<Maximize size={11} strokeWidth={1.5} />} defaultValue={0} min={0} disabled={indivCorners} />
        </div>
        <PanelActionBtn icon={<Maximize size={16} strokeWidth={1.5} />} label="Independent corners" selected={indivCorners} onClick={() => setIndivCorners(v => !v)} />
      </div>

      {/* Independent corner radii — 2×2 grid, one field per corner (TL TR / BL BR) */}
      {indivCorners && (
        <div className="flex flex-col gap-[8px] pl-[16px] pr-[16px] pt-[6px]">
          {[[0, 1], [2, 3]].map((rowPair, ri) => (
            <div key={ri} className="flex items-center gap-[8px]">
              {rowPair.map(i => (
                <div key={i} className="flex-1 min-w-0">
                  <NumericInput iconLead={<span className={clsx(FONT, "text-[11px]")}>{cornerGlyphs[i]}</span>} defaultValue={0} min={0} />
                </div>
              ))}
              <div className="shrink-0 min-w-[24px]" />
            </div>
          ))}
        </div>
      )}

      {/* Blend mode — only shown when not the default "Pass through"; leading droplet, opens the menu */}
      {blend !== "Pass through" && (
      <div className="pl-[16px] pr-[16px] pt-[6px] pb-[8px]">
        <div className={subLabel}>Blend mode</div>
        <div className="flex items-center gap-[8px]">
          <PopoverMenu className="flex-1 min-w-0" trigger={<Dropdown value={blend} fullWidth leadingIcon={<BlendDroplet size={16} />} />}>
            {blendMenu(blend, setBlend)}
          </PopoverMenu>
          <PanelActionBtn icon={<Minus size={16} strokeWidth={1.5} />} label="Remove blend mode" onClick={() => setBlend("Pass through")} />
        </div>
      </div>
      )}
    </PanelSection>
  );
}

// ─── Section: Typography ──────────────────────────────────────────────────────

// Style input — dropdown-shaped (stroke, no special bg), no chevron; a chit (Ag / color) + value.
// Clicking opens the styles dialog. The unlink action is a SEPARATE right-action outside this input.
function StyleInput({ chit, value, onClick }: { chit: ReactNode; value: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full h-[24px] flex items-center gap-[6px] pl-[4px] pr-[6px] rounded-c-md bg-c-bg ring-1 ring-inset ring-c-border hover:bg-c-bg-hover text-left"
    >
      <span className="shrink-0 size-[16px] flex items-center justify-center rounded-[2px] bg-c-bg-secondary text-[10px] font-[550] leading-none text-c-text">{chit}</span>
      <span className={clsx(BODY, "flex-1 min-w-0 truncate")}>{value}</span>
    </button>
  );
}

function TypographySection() {
  const [hasStyle, setHasStyle] = useState(true);
  const subLabel = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary mb-[3px]");
  const textAlignBtns: IconBtn[] = [
    { icon: <AlignLeft   size={S} strokeWidth={1.5} />, label: "Align left",   value: "left" },
    { icon: <AlignCenter size={S} strokeWidth={1.5} />, label: "Align center", value: "center" },
    { icon: <AlignRight  size={S} strokeWidth={1.5} />, label: "Align right",  value: "right" },
  ];
  const vAlignBtns: IconBtn[] = [
    { icon: <AlignStartVertical size={S} strokeWidth={1.5} />, label: "Top",    value: "top" },
    { icon: <AlignCenterVertical size={S} strokeWidth={1.5} />, label: "Middle", value: "middle" },
    { icon: <AlignEndVertical   size={S} strokeWidth={1.5} />, label: "Bottom", value: "bottom" },
  ];

  return (
    <PanelSection
      title="Typography"
      rightActions={
        <PanelActionBtn icon={<StylesIcon />} label="Text styles" />
      }
    >
      {hasStyle ? (
        /* A text style is applied — only the style input + alignment row show */
        <div className="flex items-center gap-[8px] pl-[16px] pr-[16px] pt-[3px]">
          <div className="flex-1 min-w-0">
            <StyleInput chit="Ag" value="Title · 96/120" onClick={() => {}} />
          </div>
          <PanelActionBtn icon={<Unlink size={16} strokeWidth={1.5} />} label="Detach style" onClick={() => setHasStyle(false)} />
        </div>
      ) : (
        <>
          {/* Font family — dropdown + reserved right slot */}
          <div className="flex items-center gap-[8px] pl-[16px] pr-[16px] pt-[3px]">
            <div className="flex-1 min-w-0"><Dropdown value="Inter" fullWidth /></div>
            <div className="shrink-0 min-w-[24px]" />
          </div>

          {/* Weight / Size — no labels (Figma); Size is a combo input */}
          <div className="flex items-center gap-[8px] pl-[16px] pr-[16px] pt-[3px]">
            <div className="flex-1 min-w-0"><Dropdown value="Medium" fullWidth /></div>
            <div className="flex-1 min-w-0"><ComboInput iconLead={<span className={FONT}>T</span>} defaultValue="11" /></div>
            <div className="shrink-0 min-w-[24px]" />
          </div>

          {/* Line height / Letter spacing — labeled */}
          <div className="flex items-end gap-[8px] pl-[16px] pr-[16px] pt-[6px]">
            <div className="flex-1 min-w-0">
              <div className={subLabel}>Line height</div>
              <NumericInput iconLead={<span className={FONT}>↕</span>} defaultValue={16} min={0} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={subLabel}>Letter spacing</div>
              <NumericInput iconLead={<span className={FONT}>AV</span>} defaultValue={0} suffix="%" />
            </div>
            <div className="shrink-0 min-w-[24px]" />
          </div>
        </>
      )}

      {/* Alignment — always present, labeled */}
      <PanelFieldRow
        label="Alignment"
        left={<IconButtonRow buttons={textAlignBtns} fill />}
        right={<IconButtonRow buttons={vAlignBtns} fill />}
        rightAction={<PanelActionBtn icon={<Settings2 size={16} strokeWidth={1.5} />} label="Type settings" />}
      />
    </PanelSection>
  );
}

// ─── Section: Fill ────────────────────────────────────────────────────────────

interface FillEntry {
  id: string;
  color: string;  // hex #rrggbb
  opacity: number;
  visible: boolean;
  label?: string;
}

function FillSection() {
  const [fills, setFills] = useState<FillEntry[]>([
    { id: "1", color: "#1e1e1e", opacity: 100, visible: true, label: "Black" },
  ]);
  const [colorOpen, setColorOpen] = useState(false);
  const [activeFill, setActiveFill] = useState<string | null>(null);

  const addFill = () =>
    setFills(f => [...f, { id: String(Date.now()), color: "#ffffff", opacity: 100, visible: true }]);
  const removeFill = (id: string) => setFills(f => f.filter(x => x.id !== id));
  const toggleFill = (id: string) =>
    setFills(f => f.map(x => x.id === id ? { ...x, visible: !x.visible } : x));

  return (
    <PanelSection
      title="Fill"
      muted={fills.length === 0}
      rightActions={
        <>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <PanelActionBtn icon={<StylesIcon />} label="Styles" />
          </span>
          <PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add fill" onClick={addFill} />
        </>
      }
    >
      {/* Entry = base ColorInput + eye + minus icon buttons on the right (matches ours) */}
      {fills.map(fill => (
        <div key={fill.id} className="group/row flex items-center pr-[16px] h-[32px]">
          <DragGutter />
          <div className="flex-1 min-w-0">
            <ColorInput
              fullWidth
              color={fill.color}
              opacity={fill.opacity}
              onSwatchClick={() => { setActiveFill(fill.id); setColorOpen(true); }}
            />
          </div>
          <div className="shrink-0 flex items-center gap-[4px] pl-[8px]">
            <PanelActionBtn
              icon={fill.visible ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />}
              label={fill.visible ? "Hide" : "Show"}
              onClick={() => toggleFill(fill.id)}
            />
            <PanelActionBtn icon={<Minus size={16} strokeWidth={1.5} />} label="Remove fill" onClick={() => removeFill(fill.id)} />
          </div>
        </div>
      ))}

      <ColorDialog
        open={colorOpen}
        onClose={() => setColorOpen(false)}
        hex={fills.find(f => f.id === activeFill)?.color.replace("#", "") ?? "1e1e1e"}
      />
    </PanelSection>
  );
}

// ─── Section: Stroke ──────────────────────────────────────────────────────────

function StrokeSection() {
  const [strokes, setStrokes] = useState<{ id: string; color: string; opacity: number; visible: boolean }[]>([]);
  const [colorOpen, setColorOpen] = useState(false);
  const [activeStroke, setActiveStroke] = useState<string | null>(null);
  const add = () => setStrokes(s => [...s, { id: String(Date.now()), color: "#000000", opacity: 100, visible: true }]);
  const remove = (id: string) => setStrokes(s => s.filter(x => x.id !== id));
  const toggle = (id: string) => setStrokes(s => s.map(x => x.id === id ? { ...x, visible: !x.visible } : x));
  const subLabel = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary mb-[3px]");

  return (
    <PanelSection
      title="Stroke"
      muted={strokes.length === 0}
      rightActions={
        <>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <PanelActionBtn icon={<StylesIcon />} label="Styles" />
          </span>
          <PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add stroke" onClick={add} />
        </>
      }
    >
      {strokes.map(stroke => (
        <div key={stroke.id} className="pb-[2px]">
          {/* Row 1 — color + eye + minus (same as Fill) */}
          <div className="group/row flex items-center pr-[16px] h-[32px]">
            <DragGutter />
            <div className="flex-1 min-w-0">
              <ColorInput
                fullWidth
                color={stroke.color}
                opacity={stroke.opacity}
                onSwatchClick={() => { setActiveStroke(stroke.id); setColorOpen(true); }}
              />
            </div>
            <div className="shrink-0 flex items-center gap-[4px] pl-[8px]">
              <PanelActionBtn
                icon={stroke.visible ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />}
                label={stroke.visible ? "Hide" : "Show"}
                onClick={() => toggle(stroke.id)}
              />
              <PanelActionBtn icon={<Minus size={16} strokeWidth={1.5} />} label="Remove stroke" onClick={() => remove(stroke.id)} />
            </div>
          </div>
          {/* Row 2 — Position · Weight · settings · sides */}
          <div className="flex items-end gap-[8px] px-[16px] pb-[4px]">
            <div className="flex-1 min-w-0">
              <div className={subLabel}>Position</div>
              <Dropdown value="Center" fullWidth />
            </div>
            <div className="flex-1 min-w-0">
              <div className={subLabel}>Weight</div>
              <NumericInput iconLead={<AlignJustify size={16} strokeWidth={1.5} />} defaultValue={1} min={0} />
            </div>
            <PanelActionBtn icon={<SlidersHorizontal size={16} strokeWidth={1.5} />} label="Stroke settings" />
            <PanelActionBtn icon={<Square size={16} strokeWidth={1.5} />} label="Individual sides" />
          </div>
        </div>
      ))}

      <ColorDialog
        open={colorOpen}
        onClose={() => setColorOpen(false)}
        hex={strokes.find(s => s.id === activeStroke)?.color.replace("#", "") ?? "000000"}
      />
    </PanelSection>
  );
}

// ─── Section: Effects ─────────────────────────────────────────────────────────

function EffectsSection() {
  const [effects, setEffects] = useState<{ id: string; type: string; visible: boolean }[]>([]);
  const add = () => setEffects(e => [...e, { id: String(Date.now()), type: "Drop shadow", visible: true }]);
  const remove = (id: string) => setEffects(e => e.filter(x => x.id !== id));
  const toggle = (id: string) => setEffects(e => e.map(x => x.id === id ? { ...x, visible: !x.visible } : x));

  return (
    <PanelSection
      title="Effects"
      muted={effects.length === 0}
      rightActions={
        <>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <PanelActionBtn icon={<StylesIcon />} label="Styles" />
          </span>
          <PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add effect" onClick={add} />
        </>
      }
    >
      {effects.map(effect => (
        <div key={effect.id} className="group/row flex items-center pr-[16px] h-[32px]">
          <DragGutter />
          <div className="flex-1 min-w-0">
            <Dropdown value={effect.type} fullWidth />
          </div>
          <div className="shrink-0 flex items-center gap-[4px] pl-[8px]">
            <PanelActionBtn icon={effect.visible ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />} label={effect.visible ? "Hide" : "Show"} onClick={() => toggle(effect.id)} />
            <PanelActionBtn icon={<Minus size={16} strokeWidth={1.5} />} label="Remove effect" onClick={() => remove(effect.id)} />
          </div>
        </div>
      ))}
    </PanelSection>
  );
}

// ─── Section: Export ──────────────────────────────────────────────────────────

function ExportSection() {
  const [exports, setExports] = useState<{ id: string; scale: number; suffix: string; format: string }[]>([]);
  const add = () => setExports(e => [...e, { id: String(Date.now()), scale: 1, suffix: "", format: "PNG" }]);
  const remove = (id: string) => setExports(e => e.filter(x => x.id !== id));

  return (
    <PanelSection
      title="Export"
      muted={exports.length === 0}
      rightActions={<PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add export" onClick={add} />}
    >
      {exports.map(exp => (
        <div key={exp.id} className="group/row flex items-center h-[32px] pr-[16px]">
          <DragGutter />
          <div className="flex-1 min-w-0 flex items-center gap-[8px]">
            <ComboInput iconLead={<span className={FONT}>×</span>} defaultValue={String(exp.scale)} />
            <Dropdown value={exp.format} fullWidth />
          </div>
          <div className="shrink-0 flex items-center gap-[4px] pl-[8px]">
            <PanelActionBtn icon={<Minus size={16} strokeWidth={1.5} />} label="Remove export" onClick={() => remove(exp.id)} />
          </div>
        </div>
      ))}
    </PanelSection>
  );
}

// StylesButton glyph — phosphor circles-four
const StylesIcon = () => <CirclesFour size={16} weight="regular" />;

// Reserved 16px left gutter holding the drag handle (hover-reveal). The handle gets its
// OWN space so it never overlaps the content's 16px inset. Rows must be `group/row`.
const DragGutter = () => (
  <span className="w-[16px] shrink-0 flex items-center justify-center opacity-0 group-hover/row:opacity-40 cursor-grab text-c-icon">
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
      <circle cx="1.5" cy="2" r="1" fill="currentColor" /><circle cx="4.5" cy="2" r="1" fill="currentColor" />
      <circle cx="1.5" cy="5" r="1" fill="currentColor" /><circle cx="4.5" cy="5" r="1" fill="currentColor" />
      <circle cx="1.5" cy="8" r="1" fill="currentColor" /><circle cx="4.5" cy="8" r="1" fill="currentColor" />
    </svg>
  </span>
);

// ─── Section: Component Properties (§5.1) ─────────────────────────────────────
// Present when the selection is a component instance/definition. Kept per the
// "Figma for video" mental model. Stub controls; wire to real props later.
function ComponentPropertiesSection() {
  return (
    <PanelSection
      title="Button"
      rightActions={
        <>
          <PanelActionBtn icon={<ExternalLink size={16} strokeWidth={1.5} />} label="Go to main component" />
          <PanelActionBtn icon={<Unlink size={16} strokeWidth={1.5} />} label="Detach instance" />
        </>
      }
    >
      {/* label + control both fluid & equal-width; reserved right slot; label at dropdown-text size */}
      {[
        { label: "Variant", control: <Dropdown value="Primary" fullWidth /> },
        { label: "Size", control: <Dropdown value="Medium" fullWidth /> },
        { label: "Label", control: <InputField placeholder="Button" /> },
      ].map((row, i) => (
        <div key={i} className="flex items-center gap-[8px] pl-[16px] pr-[16px] h-[32px]">
          <span className={clsx(BODY, "flex-1 min-w-0 truncate !text-c-text-secondary")}>{row.label}</span>
          <div className="flex-1 min-w-0">{row.control}</div>
          <div className="shrink-0 min-w-[24px]" />
        </div>
      ))}
    </PanelSection>
  );
}

// ─── Section: Layout Guide (§5.6) ─────────────────────────────────────────────
// Frames only. Stackable: Grid / Columns / Rows guides.
function LayoutGuideSection() {
  const [guides, setGuides] = useState<{ id: string; type: string; visible: boolean }[]>([]);
  const add = () => setGuides(g => [...g, { id: String(Date.now()), type: "Grid", visible: true }]);
  const remove = (id: string) => setGuides(g => g.filter(x => x.id !== id));
  const toggle = (id: string) => setGuides(g => g.map(x => x.id === id ? { ...x, visible: !x.visible } : x));
  return (
    <PanelSection
      title="Layout guide"
      muted={guides.length === 0}
      rightActions={<PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add layout guide" onClick={add} />}
    >
      {guides.map(g => (
        <div key={g.id} className="group/row flex items-center h-[32px] pr-[16px]">
          <DragGutter />
          <div className="flex-1 min-w-0 flex items-center gap-[8px]">
            <Dropdown value={g.type} fullWidth />
            <NumericInput iconLead={<Grid3x3 size={16} strokeWidth={1.5} />} defaultValue={8} min={1} />
          </div>
          <div className="shrink-0 flex items-center gap-[4px] pl-[8px]">
            <PanelActionBtn icon={g.visible ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />} label={g.visible ? "Hide" : "Show"} onClick={() => toggle(g.id)} />
            <PanelActionBtn icon={<Minus size={16} strokeWidth={1.5} />} label="Remove guide" onClick={() => remove(g.id)} />
          </div>
        </div>
      ))}
    </PanelSection>
  );
}

// ─── Section: Selection Colors (§5.8) ─────────────────────────────────────────
// Multi-select only, always last, no collapse. Derived colors across the selection;
// each row edits every use of that color. No drag/eye/remove.
function SelectionColorsSection() {
  const [collapsed, setCollapsed] = useState(true);
  const [colorOpen, setColorOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const colors = [
    { hex: "1E1E1E", opacity: 100 },
    { hex: "0D99FF", opacity: 100 },
    { hex: "FFFFFF", opacity: 100 },
    { hex: "14AE5C", opacity: 100 },
    { hex: "FFCD29", opacity: 100 },
    { hex: "9747FF", opacity: 100 },
  ];
  const maxChips = 4;
  return (
    <PanelSection
      title="Selection colors"
      onHeaderClick={() => setCollapsed(v => !v)}
      rightActions={collapsed ? (
        /* Collapsed only: color chips + overflow on the right (no chevron). Click to expand. */
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand selection colors"
          className="flex items-center gap-[3px]"
        >
          {colors.slice(0, maxChips).map((c, i) => (
            <span key={i} className="size-[16px] rounded-[3px] ring-1 ring-inset ring-[rgba(0,0,0,0.1)]" style={{ background: `#${c.hex}` }} />
          ))}
          {colors.length > maxChips && (
            <span className={clsx(FONT, "text-[10px] font-[550] text-c-text-secondary ml-[1px]")}>+{colors.length - maxChips}</span>
          )}
        </button>
      ) : undefined}
    >
      {!collapsed && colors.map((c, i) => (
        <div key={i} className="group/row flex items-center px-[16px] h-[32px] gap-[8px]">
          <div className="flex-1 min-w-0">
            <ColorInput fullWidth color={`#${c.hex}`} opacity={c.opacity} onSwatchClick={() => { setActiveIdx(i); setColorOpen(true); }} />
          </div>
          {/* Reserved slot; actions reveal on this row's hover — no reflow (§5.8) */}
          <div className="shrink-0 flex items-center gap-[4px] opacity-0 group-hover/row:opacity-100 transition-opacity duration-100">
            <PanelActionBtn icon={<StylesIcon />} label="Apply color style" />
            <PanelActionBtn icon={<Crosshair size={16} strokeWidth={1.5} />} label="Select all using this color" />
          </div>
        </div>
      ))}

      <ColorDialog open={colorOpen} onClose={() => setColorOpen(false)} hex={colors[activeIdx]?.hex ?? "1e1e1e"} />
    </PanelSection>
  );
}

// ─── PropertyPanel ────────────────────────────────────────────────────────────

export interface PropertyPanelProps {
  elementType?: ElementType;
  multiSelect?: boolean;
  x?: number; y?: number; rotation?: number;
  width?: number; height?: number;
  opacity?: number;
  blendMode?: BlendMode;
  className?: string;
}

// ─── Multiplayer bar ──────────────────────────────────────────────────────────
// Sits above the tab strip: avatar split-button (leading), then a play/present
// split-button + Share button trailing.
function MultiplayerBar() {
  return (
    <div className="flex items-center gap-[8px] px-[8px] py-[6px]">
      <SplitButton
        size="large"
        icon={<Avatar initial="S" size="default" color="purple" />}
        onIconClick={() => {}}
        onChevronClick={() => {}}
      />
      <div className="flex-1" />
      <SplitButton
        size="large"
        icon={<Play size={18} fill="currentColor" strokeWidth={0} />}
        onIconClick={() => {}}
        onChevronClick={() => {}}
      />
      <Button label="Share" variant="Primary" size="large" />
    </div>
  );
}

export function PropertyPanel({
  elementType = "text",
  multiSelect = false,
  x = 0, y = 0, rotation = 0,
  width = 1200, height = 115,
  opacity = 100,
  blendMode = "Pass through",
  className,
}: PropertyPanelProps) {
  const [tab, setTab] = useState("design");
  const [textResize, setTextResize] = useState("auto-w");
  const textResizeSegments = [
    { value: "auto-w", icon: <MoveHorizontal size={S} strokeWidth={1.5} /> },
    { value: "auto-h", icon: <MoveVertical size={S} strokeWidth={1.5} /> },
    { value: "fixed",  icon: <Square size={S} strokeWidth={1.5} /> },
  ];

  const isText     = elementType === "text";
  const isFrame    = elementType === "frame";
  const isAutoLayout = elementType === "frame-auto";
  const isShape    = elementType === "shape";
  const isInstance = elementType === "component";

  const elementLabel: Record<ElementType, string> = {
    text: "Text",
    frame: "Frame",
    "frame-auto": "Frame",
    shape: "Rectangle",
    component: "Component",
    group: "Group",
  };

  return (
    <Panel className={clsx("h-full overflow-hidden flex flex-col", className)}>
      {/* Multiplayer tools — above the tabs */}
      <MultiplayerBar />

      {/* Tab strip */}
      <div className="border-b border-c-border px-[8px] pt-[6px] pb-[6px]">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "design",  label: "Design" },
            { value: "animate", label: "Animate" },
          ]}
        />
      </div>

      {/* Design tab content */}
      {tab === "design" && (
        <ScrollArea>
          {/* Element type label */}
          <div className="h-[40px] flex items-center px-[16px] border-b border-c-border">
            <span className={clsx(FONT, "text-[11px] font-[550] text-c-text")}>
              {elementLabel[elementType]}
            </span>
          </div>

          {/* Component Properties — instances only (§5.1), at the very top */}
          {isInstance && <ComponentPropertiesSection />}

          {/* Position — always present */}
          <PositionSection x={x} y={y} rotation={rotation} />

          {/* Layout — polymorphic */}
          {(isFrame)       && <LayoutFrameSection width={width} height={height} />}
          {(isAutoLayout)  && <LayoutAutoSection  width={width} height={height} />}
          {(isShape || isText) && (
            <PanelSection title="Layout">
              {/* Resizing — segmented (auto width / auto height / fixed); text only */}
              {isText && (
                <PanelFieldRow
                  label="Resizing"
                  left={<SegmentedControl segments={textResizeSegments} value={textResize} onChange={setTextResize} className="w-full" />}
                />
              )}
              <PanelFieldRow
                label="Dimensions"
                left={<NumericInput iconLead={<span className={FONT}>W</span>} defaultValue={width} />}
                right={<NumericInput iconLead={<span className={FONT}>H</span>} defaultValue={height} />}
                rightAction={
                  <PanelActionBtn icon={<Link2Off size={16} strokeWidth={1.5} />} label="Lock aspect ratio" />
                }
              />
              {/* Corner radius moved to Appearance */}
            </PanelSection>
          )}

          {/* Appearance — always present */}
          <AppearanceSection opacity={opacity} blendMode={blendMode} />

          {/* Typography — text only */}
          {isText && <TypographySection />}

          {/* Stackable sections */}
          <FillSection />
          <StrokeSection />
          <EffectsSection />

          {/* Selection Colors — multi-select only (§5.8), positioned right after Effects */}
          {multiSelect && <SelectionColorsSection />}

          {/* Layout Guide — frames only (§5.6) */}
          {(isFrame || isAutoLayout) && <LayoutGuideSection />}

          <ExportSection />
        </ScrollArea>
      )}

      {/* Animate tab — the animation panel */}
      {tab === "animate" && <AnimatePanel />}

      {/* Prototype placeholder */}
      {tab === "prototype" && (
        <div className="flex-1 flex items-center justify-center">
          <span className={clsx(FONT, "text-[11px] text-c-text-tertiary")}>Prototype settings</span>
        </div>
      )}
    </Panel>
  );
}
