import { useEffect, useState, Fragment, type ReactNode } from "react";
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
  MoveHorizontal, MoveVertical, Play, Pause,
  Image as ImageIcon, Video, Clock,
} from "lucide-react";
import { CirclesFour } from "@phosphor-icons/react";
import {
  Panel, PanelSection, PanelFieldRow, PanelFullRow, PanelRow,
  IconButtonRow, PanelActionBtn, PanelEntry, ScrollArea, type IconBtn,
} from "./Panel";
import { Tabs } from "./Tabs";
import { NumericEditSessionProvider, NumericInput, NumericComboInput, InputField, ColorInput, ComboInput, formatNumericDisplay } from "./Input";
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
import { Tooltip } from "./Tooltip";
import { EffectDetailsDialog, type EffectDetailsValue } from "./EffectDetailsDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ElementType = "text" | "frame" | "frame-auto" | "shape" | "component" | "group";

export type PanelMode = "project" | "slide" | "element" | "video-clip";

export type SlideBackgroundType = "solid" | "gradient" | "image" | "video";
export type SlideTransitionType = "none" | "fade" | "push" | "slide" | "wipe";
export type SlideTransitionDirection = "left" | "right" | "up" | "down";
export type SlideTransitionEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out";
export type ClipSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2 | 4;
export type ExportFormat = "PNG" | "JPG";
export interface InspectorExportSetting { id: string; scale: number; suffix: string; format: ExportFormat; }
export type ProjectFrameRate = 24 | 25 | 30 | 60;
export interface ElementFillSetting { id: string; color: string; opacity: number; visible: boolean; label?: string; }
export interface ElementStrokeSetting extends ElementFillSetting { weight: number; align: "inside" | "center" | "outside"; }
export interface ElementEffectSetting extends EffectDetailsValue { id: string; }
export interface ElementLayoutGuideSetting { id: string; type: "Grid" | "Columns" | "Rows"; visible: boolean; size: number; }
export interface ElementSelectionColorSetting { id: string; color: string; opacity: number; usageCount?: number; }
export interface InspectorCapabilities { templates?: boolean; styles?: boolean; variables?: boolean; libraries?: boolean; }
export interface ElementTypographySettings {
  fontFamily: string; fontWeight: string; fontSize: number; lineHeight: number; letterSpacing: number;
  align: "left" | "center" | "right"; verticalAlign: "top" | "middle" | "bottom"; styleName?: string;
}
export interface ElementLayoutSettings {
  mode: "none" | "horizontal" | "vertical" | "wrap"; gap: number | "auto";
  padding: { top: number; right: number; bottom: number; left: number };
  align: string; widthMode: "fixed" | "hug" | "fill"; heightMode: "fixed" | "hug" | "fill"; clipsContent: boolean;
  positioning?: "auto" | "absolute";
  positioningApplicable?: boolean;
  minWidth?: number; minHeight?: number; maxWidth?: number; maxHeight?: number;
  availableWidthModes?: ElementSizingMode[];
  availableHeightModes?: ElementSizingMode[];
  widthModeMixed?: boolean;
  heightModeMixed?: boolean;
  minWidthMixed?: boolean; minHeightMixed?: boolean; maxWidthMixed?: boolean; maxHeightMixed?: boolean;
}

export type ElementSizingAxis = "width" | "height";
export type ElementSizingMode = "fixed" | "hug" | "fill";
export interface ElementSizingChange { mode: ElementSizingMode; value?: number; }
export type ElementSizingConstraint = "min" | "max";

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
const SUBLABEL = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary");

// Two independently-labeled fields side by side. Used by the project/slide/clip
// panels (not the element PropertyPanel) where two related controls read better as
// one two-column row — e.g. Speed | Volume, Trim in | Trim out, Total dur | Playhead.
function DualField({
  leftLabel,
  left,
  rightLabel,
  right,
}: {
  leftLabel?: string;
  left: ReactNode;
  rightLabel?: string;
  right: ReactNode;
}) {
  return (
    <div className="h-[48px] flex items-center gap-[8px] px-[16px]">
      <div className="flex-1 min-w-0 flex flex-col pt-[3px] pb-[4px]">
        {leftLabel && <span className={clsx(SUBLABEL, "mb-[3px]")}>{leftLabel}</span>}
        <div className="min-h-[24px] flex items-center">{left}</div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col pt-[3px] pb-[4px]">
        {rightLabel && <span className={clsx(SUBLABEL, "mb-[3px]")}>{rightLabel}</span>}
        <div className="min-h-[24px] flex items-center">{right}</div>
      </div>
    </div>
  );
}

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

function AutoLayoutHorizontalAlignmentControl({
  value = "mc",
  onChange,
}: {
  value?: string;
  onChange?: (v: string) => void;
}) {
  const row = value[0] === "t" || value[0] === "m" || value[0] === "b" ? value[0] : "m";
  const column = value[1] === "l" || value[1] === "c" || value[1] === "r" ? value[1] : "c";
  const horizontal: IconBtn[] = [
    { icon: <AlignLeft size={S} strokeWidth={1.5} />, label: "Align left", value: "l" },
    { icon: <AlignCenter size={S} strokeWidth={1.5} />, label: "Align center", value: "c" },
    { icon: <AlignRight size={S} strokeWidth={1.5} />, label: "Align right", value: "r" },
  ];
  return (
    <SegmentedControl
      segments={horizontal.map(button => ({ value: button.value!, icon: button.icon, ariaLabel: button.label }))}
      value={column}
      onChange={column => onChange?.(`${row}${column}`)}
      className="w-full"
    />
  );
}

function AutoLayoutVerticalAlignmentControl({
  value = "mc",
  onChange,
}: {
  value?: string;
  onChange?: (v: string) => void;
}) {
  const row = value[0] === "t" || value[0] === "m" || value[0] === "b" ? value[0] : "m";
  const column = value[1] === "l" || value[1] === "c" || value[1] === "r" ? value[1] : "c";
  const vertical: IconBtn[] = [
    { icon: <AlignStartVertical size={S} strokeWidth={1.5} />, label: "Align top", value: "t" },
    { icon: <AlignCenterVertical size={S} strokeWidth={1.5} />, label: "Align middle", value: "m" },
    { icon: <AlignEndVertical size={S} strokeWidth={1.5} />, label: "Align bottom", value: "b" },
  ];
  return (
    <SegmentedControl
      segments={vertical.map(button => ({ value: button.value!, icon: button.icon, ariaLabel: button.label }))}
      value={row}
      onChange={row => onChange?.(`${row}${column}`)}
      className="w-full"
    />
  );
}

// ─── Shared W/H sizing controls ─────────────────────────────────────────────

export interface SizingComboFieldProps {
  axis: ElementSizingAxis;
  value: number;
  mode: ElementSizingMode;
  mixed?: boolean;
  availableModes?: ElementSizingMode[];
  minValue?: number;
  maxValue?: number;
  variablesEnabled?: boolean;
  onApplyVariable?: () => void;
  onValueChange?: (value: number) => void;
  onSizingChange?: (change: ElementSizingChange) => void;
  onConstraintChange?: (constraint: ElementSizingConstraint, value: number | undefined) => void;
}

export function getSizingMenuLabels({
  axis, value, availableModes = ["fixed", "hug", "fill"], minValue, maxValue, variablesEnabled = false,
}: Pick<SizingComboFieldProps, "axis" | "value" | "availableModes" | "minValue" | "maxValue" | "variablesEnabled">): string[] {
  const noun = axis;
  return [
    ...(availableModes.includes("fixed") ? [`Fixed ${noun} (${formatNumericDisplay(value)})`] : []),
    ...(availableModes.includes("hug") ? ["Hug contents"] : []),
    ...(availableModes.includes("fill") ? ["Fill container"] : []),
    minValue === undefined ? `Add min ${noun}` : `Remove min ${noun}`,
    maxValue === undefined ? `Add max ${noun}` : `Remove max ${noun}`,
    ...(variablesEnabled ? ["Apply variable"] : []),
  ];
}

export function SizingComboField({
  axis, value, mode, mixed = false, availableModes = ["fixed", "hug", "fill"],
  minValue, maxValue, variablesEnabled = false, onValueChange, onSizingChange, onConstraintChange, onApplyVariable,
}: SizingComboFieldProps) {
  const axisLabel = axis === "width" ? "Width" : "Height";
  const modeLabel = mixed ? "Mixed" : mode === "hug" ? "Hug" : mode === "fill" ? "Fill" : undefined;
  const emitMode = (nextMode: ElementSizingMode) => onSizingChange?.({ mode: nextMode, ...(nextMode === "fixed" ? { value } : {}) });
  const emitValue = (nextValue: number) => {
    if (onSizingChange) onSizingChange({ mode: "fixed", value: nextValue });
    else onValueChange?.(nextValue);
  };
  const initialMin = maxValue === undefined ? value : Math.min(value, maxValue);
  const initialMax = minValue === undefined ? value : Math.max(value, minValue);
  const menu = (close: () => void) => (
    <Menu minWidth={190}>
      {availableModes.includes("fixed") && <MenuRow type="checkmark" label={`Fixed ${axis} (${formatNumericDisplay(value)})`} checked={!mixed && mode === "fixed"} onClick={() => { emitMode("fixed"); close(); }} />}
      {availableModes.includes("hug") && <MenuRow type="checkmark" label="Hug contents" checked={!mixed && mode === "hug"} onClick={() => { emitMode("hug"); close(); }} />}
      {availableModes.includes("fill") && <MenuRow type="checkmark" label="Fill container" checked={!mixed && mode === "fill"} onClick={() => { emitMode("fill"); close(); }} />}
      <MenuRow type="divider" />
      <MenuRow type="simple" label={minValue === undefined ? `Add min ${axis}` : `Remove min ${axis}`} onClick={() => { onConstraintChange?.("min", minValue === undefined ? initialMin : undefined); close(); }} />
      <MenuRow type="simple" label={maxValue === undefined ? `Add max ${axis}` : `Remove max ${axis}`} onClick={() => { onConstraintChange?.("max", maxValue === undefined ? initialMax : undefined); close(); }} />
      {variablesEnabled && <><MenuRow type="divider" /><MenuRow type="simple" label="Apply variable" disabled={!onApplyVariable} onClick={onApplyVariable ? () => { onApplyVariable(); close(); } : undefined} /></>}
    </Menu>
  );
  return <NumericComboInput
    dataMode={mixed ? "mixed" : mode}
    ariaLabel={axisLabel}
    dropdownAriaLabel={`${axisLabel} sizing mode: ${mixed ? "Mixed" : modeLabel ?? "Fixed"}`}
    triggerLabel={modeLabel}
    iconLead={<span className={FONT}>{axis === "width" ? "W" : "H"}</span>}
    value={value}
    onChange={emitValue}
    min={0}
    menu={menu}
    className="w-full"
  />;
}

export interface DimensionSizingFieldsProps {
  width: number; height: number;
  widthMode?: ElementSizingMode; heightMode?: ElementSizingMode;
  widthMixed?: boolean; heightMixed?: boolean;
  availableWidthModes?: ElementSizingMode[]; availableHeightModes?: ElementSizingMode[];
  minWidth?: number; minHeight?: number; maxWidth?: number; maxHeight?: number;
  minWidthMixed?: boolean; minHeightMixed?: boolean; maxWidthMixed?: boolean; maxHeightMixed?: boolean;
  variablesEnabled?: boolean;
  onWidthChange?: (value: number) => void; onHeightChange?: (value: number) => void;
  onSizingChange?: (axis: ElementSizingAxis, change: ElementSizingChange) => void;
  onConstraintChange?: (axis: ElementSizingAxis, constraint: ElementSizingConstraint, value: number | undefined) => void;
  onApplySizingVariable?: (axis: ElementSizingAxis) => void;
}

export function DimensionSizingFields(props: DimensionSizingFieldsProps) {
  const [localWidthMode, setLocalWidthMode] = useState<ElementSizingMode>(props.widthMode ?? "fixed");
  const [localHeightMode, setLocalHeightMode] = useState<ElementSizingMode>(props.heightMode ?? "fixed");
  const [lockAspect, setLockAspect] = useState(false);
  const controlledSizing = !!props.onSizingChange;
  const [localConstraints, setLocalConstraints] = useState<Pick<DimensionSizingFieldsProps, "minWidth" | "minHeight" | "maxWidth" | "maxHeight">>({
    minWidth: props.minWidth, minHeight: props.minHeight, maxWidth: props.maxWidth, maxHeight: props.maxHeight,
  });
  const controlledConstraints = !!props.onConstraintChange;
  const values = controlledConstraints ? props : { ...props, ...localConstraints };
  const changeConstraint = (axis: ElementSizingAxis, constraint: ElementSizingConstraint, value: number | undefined) => {
    if (!controlledConstraints) {
      const key = `${constraint}${axis === "width" ? "Width" : "Height"}` as "minWidth" | "minHeight" | "maxWidth" | "maxHeight";
      setLocalConstraints(current => ({ ...current, [key]: value }));
    }
    props.onConstraintChange?.(axis, constraint, value);
  };
  const changeSizing = (axis: ElementSizingAxis, change: ElementSizingChange) => {
    if (!controlledSizing) {
      if (axis === "width") setLocalWidthMode(change.mode); else setLocalHeightMode(change.mode);
      if (change.value !== undefined) (axis === "width" ? props.onWidthChange : props.onHeightChange)?.(change.value);
    }
    props.onSizingChange?.(axis, change);
  };
  const constraintFields = [
    ["min", "width", "Min width", values.minWidth, props.minWidthMixed], ["min", "height", "Min height", values.minHeight, props.minHeightMixed],
    ["max", "width", "Max width", values.maxWidth, props.maxWidthMixed], ["max", "height", "Max height", values.maxHeight, props.maxHeightMixed],
  ] as const;
  const hasConstraints = constraintFields.some(([, , , value, mixed]) => value !== undefined || mixed);
  return <>
    <PanelFieldRow
      label="Dimensions"
      left={<SizingComboField axis="width" value={props.width} mode={controlledSizing ? props.widthMode ?? "fixed" : localWidthMode} mixed={props.widthMixed} availableModes={props.availableWidthModes} minValue={values.minWidth} maxValue={values.maxWidth} variablesEnabled={props.variablesEnabled} onSizingChange={change => changeSizing("width", change)} onConstraintChange={(constraint, value) => changeConstraint("width", constraint, value)} onApplyVariable={props.onApplySizingVariable ? () => props.onApplySizingVariable?.("width") : undefined} />}
      right={<SizingComboField axis="height" value={props.height} mode={controlledSizing ? props.heightMode ?? "fixed" : localHeightMode} mixed={props.heightMixed} availableModes={props.availableHeightModes} minValue={values.minHeight} maxValue={values.maxHeight} variablesEnabled={props.variablesEnabled} onSizingChange={change => changeSizing("height", change)} onConstraintChange={(constraint, value) => changeConstraint("height", constraint, value)} onApplyVariable={props.onApplySizingVariable ? () => props.onApplySizingVariable?.("height") : undefined} />}
      rightAction={<PanelActionBtn icon={lockAspect ? <Link2 size={16} strokeWidth={1.5} /> : <Link2Off size={16} strokeWidth={1.5} />} label="Lock aspect ratio" active={lockAspect} onClick={() => setLockAspect(value => !value)} />}
    />
    {hasConstraints && <div className="grid grid-cols-2 gap-x-[8px] gap-y-[6px] px-[16px] pb-[8px]">
      {constraintFields.map(([constraint, axis, label, value, mixed]) => value === undefined && !mixed ? <div key={`${constraint}-${axis}`} /> : <div key={`${constraint}-${axis}`} className="min-w-0">
        <div className={clsx(SUBLABEL, "mb-[3px]")}>{label}</div>
        <NumericInput ariaLabel={label} value={value} defaultValue={0} mixed={mixed} onChange={next => changeConstraint(axis, constraint, next)} min={constraint === "max" ? (axis === "width" ? values.minWidth : values.minHeight) ?? 0 : 0} max={constraint === "min" ? (axis === "width" ? values.maxWidth : values.maxHeight) : undefined} />
      </div>)}
    </div>}
  </>;
}

// ─── Section: Position ────────────────────────────────────────────────────────

interface PositionSectionProps {
  x?: number; y?: number; rotation?: number;
  onXChange?: (v: number) => void;
  onYChange?: (v: number) => void;
  onRotationChange?: (v: number) => void;
  positioning?: "auto" | "absolute";
  positioningApplicable?: boolean;
  onPositioningChange?: (value: "auto" | "absolute") => void;
  multiSelect?: boolean;
}

function PositionSection({
  x = 0, y = 0, rotation = 0,
  onXChange, onYChange, onRotationChange,
  positioning, positioningApplicable, onPositioningChange,
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
      rightActions={positioningApplicable === false ? undefined :
        <PanelActionBtn icon={<Maximize2 size={16} strokeWidth={1.5} />}
          label={positioning === "absolute" ? "Return to auto-layout flow" : "Absolute position"}
          selected={positioning === undefined ? undefined : positioning === "absolute"}
          disabled={positioningApplicable === true && (positioning === undefined || !onPositioningChange)}
          onClick={onPositioningChange && positioning ? () => onPositioningChange(positioning === "absolute" ? "auto" : "absolute") : undefined} />
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
            ariaLabel="Position X"
            iconLead={<span className={clsx(FONT, "text-[11px] font-normal")}>X</span>}
            value={x} onChange={onXChange} defaultValue={0}
          />
        }
        right={
          <NumericInput
            ariaLabel="Position Y"
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
            ariaLabel="Rotation"
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
  sizing?: Omit<DimensionSizingFieldsProps, "width" | "height" | "onWidthChange" | "onHeightChange">;
  onClipContentChange?: (value: boolean) => void;
  /** Auto-layout is reached from here two ways: the "+" button, or moving Flow
   * off its first ("Freeform") option. Both call this. */
  onEnableAutoLayout?: () => void;
}

function LayoutFrameSection({
  width = 0, height = 0, cornerRadius = 0,
  clipContent = false,
  onWidthChange, onHeightChange, onClipContentChange,
  sizing,
  onEnableAutoLayout,
}: LayoutFrameProps) {
  // Plain frame defaults to Freeform (no auto-layout yet) — NOT "v", which would
  // already imply vertical auto-layout while this is the "no auto-layout" section.
  const [flow, setFlow] = useState("none");

  const flowBtns: IconBtn[] = [
    { icon: <AlignHorizontalJustifyCenter size={S} strokeWidth={1.5} />, label: "Freeform", value: "none" },
    { icon: <Rows2 size={S} strokeWidth={1.5} />, label: "Vertical", value: "v" },
    { icon: <Columns size={S} strokeWidth={1.5} />, label: "Horizontal", value: "h" },
    { icon: <WrapText size={S} strokeWidth={1.5} />, label: "Wrap", value: "wrap" },
  ];

  const handleFlowChange = (v: string) => {
    setFlow(v);
    if (v !== "none") onEnableAutoLayout?.();
  };

  return (
    <PanelSection
      title="Layout"
      rightActions={
        <>
          <PanelActionBtn icon={<Maximize2 size={16} strokeWidth={1.5} />} label="Resize to fit" />
          <PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add auto-layout" onClick={onEnableAutoLayout} />
        </>
      }
    >
      {/* Flow */}
      <PanelFieldRow
        label="Flow"
        left={<SegmentedControl segments={flowBtns.map(b => ({ value: b.value!, icon: b.icon, ariaLabel: b.label }))} value={flow} onChange={handleFlowChange} className="w-full" />}
      />

      <DimensionSizingFields width={width} height={height} onWidthChange={onWidthChange} onHeightChange={onHeightChange} {...sizing} />

      {/* Corner radius moved to Appearance */}

      {/* Clip content */}
      <PanelFullRow height={28}>
        <Checkbox checked={onClipContentChange ? clipContent : undefined} defaultChecked={clipContent} onChange={onClipContentChange} label="Clip content" />
      </PanelFullRow>
    </PanelSection>
  );
}

// ─── Section: Layout — Auto-layout ────────────────────────────────────────────

interface LayoutAutoProps {
  width?: number; height?: number;
  flowMode?: ElementLayoutSettings["mode"];
  widthMode?: "fixed" | "hug" | "fill";
  heightMode?: "fixed" | "hug" | "fill";
  gap?: number | "auto";
  paddingTop?: number; paddingRight?: number;
  paddingBottom?: number; paddingLeft?: number;
  alignValue?: string;
  clipContent?: boolean;
  onLayoutChange?: (patch: Partial<Pick<ElementLayoutSettings, "mode" | "gap">>) => void;
  onPaddingChange?: (value: ElementLayoutSettings["padding"]) => void;
  onAlignChange?: (value: string) => void;
  onClipContentChange?: (value: boolean) => void;
  onAutoLayoutSettingsRequest?: () => void;
  sizing?: Omit<DimensionSizingFieldsProps, "width" | "height" | "widthMode" | "heightMode">;
}

export function reconcileAutoLayoutGap(
  mode: ElementLayoutSettings["mode"],
  gap: number | "auto",
  lastFixedGap: number,
): number | "auto" {
  return mode === "wrap" && gap === "auto" ? lastFixedGap : gap;
}

function LayoutAutoSection({
  width = 240, height = 0,
  flowMode,
  widthMode = "hug", heightMode = "fill",
  gap: gapProp,
  paddingTop = 16, paddingRight = 0, paddingBottom = 8, paddingLeft = 0,
  alignValue = "mc",
  clipContent = false,
  onLayoutChange, onPaddingChange, onAlignChange, onClipContentChange, onAutoLayoutSettingsRequest, sizing,
}: LayoutAutoProps) {
  const controlled = flowMode !== undefined;
  const [flow, setFlow] = useState("v");
  const renderedFlow = flowMode === "horizontal" ? "h" : flowMode === "vertical" ? "v" : flowMode ?? flow;
  const [align, setAlign] = useState(alignValue);
  const renderedAlign = controlled ? alignValue : align;
  const gapControlled = gapProp !== undefined;
  const [internalGap, setInternalGap] = useState<number | "auto">(gapProp ?? 0);
  const renderedGap = gapControlled ? gapProp : internalGap;
  const [lastFixedGap, setLastFixedGap] = useState(typeof renderedGap === "number" ? renderedGap : 0);
  const [indivPadding, setIndivPadding] = useState(false);
  const subLabel = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary mb-[3px]");

  // Freeform is the plain-frame state, not an active auto-layout direction.
  const flowBtns: IconBtn[] = [
    { icon: <Rows2    size={S} strokeWidth={1.5} />, label: "Vertical",    value: "v" },
    { icon: <Columns  size={S} strokeWidth={1.5} />, label: "Horizontal",  value: "h" },
    { icon: <WrapText size={S} strokeWidth={1.5} />, label: "Wrap",        value: "wrap" },
  ];

  const handleFlowChange = (v: string) => {
    setFlow(v);
    const mode = v === "h" ? "horizontal" : v === "v" ? "vertical" : v as "none" | "wrap";
    const reconciledGap = reconcileAutoLayoutGap(mode, renderedGap, lastFixedGap);
    const nextGap = reconciledGap === renderedGap ? undefined : reconciledGap;
    if (nextGap !== undefined && !gapControlled) setInternalGap(nextGap);
    onLayoutChange?.({ mode, ...(nextGap === undefined ? {} : { gap: nextGap }) });
  };

  const emitGap = (value: number | "auto") => {
    if (!gapControlled) setInternalGap(value);
    if (typeof value === "number") setLastFixedGap(value);
    onLayoutChange?.({ gap: value });
  };

  useEffect(() => {
    if (typeof gapProp === "number") setLastFixedGap(gapProp);
  }, [gapProp]);

  const gapMode = renderedGap === "auto" ? "auto" : "fixed";
  const gapAxis = renderedFlow === "v" ? "vertical" : "horizontal";
  const gapIcon = gapAxis === "vertical"
    ? <MoveVertical size={14} strokeWidth={1.5} />
    : <MoveHorizontal size={14} strokeWidth={1.5} />;

  const gapMenu = (close: () => void) => (
    <Menu minWidth={156}>
      <MenuRow
        type="checkmark"
        label="Fixed"
        checked={gapMode === "fixed"}
        onClick={() => { emitGap(lastFixedGap); close(); }}
      />
      {renderedFlow !== "wrap" && (
        <MenuRow
          type="checkmark"
          label="Auto"
          checked={gapMode === "auto"}
          onClick={() => { emitGap("auto"); close(); }}
        />
      )}
    </Menu>
  );

  return (
    <PanelSection title="Auto layout" rightActions={<PanelActionBtn icon={<Settings2 size={16} strokeWidth={1.5} />} label="Auto-layout settings" onClick={onAutoLayoutSettingsRequest} />}>
      {/* Flow + Gap are the canonical first row. Wrap intentionally exposes one
          shared numeric gap; Auto remains unavailable while wrapping. */}
      <div role="group" aria-label="Flow and gap" className="pl-[16px] pr-[16px] py-[8px]">
        <div className="flex items-start gap-[8px]">
          <div className="flex-[3] min-w-0">
            <div className={subLabel}>Flow</div>
            <SegmentedControl segments={flowBtns.map(b => ({ value: b.value!, icon: b.icon, ariaLabel: b.label }))} value={renderedFlow} onChange={handleFlowChange} className="w-full" />
          </div>
          <div className="flex-[2] min-w-0">
            <div className={subLabel}>Gap</div>
            <NumericComboInput
              dataMode={gapMode}
              ariaLabel="Gap"
              dropdownAriaLabel={`Gap sizing mode: ${gapMode === "auto" ? "Auto" : "Fixed"}`}
              iconLead={gapIcon}
              readOnlyLabel={gapMode === "auto" ? "Auto" : undefined}
              value={gapControlled && typeof renderedGap === "number" ? renderedGap : undefined}
              defaultValue={lastFixedGap}
              onChange={emitGap}
              min={0}
              suffix="px"
              menu={gapMenu}
              className="w-full"
            />
          </div>
          <div className="shrink-0 pt-[17px]">
            <PanelActionBtn icon={<Settings2 size={16} strokeWidth={1.5} />} label="Auto-layout settings" onClick={onAutoLayoutSettingsRequest} />
          </div>
        </div>
      </div>

      <PanelFieldRow
        label="Alignment"
        left={<AutoLayoutHorizontalAlignmentControl value={renderedAlign} onChange={value => { setAlign(value); onAlignChange?.(value); }} />}
        right={<AutoLayoutVerticalAlignmentControl value={renderedAlign} onChange={value => { setAlign(value); onAlignChange?.(value); }} />}
      />

      {/* Padding — cross layout. Combined (default): Vertical + Horizontal, two
          fields. Expanded (toggle): all four sides independently. */}
      <div className="px-[16px] pb-[4px]">
        <div className="flex items-center justify-between mb-[3px]">
          <span className={subLabel}>Padding</span>
        </div>
        {indivPadding ? (
          // Same reserved icon column as the combined state below (shrink-0, right
          // edge) — the field grid is flex-1 so it shrinks to leave that room,
          // instead of the icon getting bumped to its own row underneath. Top-
          // aligned (not centered) since the field block is two rows tall here.
          <div className="flex items-start gap-[4px]">
            <div className="grid grid-cols-2 gap-[4px] flex-1 min-w-0">
              <NumericInput iconLead={<span className={FONT}>↑</span>} value={controlled ? paddingTop : undefined} defaultValue={paddingTop} onChange={top => onPaddingChange?.({ top, right: paddingRight, bottom: paddingBottom, left: paddingLeft })} min={0} />
              <NumericInput iconLead={<span className={FONT}>→</span>} value={controlled ? paddingRight : undefined} defaultValue={paddingRight} onChange={right => onPaddingChange?.({ top: paddingTop, right, bottom: paddingBottom, left: paddingLeft })} min={0} />
              <NumericInput iconLead={<span className={FONT}>↓</span>} value={controlled ? paddingBottom : undefined} defaultValue={paddingBottom} onChange={bottom => onPaddingChange?.({ top: paddingTop, right: paddingRight, bottom, left: paddingLeft })} min={0} />
              <NumericInput iconLead={<span className={FONT}>←</span>} value={controlled ? paddingLeft : undefined} defaultValue={paddingLeft} onChange={left => onPaddingChange?.({ top: paddingTop, right: paddingRight, bottom: paddingBottom, left })} min={0} />
            </div>
            <PanelActionBtn
              icon={<Maximize size={16} strokeWidth={1.5} />}
              label="Combine padding"
              active
              onClick={() => setIndivPadding(false)}
            />
          </div>
        ) : (
          <div className="flex items-center gap-[4px]">
            <div className="flex-1 min-w-0">
              <NumericInput iconLead={<span className={FONT}>↕</span>} value={controlled ? paddingTop : undefined} defaultValue={paddingTop} onChange={vertical => onPaddingChange?.({ top: vertical, right: paddingRight, bottom: vertical, left: paddingLeft })} min={0} />
            </div>
            <div className="flex-1 min-w-0">
              <NumericInput iconLead={<span className={FONT}>↔</span>} value={controlled ? paddingLeft : undefined} defaultValue={paddingLeft} onChange={horizontal => onPaddingChange?.({ top: paddingTop, right: horizontal, bottom: paddingBottom, left: horizontal })} min={0} />
            </div>
            <PanelActionBtn
              icon={<Maximize size={16} strokeWidth={1.5} />}
              label="Independent padding"
              onClick={() => setIndivPadding(true)}
            />
          </div>
        )}
      </div>

      <DimensionSizingFields {...sizing} width={width} height={height} widthMode={widthMode} heightMode={heightMode} />

      {/* Clip content */}
      <PanelFullRow height={28}>
        <Checkbox checked={controlled ? clipContent : undefined} defaultChecked={clipContent} onChange={onClipContentChange} label="Clip content" />
      </PanelFullRow>
    </PanelSection>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────

interface AppearanceSectionProps {
  opacity?: number;
  blendMode?: BlendMode;
  cornerRadius?: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number };
  onOpacityChange?: (v: number) => void;
  onBlendModeChange?: (value: BlendMode) => void;
  onCornerRadiusChange?: (value: AppearanceSectionProps["cornerRadius"]) => void;
  blendControlled?: boolean;
  cornerControlled?: boolean;
}

function AppearanceSection({
  opacity = 100, blendMode = "Pass through", cornerRadius = 0, onOpacityChange, onBlendModeChange, onCornerRadiusChange, blendControlled = false, cornerControlled = false,
}: AppearanceSectionProps) {
  const subLabel = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary mb-[3px]");
  const [indivCorners, setIndivCorners] = useState(typeof cornerRadius === "object");
  const [blend, setBlend] = useState<BlendMode>(blendMode);
  const [internalCornerRadius, setInternalCornerRadius] = useState(cornerRadius);
  const renderedBlend = blendControlled ? blendMode : blend;
  const renderedCornerRadius = cornerControlled ? cornerRadius : internalCornerRadius;
  const corners = typeof renderedCornerRadius === "number" ? { topLeft: renderedCornerRadius, topRight: renderedCornerRadius, bottomLeft: renderedCornerRadius, bottomRight: renderedCornerRadius } : renderedCornerRadius;
  const setBlendValue = (value: BlendMode) => { if (!blendControlled) setBlend(value); onBlendModeChange?.(value); };
  const setCornerValue = (value: NonNullable<AppearanceSectionProps["cornerRadius"]>) => { if (!cornerControlled) setInternalCornerRadius(value); onCornerRadiusChange?.(value); };
  const cornerKeys = ["topLeft", "topRight", "bottomLeft", "bottomRight"] as const;
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
            trigger={<PanelActionBtn icon={<BlendDroplet size={16} />} label="Blend mode" active={renderedBlend !== "Pass through"} />}
          >
            {blendMenu(renderedBlend, setBlendValue)}
          </PopoverMenu>
        </>
      }
    >
      {/* Opacity + Corner radius — each labeled; reserved slot holds the independent-corners toggle */}
      <div className="flex items-end gap-[8px] pl-[16px] pr-[16px] pt-[3px]">
        <div className="flex-1 min-w-0">
          <div className={subLabel}>Opacity</div>
          <NumericInput ariaLabel="Opacity" value={opacity} onChange={onOpacityChange} min={0} max={100} suffix="%" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={subLabel}>Corner radius</div>
          <NumericInput ariaLabel="Corner radius" iconLead={<Maximize size={11} strokeWidth={1.5} />} value={corners.topLeft} onChange={setCornerValue} min={0} disabled={indivCorners} />
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
                  <NumericInput iconLead={<span className={clsx(FONT, "text-[11px]")}>{cornerGlyphs[i]}</span>} value={corners[cornerKeys[i]]} onChange={value => setCornerValue({ ...corners, [cornerKeys[i]]: value })} min={0} />
                </div>
              ))}
              <div className="shrink-0 min-w-[24px]" />
            </div>
          ))}
        </div>
      )}

      {/* Blend mode — only shown when not the default "Pass through"; leading droplet, opens the menu */}
      {renderedBlend !== "Pass through" && (
      <div className="pl-[16px] pr-[16px] pt-[6px] pb-[8px]">
        <div className={subLabel}>Blend mode</div>
        <div className="flex items-center gap-[8px]">
          <PopoverMenu className="flex-1 min-w-0" trigger={<Dropdown value={renderedBlend} fullWidth leadingIcon={<BlendDroplet size={16} />} />}>
            {blendMenu(renderedBlend, setBlendValue)}
          </PopoverMenu>
          <PanelActionBtn icon={<Minus size={16} strokeWidth={1.5} />} label="Remove blend mode" onClick={() => setBlendValue("Pass through")} />
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

function TypographySection({ value, onChange, stylesAvailable }: { value?: ElementTypographySettings; onChange?: (patch: Partial<ElementTypographySettings>) => void; stylesAvailable: boolean }) {
  const [internal, setInternal] = useState<ElementTypographySettings>({ fontFamily: "Inter", fontWeight: "Medium", fontSize: 11, lineHeight: 16, letterSpacing: 0, align: "left", verticalAlign: "top", styleName: "Title · 96/120" });
  const settings = value ?? internal;
  const update = (patch: Partial<ElementTypographySettings>) => { if (!value) setInternal(current => ({ ...current, ...patch })); onChange?.(patch); };
  const hasStyle = stylesAvailable && !!settings.styleName;
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
      rightActions={stylesAvailable ? (
        <PanelActionBtn icon={<StylesIcon />} label="Text styles" />
      ) : undefined}
    >
      {hasStyle ? (
        /* A text style is applied — only the style input + alignment row show */
        <div className="flex items-center gap-[8px] pl-[16px] pr-[16px] pt-[3px]">
          <div className="flex-1 min-w-0">
            <StyleInput chit="Ag" value={settings.styleName!} onClick={() => {}} />
          </div>
          <PanelActionBtn icon={<Unlink size={16} strokeWidth={1.5} />} label="Detach style" onClick={() => update({ styleName: undefined })} />
        </div>
      ) : (
        <>
          {/* Font family — dropdown + reserved right slot */}
          <div className="flex items-center gap-[8px] pl-[16px] pr-[16px] pt-[3px]">
            <div className="flex-1 min-w-0"><ChoiceDropdown value={settings.fontFamily} options={["Inter", "Whyte", "Roboto Mono"]} labels={{ Inter: "Inter", Whyte: "Whyte", "Roboto Mono": "Roboto Mono" }} onChange={fontFamily => update({ fontFamily })} /></div>
            <div className="shrink-0 min-w-[24px]" />
          </div>

          {/* Weight / Size — no labels (Figma); Size is a combo input */}
          <div className="flex items-center gap-[8px] pl-[16px] pr-[16px] pt-[3px]">
            <div className="flex-1 min-w-0"><ChoiceDropdown value={settings.fontWeight} options={["Regular", "Medium", "Semibold", "Bold"]} labels={{ Regular: "Regular", Medium: "Medium", Semibold: "Semibold", Bold: "Bold" }} onChange={fontWeight => update({ fontWeight })} /></div>
            <div className="flex-1 min-w-0"><ComboInput iconLead={<span className={FONT}>T</span>} value={String(settings.fontSize)} onInputChange={fontSize => update({ fontSize: Number(fontSize) })} /></div>
            <div className="shrink-0 min-w-[24px]" />
          </div>

          {/* Line height / Letter spacing — labeled */}
          <div className="flex items-end gap-[8px] pl-[16px] pr-[16px] pt-[6px]">
            <div className="flex-1 min-w-0">
              <div className={subLabel}>Line height</div>
              <NumericInput iconLead={<span className={FONT}>↕</span>} value={settings.lineHeight} onChange={lineHeight => update({ lineHeight })} min={0} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={subLabel}>Letter spacing</div>
              <NumericInput iconLead={<span className={FONT}>AV</span>} value={settings.letterSpacing} onChange={letterSpacing => update({ letterSpacing })} suffix="%" />
            </div>
            <div className="shrink-0 min-w-[24px]" />
          </div>
        </>
      )}

      {/* Alignment — always present, labeled */}
      <PanelFieldRow
        label="Alignment"
        left={<IconButtonRow buttons={textAlignBtns} value={settings.align} onChange={align => update({ align: align as ElementTypographySettings["align"] })} fill />}
        right={<IconButtonRow buttons={vAlignBtns} value={settings.verticalAlign} onChange={verticalAlign => update({ verticalAlign: verticalAlign as ElementTypographySettings["verticalAlign"] })} fill />}
        rightAction={<PanelActionBtn icon={<Settings2 size={16} strokeWidth={1.5} />} label="Type settings" />}
      />
    </PanelSection>
  );
}

// ─── Section: Fill ────────────────────────────────────────────────────────────

type FillEntry = ElementFillSetting;

function FillSection({ entries, onAdd, onUpdate, onToggle, onReorder, onRemove, capabilities }: {
  entries?: FillEntry[]; onAdd?: () => void; onUpdate?: (id: string, patch: Partial<Omit<FillEntry, "id">>) => void;
  onToggle?: (id: string, visible: boolean) => void; onReorder?: (id: string, targetId: string) => void; onRemove?: (id: string) => void;
  capabilities: Required<InspectorCapabilities>;
}) {
  const [internal, setInternal] = useState<FillEntry[]>([
    { id: "1", color: "#1e1e1e", opacity: 100, visible: true, label: "Black" },
  ]);
  const fills = entries ?? internal;
  const [colorOpen, setColorOpen] = useState(false);
  const [activeFill, setActiveFill] = useState<string | null>(null);

  const addFill = () => { if (!entries) setInternal(f => [...f, { id: String(Date.now()), color: "#ffffff", opacity: 100, visible: true }]); onAdd?.(); };
  const updateFill = (id: string, patch: Partial<Omit<FillEntry, "id">>) => { if (!entries) setInternal(f => f.map(x => x.id === id ? { ...x, ...patch } : x)); onUpdate?.(id, patch); };
  const removeFill = (id: string) => { if (!entries) setInternal(f => f.filter(x => x.id !== id)); onRemove?.(id); };
  const toggleFill = (id: string) => { const fill = fills.find(item => item.id === id); if (!fill) return; if (!entries) setInternal(items => items.map(item => item.id === id ? { ...item, visible: !item.visible } : item)); onToggle?.(id, !fill.visible); };

  return (
    <PanelSection
      title="Fill"
      muted={fills.length === 0}
      rightActions={
        <>
          {capabilities.styles && <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <PanelActionBtn icon={<StylesIcon />} label="Styles" />
          </span>}
          <PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add fill" onClick={addFill} />
        </>
      }
    >
      {/* Entry = base ColorInput + eye + minus icon buttons on the right (matches ours) */}
      {fills.map(fill => (
        <div key={fill.id} draggable={!!onReorder} onDragStart={event => event.dataTransfer.setData("text/plain", fill.id)} onDragOver={event => onReorder && event.preventDefault()} onDrop={event => { event.preventDefault(); onReorder?.(event.dataTransfer.getData("text/plain"), fill.id); }} className="group/row flex items-center pr-[16px] h-[32px]">
          <DragGutter />
          <div className="flex-1 min-w-0">
            <ColorInput
              fullWidth
              color={fill.color}
              opacity={fill.opacity}
              onColorChange={color => updateFill(fill.id, { color })}
              onOpacityChange={opacity => updateFill(fill.id, { opacity })}
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
        capabilities={capabilities}
        open={colorOpen}
        onClose={() => setColorOpen(false)}
        hex={fills.find(f => f.id === activeFill)?.color.replace("#", "") ?? "1e1e1e"}
        onHexChange={color => activeFill && updateFill(activeFill, { color: `#${color.replace(/^#/, "")}` })}
      />
    </PanelSection>
  );
}

// ─── Section: Stroke ──────────────────────────────────────────────────────────

function StrokeSection({ entries, onAdd, onUpdate, onToggle, onReorder, onRemove, capabilities }: {
  entries?: ElementStrokeSetting[]; onAdd?: () => void; onUpdate?: (id: string, patch: Partial<Omit<ElementStrokeSetting, "id">>) => void;
  onToggle?: (id: string, visible: boolean) => void; onReorder?: (id: string, targetId: string) => void; onRemove?: (id: string) => void;
  capabilities: Required<InspectorCapabilities>;
}) {
  const [internal, setInternal] = useState<ElementStrokeSetting[]>([]);
  const strokes = entries ?? internal;
  const [colorOpen, setColorOpen] = useState(false);
  const [activeStroke, setActiveStroke] = useState<string | null>(null);
  const update = (id: string, patch: Partial<Omit<ElementStrokeSetting, "id">>) => { if (!entries) setInternal(s => s.map(x => x.id === id ? { ...x, ...patch } : x)); onUpdate?.(id, patch); };
  const add = () => { if (!entries) setInternal(s => [...s, { id: String(Date.now()), color: "#000000", opacity: 100, visible: true, weight: 1, align: "center" }]); onAdd?.(); };
  const remove = (id: string) => { if (!entries) setInternal(s => s.filter(x => x.id !== id)); onRemove?.(id); };
  const toggle = (id: string) => { const stroke = strokes.find(item => item.id === id); if (!stroke) return; if (!entries) setInternal(items => items.map(item => item.id === id ? { ...item, visible: !item.visible } : item)); onToggle?.(id, !stroke.visible); };
  const subLabel = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary mb-[3px]");

  return (
    <PanelSection
      title="Stroke"
      muted={strokes.length === 0}
      rightActions={
        <>
          {capabilities.styles && <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <PanelActionBtn icon={<StylesIcon />} label="Styles" />
          </span>}
          <PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add stroke" onClick={add} />
        </>
      }
    >
      {strokes.map(stroke => (
        <div key={stroke.id} draggable={!!onReorder} onDragStart={event => event.dataTransfer.setData("text/plain", stroke.id)} onDragOver={event => onReorder && event.preventDefault()} onDrop={event => { event.preventDefault(); onReorder?.(event.dataTransfer.getData("text/plain"), stroke.id); }} className="pb-[2px]">
          {/* Row 1 — color + eye + minus (same as Fill) */}
          <div className="group/row flex items-center pr-[16px] h-[32px]">
            <DragGutter />
            <div className="flex-1 min-w-0">
              <ColorInput
                fullWidth
                color={stroke.color}
                opacity={stroke.opacity}
                onColorChange={color => update(stroke.id, { color })}
                onOpacityChange={opacity => update(stroke.id, { opacity })}
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
              <ChoiceDropdown value={stroke.align} options={["inside", "center", "outside"]} labels={{ inside: "Inside", center: "Center", outside: "Outside" }} onChange={align => update(stroke.id, { align })} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={subLabel}>Weight</div>
              <NumericInput iconLead={<AlignJustify size={16} strokeWidth={1.5} />} value={stroke.weight} onChange={weight => update(stroke.id, { weight })} min={0} />
            </div>
            <PanelActionBtn icon={<SlidersHorizontal size={16} strokeWidth={1.5} />} label="Stroke settings" />
            <PanelActionBtn icon={<Square size={16} strokeWidth={1.5} />} label="Individual sides" />
          </div>
        </div>
      ))}

      <ColorDialog
        capabilities={capabilities}
        open={colorOpen}
        onClose={() => setColorOpen(false)}
        hex={strokes.find(s => s.id === activeStroke)?.color.replace("#", "") ?? "000000"}
        onHexChange={color => activeStroke && update(activeStroke, { color: `#${color.replace(/^#/, "")}` })}
      />
    </PanelSection>
  );
}

// ─── Section: Effects ─────────────────────────────────────────────────────────

function EffectsSection({ entries, onAdd, onUpdate, onToggle, onReorder, onRemove, capabilities }: {
  entries?: ElementEffectSetting[]; onAdd?: () => void; onUpdate?: (id: string, patch: Partial<Omit<ElementEffectSetting, "id">>) => void;
  onToggle?: (id: string, visible: boolean) => void; onReorder?: (id: string, targetId: string) => void; onRemove?: (id: string) => void;
  capabilities: Required<InspectorCapabilities>;
}) {
  const [internal, setInternal] = useState<ElementEffectSetting[]>([]);
  const effects = entries ?? internal;
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  const update = (id: string, patch: Partial<Omit<ElementEffectSetting, "id">>) => { if (!entries) setInternal(e => e.map(x => x.id === id ? { ...x, ...patch } : x)); onUpdate?.(id, patch); };
  const add = () => { if (!entries) setInternal(e => [...e, { id: String(Date.now()), type: "Drop shadow", visible: true }]); onAdd?.(); };
  const remove = (id: string) => { if (!entries) setInternal(e => e.filter(x => x.id !== id)); onRemove?.(id); };
  const toggle = (id: string) => { const effect = effects.find(item => item.id === id); if (!effect) return; if (!entries) setInternal(items => items.map(item => item.id === id ? { ...item, visible: !item.visible } : item)); onToggle?.(id, !effect.visible); };

  return (
    <PanelSection
      title="Effects"
      muted={effects.length === 0}
      rightActions={
        <>
          {capabilities.styles && <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <PanelActionBtn icon={<StylesIcon />} label="Styles" />
          </span>}
          <PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add effect" onClick={add} />
        </>
      }
    >
      {effects.map(effect => (
        <div key={effect.id} draggable={!!onReorder} onDragStart={event => event.dataTransfer.setData("text/plain", effect.id)} onDragOver={event => onReorder && event.preventDefault()} onDrop={event => { event.preventDefault(); onReorder?.(event.dataTransfer.getData("text/plain"), effect.id); }} className="group/row flex items-center pr-[16px] h-[32px]">
          <DragGutter />
          <PanelActionBtn icon={effect.visible ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />} label={effect.visible ? "Hide" : "Show"} onClick={() => toggle(effect.id)} />
          <div className="flex-1 min-w-0">
            <EffectDetailsDialog open={activeEffect === effect.id} value={effect}
              trigger={<Dropdown value={effect.type} fullWidth onClick={() => setActiveEffect(effect.id)} />}
              capabilities={capabilities}
              onChange={patch => update(effect.id, patch)} onClose={() => setActiveEffect(null)} />
          </div>
          <div className="shrink-0 flex items-center gap-[4px] pl-[8px]">
            <PanelActionBtn icon={<Minus size={16} strokeWidth={1.5} />} label="Remove effect" onClick={() => remove(effect.id)} />
          </div>
        </div>
      ))}
    </PanelSection>
  );
}

// ─── Section: Export ──────────────────────────────────────────────────────────

function ExportSection({ settings, targetName = "selection", onAdd, onRemove, onUpdate, onExport }: {
  settings?: InspectorExportSetting[];
  targetName?: string;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  onUpdate?: (id: string, patch: Partial<Omit<InspectorExportSetting, "id">>) => void;
  onExport?: () => void;
}) {
  const [internal, setInternal] = useState<InspectorExportSetting[]>([]);
  const exports = settings ?? internal;
  const add = () => {
    if (settings === undefined) setInternal(current => [...current, { id: String(Date.now()), scale: 1, suffix: "", format: "PNG" }]);
    onAdd?.();
  };
  const remove = (id: string) => {
    if (settings === undefined) setInternal(current => current.filter(item => item.id !== id));
    onRemove?.(id);
  };
  const update = (id: string, patch: Partial<Omit<InspectorExportSetting, "id">>) => {
    if (settings === undefined) setInternal(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
    onUpdate?.(id, patch);
  };

  return (
    <PanelSection
      title="Export"
      muted={exports.length === 0}
      rightActions={<PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add export" onClick={add} />}
    >
      {exports.map(exp => (
        <div key={exp.id} className="group/row flex items-center h-[32px] pr-[16px]">
          <DragGutter />
          <div className="flex-1 min-w-0 flex items-center gap-[4px]">
            <div className="w-[54px] shrink-0"><NumericInput value={exp.scale} min={0.01} step={0.25} suffix="×" onChange={scale => update(exp.id, { scale })} /></div>
            <div className="flex-1 min-w-0"><InputField value={exp.suffix} placeholder="Suffix" onChange={suffix => update(exp.id, { suffix })} /></div>
            <div className="w-[64px] shrink-0"><ChoiceDropdown value={exp.format} options={["PNG", "JPG"]} labels={{ PNG: "PNG", JPG: "JPG" }} onChange={format => update(exp.id, { format })} /></div>
          </div>
          <div className="shrink-0 flex items-center gap-[4px] pl-[8px]">
            <PanelActionBtn icon={<Minus size={16} strokeWidth={1.5} />} label="Remove export" onClick={() => remove(exp.id)} />
          </div>
        </div>
      ))}
      {exports.length > 0 && <PanelFullRow height={40}>
        <Button label={`Export ${targetName}`} variant="Secondary" size="wide" onClick={onExport} />
      </PanelFullRow>}
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

// ─── Section: Layout Guide ────────────────────────────────────────────────────
// Composition-owned editor chrome. Stackable: Grid / Columns / Rows guides.
function LayoutGuideSection({ entries, onAdd, onUpdate, onRemove }: {
  entries?: ElementLayoutGuideSetting[]; onAdd?: () => void;
  onUpdate?: (id: string, patch: Partial<Omit<ElementLayoutGuideSetting, "id">>) => void; onRemove?: (id: string) => void;
}) {
  const [internal, setInternal] = useState<ElementLayoutGuideSetting[]>([]);
  const guides = entries ?? internal;
  const update = (id: string, patch: Partial<Omit<ElementLayoutGuideSetting, "id">>) => { if (!entries) setInternal(g => g.map(x => x.id === id ? { ...x, ...patch } : x)); onUpdate?.(id, patch); };
  const add = () => { if (!entries) setInternal(g => [...g, { id: String(Date.now()), type: "Grid", visible: true, size: 8 }]); onAdd?.(); };
  const remove = (id: string) => { if (!entries) setInternal(g => g.filter(x => x.id !== id)); onRemove?.(id); };
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
            <ChoiceDropdown value={g.type} options={["Grid", "Columns", "Rows"]} labels={{ Grid: "Grid", Columns: "Columns", Rows: "Rows" }} onChange={type => update(g.id, { type })} />
            <NumericInput iconLead={<Grid3x3 size={16} strokeWidth={1.5} />} value={g.size} onChange={size => update(g.id, { size })} min={1} />
          </div>
          <div className="shrink-0 flex items-center gap-[4px] pl-[8px]">
            <PanelActionBtn icon={g.visible ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />} label={g.visible ? "Hide" : "Show"} onClick={() => update(g.id, { visible: !g.visible })} />
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
const DEMO_SELECTION_COLORS: ElementSelectionColorSetting[] = [
  { id: "demo-selection-1", color: "#1E1E1E", opacity: 100 },
  { id: "demo-selection-2", color: "#0D99FF", opacity: 100 },
  { id: "demo-selection-3", color: "#FFFFFF", opacity: 100 },
  { id: "demo-selection-4", color: "#14AE5C", opacity: 100 },
  { id: "demo-selection-5", color: "#FFCD29", opacity: 100 },
  { id: "demo-selection-6", color: "#9747FF", opacity: 100 },
];

function SelectionColorsSection({ colors, onUpdate, onSelectAll, capabilities = { templates: true, styles: true, variables: true, libraries: true } }: {
  colors?: ElementSelectionColorSetting[];
  onUpdate?: (id: string, patch: Partial<Omit<ElementSelectionColorSetting, "id">>) => void;
  onSelectAll?: (id: string) => void;
  capabilities?: Required<InspectorCapabilities>;
}) {
  const renderedColors = colors ?? DEMO_SELECTION_COLORS;
  const [colorOpen, setColorOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = renderedColors.find(color => color.id === activeId);
  if (renderedColors.length === 0) return null;
  return (
    <PanelSection title="Selection colors">
      {renderedColors.map(c => (
        <div key={c.id} className="group/row flex items-center px-[16px] h-[32px] gap-[8px]">
          <div className="flex-1 min-w-0">
            <ColorInput fullWidth color={c.color} opacity={c.opacity} onSwatchClick={() => { setActiveId(c.id); setColorOpen(true); }} />
          </div>
          {/* Reserved slot; actions reveal on this row's hover — no reflow (§5.8) */}
          <div className="shrink-0 flex items-center gap-[4px] opacity-0 group-hover/row:opacity-100 transition-opacity duration-100">
            {capabilities.styles && <PanelActionBtn icon={<StylesIcon />} label="Apply color style" />}
            <PanelActionBtn icon={<Crosshair size={16} strokeWidth={1.5} />} label={c.usageCount ? `Select all ${c.usageCount} using this color` : "Select all using this color"} onClick={() => onSelectAll?.(c.id)} />
          </div>
        </div>
      ))}

      <ColorDialog key={active?.id ?? "selection-color"} capabilities={capabilities} open={colorOpen} onClose={() => setColorOpen(false)} hex={(active?.color ?? "#1e1e1e").replace(/^#/, "")} opacity={active?.opacity ?? 100}
        onHexChange={hex => active && onUpdate?.(active.id, { color: `#${hex.replace(/^#/, "")}` })}
        onOpacityChange={opacity => active && onUpdate?.(active.id, { opacity })} />
    </PanelSection>
  );
}

// ─── Project mode sections (inspector-project-mode.md) ───────────────────────
// Active when nothing is selected. Header label "Project"; body = Canvas,
// Master timeline, Export (stub).

// Canvas §Canvas — Aspect ratio (segmented, Custom trailing), Dimensions W|H (px),
// Frame rate (dropdown). Presets are presentational here; Custom just unlocks the
// segmented state visually.
function CanvasSection({
  width = 1920,
  height = 1080,
  frameRate = 30,
  onWidthChange,
  onHeightChange,
  onFrameRateChange,
  widthControlled = false, heightControlled = false, frameRateControlled = false,
}: {
  width?: number;
  height?: number;
  frameRate?: ProjectFrameRate;
  onWidthChange?: (value: number) => void;
  onHeightChange?: (value: number) => void;
  onFrameRateChange?: (value: ProjectFrameRate) => void;
  widthControlled?: boolean; heightControlled?: boolean; frameRateControlled?: boolean;
}) {
  const [aspect, setAspect] = useState("16:9");
  const [internalWidth, setInternalWidth] = useState(width);
  const [internalHeight, setInternalHeight] = useState(height);
  const [internalFrameRate, setInternalFrameRate] = useState<ProjectFrameRate>(frameRate);
  const renderedWidth = widthControlled ? width : internalWidth;
  const renderedHeight = heightControlled ? height : internalHeight;
  const renderedFrameRate = frameRateControlled ? frameRate : internalFrameRate;
  const aspectOptions = ["16:9", "9:16", "1:1", "4:3", "Custom"];
  return (
    <PanelSection title="Canvas">
      {/* Aspect ratio — dropdown (full width) */}
      <PanelFieldRow
        label="Aspect ratio"
        reserveRightSlot={false}
        left={
          <PopoverMenu align="right" trigger={<Dropdown value={aspect} fullWidth />}>
            {(close) => (
              <Menu minWidth={140}>
                {aspectOptions.map((o) => (
                  <MenuRow key={o} type="simple" label={o} onClick={() => { setAspect(o); close(); }} />
                ))}
              </Menu>
            )}
          </PopoverMenu>
        }
      />

      {/* Dimensions — W | H numeric (px) */}
      <PanelFieldRow
        label="Dimensions"
        reserveRightSlot={false}
        left={
          <NumericInput
            iconLead={<span className={FONT}>W</span>}
            value={renderedWidth}
            onChange={value => { if (!widthControlled) setInternalWidth(value); onWidthChange?.(value); }}
            min={1}
            suffix="px"
          />
        }
        right={
          <NumericInput
            iconLead={<span className={FONT}>H</span>}
            value={renderedHeight}
            onChange={value => { if (!heightControlled) setInternalHeight(value); onHeightChange?.(value); }}
            min={1}
            suffix="px"
          />
        }
      />

      {/* Frame rate — dropdown (full width) */}
      <PanelFieldRow
        label="Frame rate"
        reserveRightSlot={false}
        left={<ChoiceDropdown value={String(renderedFrameRate)} options={["24", "25", "30", "60"]} labels={{ "24": "24 fps", "25": "25 fps", "30": "30 fps", "60": "60 fps" }} onChange={value => { const next = Number(value) as ProjectFrameRate; if (!frameRateControlled) setInternalFrameRate(next); onFrameRateChange?.(next); }} />}
      />
    </PanelSection>
  );
}

// Master timeline §Master timeline — Total duration (s), Playhead (s).
function MasterTimelineSection({
  totalDuration = 30,
  playhead = 0,
  onTotalDurationChange,
  onPlayheadChange,
  durationControlled = false, playheadControlled = false,
}: {
  totalDuration?: number;
  playhead?: number;
  onTotalDurationChange?: (value: number) => void;
  onPlayheadChange?: (value: number) => void;
  durationControlled?: boolean; playheadControlled?: boolean;
}) {
  const [internalDuration, setInternalDuration] = useState(totalDuration);
  const [internalPlayhead, setInternalPlayhead] = useState(playhead);
  const renderedDuration = durationControlled ? totalDuration : internalDuration;
  const renderedPlayhead = playheadControlled ? playhead : internalPlayhead;
  return (
    <PanelSection title="Master timeline">
      <DualField
        leftLabel="Total duration"
        left={
          <NumericInput
            iconLead={<span className={FONT}>T</span>}
            value={renderedDuration}
            onChange={value => { if (!durationControlled) setInternalDuration(value); onTotalDurationChange?.(value); }}
            min={0}
            suffix="s"
          />
        }
        rightLabel="Playhead"
        right={
          <NumericInput
            iconLead={<span className={FONT}>▸</span>}
            value={renderedPlayhead}
            onChange={value => { if (!playheadControlled) setInternalPlayhead(value); onPlayheadChange?.(value); }}
            min={0}
            suffix="s"
          />
        }
      />
    </PanelSection>
  );
}

// Export §Export — project-level video export. Disabled stub in V1: Format dropdown
// (disabled) + full-width outlined "Export project" action (disabled).
function ProjectExportSection() {
  return (
    <PanelSection title="Export">
      <PanelFieldRow
        label="Format"
        reserveRightSlot={false}
        left={<Tooltip label="Video export coming soon" direction="Left" delayDuration={500}><span className="block w-full" tabIndex={0} aria-label="Project video format unavailable: Video export coming soon"><Dropdown ariaLabel="Project video format" value="MP4" fullWidth disabled /></span></Tooltip>}
      />
      <PanelFullRow height={40}>
        <Tooltip label="Video export coming soon" direction="Left" delayDuration={500}><span className="block w-full" tabIndex={0} aria-label="Export project unavailable: Video export coming soon"><Button label="Export project" variant="Secondary" size="wide" disabled /></span></Tooltip>
      </PanelFullRow>
    </PanelSection>
  );
}

// ─── Slide mode sections (inspector-slide-mode.md) ───────────────────────────
// Active when a slide is selected. Header = slide-name text field + options
// IconButton; body = Timing, Background, Selection colors.

// Timing §Timing / Video Clip §Timeline — Range Start|End (s), Duration (s,
// derived End − Start). Both specs use the identical Range+Duration pattern, so
// this one section covers both (title differs: "Timing" for Slide mode,
// "Timeline" for Video Clip mode).
function SlideTimingSection({
  title = "Timing",
  landmark = false,
  start = 0,
  end = 5,
  onStartChange,
  onEndChange,
  onDurationChange,
  controlled = false,
}: {
  title?: string;
  landmark?: boolean;
  start?: number;
  end?: number;
  onStartChange?: (value: number) => void;
  onEndChange?: (value: number) => void;
  onDurationChange?: (value: number) => void;
  controlled?: boolean;
}) {
  const [internalStart, setInternalStart] = useState(start);
  const [internalEnd, setInternalEnd] = useState(end);
  const renderedStart = controlled ? start : internalStart;
  const renderedEnd = controlled ? end : internalEnd;
  return (
    <PanelSection title={title} landmark={landmark}>
      <PanelFieldRow
        label="Range"
        reserveRightSlot={false}
        left={
          <NumericInput
            ariaLabel="Start"
            iconLead={<span className={clsx(FONT, "text-[10px]")}>Start</span>}
            value={renderedStart}
            onChange={value => { if (!controlled) setInternalStart(value); onStartChange?.(value); }}
            min={0}
            suffix="s"
          />
        }
        right={
          <NumericInput
            ariaLabel="End"
            iconLead={<span className={clsx(FONT, "text-[10px]")}>End</span>}
            value={renderedEnd}
            onChange={value => { if (!controlled) setInternalEnd(value); onEndChange?.(value); }}
            min={0}
            suffix="s"
          />
        }
      />
      <PanelFieldRow
        label="Duration"
        reserveRightSlot={false}
        left={
          <NumericInput
            ariaLabel="Duration"
            iconLead={<span className={FONT}>↔</span>}
            value={Math.max(0, renderedEnd - renderedStart)}
            onChange={value => { if (!controlled) setInternalEnd(renderedStart + value); onDurationChange?.(value); }}
            min={0}
            suffix="s"
          />
        }
      />
    </PanelSection>
  );
}

// Fill-type glyphs — ported from ColorDialog's toolbar tabs (same house
// iconography: solid = filled square, gradient = a diagonal css-gradient swatch,
// image/video = the matching lucide icon), so Slide-mode's Background reads
// consistent with the Fill/Color dialog rather than text-labeled segments.
function SlideFillTypeIcon({ type }: { type: "solid" | "gradient" | "image" | "video" }) {
  if (type === "solid") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <rect x="1" y="1" width="10" height="10" rx="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (type === "gradient") {
    return (
      <div className="size-[12px] rounded-[1.5px] overflow-hidden">
        <div className="size-full" style={{ background: "linear-gradient(to right, currentColor, transparent)" }} />
      </div>
    );
  }
  if (type === "image") return <ImageIcon size={12} strokeWidth={1.5} />;
  return <Video size={12} strokeWidth={1.5} />;
}

// Template style §Template style — a dropdown-shaped trigger (3-colour preview
// swatch + template name/fonts + chevron) that opens the template picker.
// Ported from the Figma-referenced SlideInspector.tsx, onto light c-* tokens.
function TemplateStyleSection({ name = "Radicle", fonts = "Whyte Inktrap, Inter" }: { name?: string; fonts?: string }) {
  return (
    <PanelSection
      title="Slide template"
      rightActions={
        <PanelActionBtn icon={<Settings2 size={16} strokeWidth={1.5} />} label="Template settings" />
      }
    >
      <div className="px-[16px] pb-[8px]">
        <button className="w-full h-[48px] rounded-c-md border border-c-border flex items-center pl-[7px] pr-[3px] gap-[8px] hover:bg-c-bg-hover">
          {/* 3-colour preview swatch */}
          <span className="size-[32px] rounded-[2.667px] border border-c-border overflow-hidden relative bg-white shrink-0">
            <span className="absolute inset-y-0 left-0 w-[10.67px] bg-[#e95000]" />
            <span className="absolute inset-y-0 left-[10.67px] w-[10.67px] bg-[#ffcd00]" />
            <span className="absolute inset-y-0 left-[21.33px] w-[10.67px] bg-[#100f10]" />
          </span>
          <span className="flex flex-col gap-[2px] items-start min-w-0 flex-1">
            <span className={clsx(FONT, "text-[11px] font-[550] text-c-text leading-[16px]")}>{name}</span>
            <span className={clsx(FONT, "text-[11px] text-c-text-secondary leading-[16px] truncate w-full text-left")}>{fonts}</span>
          </span>
          <ChevronDown size={16} strokeWidth={1.5} className="text-c-icon shrink-0" />
        </button>
      </div>
    </PanelSection>
  );
}

// Background §Background — fill-type segmented (Solid · Gradient · Image · Video)
// switching the control below. Solid shows a compact ColorInput swatch trigger.
function SlideBackgroundSection({
  type: controlledType,
  color: controlledColor,
  opacity: controlledOpacity,
  onTypeChange,
  onColorChange,
  onOpacityChange,
  capabilities,
}: {
  type?: SlideBackgroundType;
  color?: string;
  opacity?: number;
  onTypeChange?: (value: SlideBackgroundType) => void;
  onColorChange?: (value: string) => void;
  onOpacityChange?: (value: number) => void;
  capabilities: Required<InspectorCapabilities>;
}) {
  const [internalType, setInternalType] = useState<SlideBackgroundType>("solid");
  const [internalColor, setInternalColor] = useState("#1e1e1e");
  const [internalOpacity, setInternalOpacity] = useState(100);
  const fillType = controlledType ?? internalType;
  const color = controlledColor ?? internalColor;
  const opacity = controlledOpacity ?? internalOpacity;
  const [colorOpen, setColorOpen] = useState(false);
  const fillSegments = [
    { value: "solid", icon: <SlideFillTypeIcon type="solid" /> },
    { value: "gradient", icon: <SlideFillTypeIcon type="gradient" /> },
    { value: "image", icon: <SlideFillTypeIcon type="image" /> },
    { value: "video", icon: <SlideFillTypeIcon type="video" /> },
  ];
  return (
    <PanelSection title="Background">
      {/* Fill type — icon-only segmented, matching the Figma reference / ColorDialog's
          fill-type tabs (not text-labeled) */}
      <PanelFieldRow
        label="Fill type"
        reserveRightSlot={false}
        left={
          <SegmentedControl
            segments={fillSegments}
            value={fillType}
            onChange={value => {
              const next = value as SlideBackgroundType;
              if (controlledType === undefined) setInternalType(next);
              onTypeChange?.(next);
            }}
            className="w-full"
          />
        }
      />

      {/* Control below switches on the selected fill type */}
      {fillType === "solid" && (
        <div className="flex items-center px-[16px] h-[32px]">
          <div className="flex-1 min-w-0">
            <ColorInput
              fullWidth
              color={color}
              opacity={opacity}
              onSwatchClick={() => setColorOpen(true)}
              onColorChange={value => {
                if (controlledColor === undefined) setInternalColor(value);
                onColorChange?.(value);
              }}
              onOpacityChange={value => {
                if (controlledOpacity === undefined) setInternalOpacity(value);
                onOpacityChange?.(value);
              }}
            />
          </div>
        </div>
      )}
      {fillType === "gradient" && (
        <div className="flex items-center px-[16px] h-[32px]">
          <div className="flex-1 min-w-0">
            <ColorInput
              fullWidth
              fillType="Gradient"
              fillLabel="Linear gradient"
              onSwatchClick={() => setColorOpen(true)}
            />
          </div>
        </div>
      )}
      {(fillType === "image" || fillType === "video") && (
        <div className="flex items-center px-[16px] h-[32px]">
          <div className="flex-1 min-w-0">
            {/* Same ColorInput row as Solid/Gradient — only the chit + label change */}
            <ColorInput
              fullWidth
              fillType="Image"
              fillLabel={fillType === "video" ? "clip.mp4" : "cover.png"}
              onSwatchClick={() => setColorOpen(true)}
            />
          </div>
        </div>
      )}

      <ColorDialog
        capabilities={capabilities}
        open={colorOpen}
        onClose={() => setColorOpen(false)}
        fillType={fillType === "gradient" ? "linear" : fillType === "image" || fillType === "video" ? "image" : "solid"}
        hex={color.replace(/^#/, "")}
        opacity={opacity}
        onHexChange={value => {
          const next = `#${value.replace(/^#/, "")}`;
          if (controlledColor === undefined) setInternalColor(next);
          onColorChange?.(next);
        }}
        onOpacityChange={value => {
          if (controlledOpacity === undefined) setInternalOpacity(value);
          onOpacityChange?.(value);
        }}
      />
    </PanelSection>
  );
}

function ChoiceDropdown<T extends string>({ ariaLabel, value, options, labels, onChange }: {
  ariaLabel?: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange?: (value: T) => void;
}) {
  return (
    <PopoverMenu directTrigger align="right" className="w-full" trigger={<Dropdown aria-haspopup="menu" ariaLabel={ariaLabel ? `${ariaLabel}: ${labels[value]}` : undefined} value={labels[value]} fullWidth />}>
      {close => <Menu minWidth={160}>{options.map(option => (
        <MenuRow key={option} type="checkmark" checked={option === value} label={labels[option]} onClick={() => { onChange?.(option); close(); }} />
      ))}</Menu>}
    </PopoverMenu>
  );
}

// ─── Video Clip mode sections ─────────────────────────────────────────────────
// video-clip-inspector-mode.md — shown when a base-video clip block is selected
// in the master timeline (a distinct inspector mode, not a slide). Sections:
// Source (read-only) · Timeline (shared with Slide's Timing, see above) · Trim ·
// Playback. No dialogs; no Background/Fill/Selection-colors (clips aren't slides).

// Source §Source — read-only metadata about the source video file.
function ClipSourceSection({
  file = "hero-cover.mp4",
  resolution = "1920 × 1080",
  sourceDuration = "1:24.00",
}: {
  file?: string;
  resolution?: string;
  sourceDuration?: string;
}) {
  const row = (label: string, value: string) => (
    <PanelFullRow label={label} height={24}>
      <span className={clsx(FONT, "text-[11px] text-c-text-secondary truncate block")} title={value}>{value}</span>
    </PanelFullRow>
  );
  return (
    <PanelSection title="Source" landmark>
      {row("File", file)}
      {row("Resolution", resolution)}
      {row("Source duration", sourceDuration)}
    </PanelSection>
  );
}

// Trim §Trim — which portion of the source plays within the clip block.
// Clipped duration is derived (trimOut − trimIn) and read-only.
function ClipTrimSection({
  trimIn = 0,
  trimOut = 8,
  onTrimInChange,
  onTrimOutChange,
  controlled = false,
}: {
  trimIn?: number;
  trimOut?: number;
  onTrimInChange?: (value: number) => void;
  onTrimOutChange?: (value: number) => void;
  controlled?: boolean;
}) {
  const [internalTrimIn, setInternalTrimIn] = useState(trimIn);
  const [internalTrimOut, setInternalTrimOut] = useState(trimOut);
  const renderedTrimIn = controlled ? trimIn : internalTrimIn;
  const renderedTrimOut = controlled ? trimOut : internalTrimOut;
  return (
    <PanelSection title="Trim" landmark>
      <DualField
        leftLabel="Trim in"
        left={<NumericInput ariaLabel="Trim in" iconLead={<Crosshair size={16} strokeWidth={1.5} />} value={renderedTrimIn} onChange={value => { if (!controlled) setInternalTrimIn(value); onTrimInChange?.(value); }} min={0} suffix="s" />}
        rightLabel="Trim out"
        right={<NumericInput ariaLabel="Trim out" iconLead={<Crosshair size={16} strokeWidth={1.5} />} value={renderedTrimOut} onChange={value => { if (!controlled) setInternalTrimOut(value); onTrimOutChange?.(value); }} min={0} suffix="s" />}
      />
      <PanelFullRow label="Clipped duration" height={24}>
        <span className={clsx(FONT, "text-[11px] text-c-text-secondary")}>{Math.max(0, renderedTrimOut - renderedTrimIn)}s</span>
      </PanelFullRow>
    </PanelSection>
  );
}

// Playback §Playback — Speed dropdown (default 1x); Volume deferred to V2
// (disabled row, "Audio coming soon" per spec).
const CLIP_SPEEDS: ClipSpeed[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];
const CLIP_SPEED_LABELS = Object.fromEntries(CLIP_SPEEDS.map(speed => [String(speed), `${speed}×`])) as Record<string, string>;

function ClipPlaybackSection({ speed = 1, onSpeedChange, controlled = false }: { speed?: ClipSpeed; onSpeedChange?: (value: ClipSpeed) => void; controlled?: boolean }) {
  const [internalSpeed, setInternalSpeed] = useState<ClipSpeed>(speed);
  const renderedSpeed = controlled ? speed : internalSpeed;
  return (
    <PanelSection title="Playback" landmark>
      <DualField
        leftLabel="Speed"
        left={<ChoiceDropdown ariaLabel="Speed" value={String(renderedSpeed)} options={CLIP_SPEEDS.map(String)} labels={CLIP_SPEED_LABELS} onChange={value => { const next = Number(value) as ClipSpeed; if (!controlled) setInternalSpeed(next); onSpeedChange?.(next); }} />}
        rightLabel="Volume"
        right={
          <div className="w-full" title="Audio coming soon">
            <Dropdown ariaLabel="Volume" value="—" disabled fullWidth />
          </div>
        }
      />
    </PanelSection>
  );
}

// ─── PropertyPanel ────────────────────────────────────────────────────────────

export interface PropertyPanelProps {
  /** Host-owned feature availability; UI only hides unsupported entry points. */
  capabilities?: InspectorCapabilities;
  /** Inspector mode. Defaults to "element" — the current selection inspector. */
  mode?: PanelMode;
  elementType?: ElementType;
  multiSelect?: boolean;
  x?: number; y?: number; rotation?: number;
  onXChange?: (value: number) => void;
  onYChange?: (value: number) => void;
  onRotationChange?: (value: number) => void;
  /** Host-owned history boundary shared by every nested NumericInput. */
  onNumericEditStart?: () => void;
  onNumericEditCommit?: () => void;
  onNumericEditCancel?: () => void;
  width?: number; height?: number;
  onWidthChange?: (value: number) => void;
  onHeightChange?: (value: number) => void;
  opacity?: number;
  onOpacityChange?: (value: number) => void;
  blendMode?: BlendMode;
  cornerRadius?: AppearanceSectionProps["cornerRadius"];
  onBlendModeChange?: (value: BlendMode) => void;
  onCornerRadiusChange?: AppearanceSectionProps["onCornerRadiusChange"];
  layout?: ElementLayoutSettings;
  onLayoutChange?: (patch: Partial<ElementLayoutSettings>) => void;
  /** Preferred atomic sizing seam. Numeric edits from Hug/Fill emit Fixed + value together. */
  onSizingChange?: (axis: ElementSizingAxis, change: ElementSizingChange) => void;
  onSizingConstraintChange?: (axis: ElementSizingAxis, constraint: ElementSizingConstraint, value: number | undefined) => void;
  onApplySizingVariable?: (axis: ElementSizingAxis) => void;
  /** Opens the one shared Auto Layout Settings surface from the Flow + Gap row. */
  onAutoLayoutSettingsRequest?: () => void;
  typography?: ElementTypographySettings;
  onTypographyChange?: (patch: Partial<ElementTypographySettings>) => void;
  fills?: ElementFillSetting[];
  onAddFill?: () => void; onUpdateFill?: (id: string, patch: Partial<Omit<ElementFillSetting, "id">>) => void; onToggleFill?: (id: string, visible: boolean) => void; onReorderFill?: (id: string, targetId: string) => void; onRemoveFill?: (id: string) => void;
  strokes?: ElementStrokeSetting[];
  onAddStroke?: () => void; onUpdateStroke?: (id: string, patch: Partial<Omit<ElementStrokeSetting, "id">>) => void; onToggleStroke?: (id: string, visible: boolean) => void; onReorderStroke?: (id: string, targetId: string) => void; onRemoveStroke?: (id: string) => void;
  effects?: ElementEffectSetting[];
  onAddEffect?: () => void; onUpdateEffect?: (id: string, patch: Partial<Omit<ElementEffectSetting, "id">>) => void; onToggleEffect?: (id: string, visible: boolean) => void; onReorderEffect?: (id: string, targetId: string) => void; onRemoveEffect?: (id: string) => void;
  layoutGuides?: ElementLayoutGuideSetting[];
  onAddLayoutGuide?: () => void; onUpdateLayoutGuide?: (id: string, patch: Partial<Omit<ElementLayoutGuideSetting, "id">>) => void; onRemoveLayoutGuide?: (id: string) => void;
  selectionColors?: ElementSelectionColorSetting[];
  onUpdateSelectionColor?: (id: string, patch: Partial<Omit<ElementSelectionColorSetting, "id">>) => void;
  onSelectAllUsingColor?: (id: string) => void;
  /** Controlled object-animation rows. Pass an empty list for the canonical null state. */
  objectAnimations?: import("./AnimatePanel").ObjectAnimationItem[];
  objectAnimationCallbacks?: import("./AnimatePanel").ObjectAnimationCallbacks;
  objectAnimationSettings?: import("./AnimatePanel").ObjectAnimationSequenceSettings;
  addableAnimationPhases?: import("./AnimatePanel").ObjectAnimationPhase[];
  /** Project mode keeps the name a static label in V1. */
  projectName?: string;
  projectWidth?: number;
  projectHeight?: number;
  projectFrameRate?: ProjectFrameRate;
  projectDuration?: number;
  projectPlayhead?: number;
  onProjectWidthChange?: (value: number) => void;
  onProjectHeightChange?: (value: number) => void;
  onProjectFrameRateChange?: (value: ProjectFrameRate) => void;
  onProjectDurationChange?: (value: number) => void;
  onProjectPlayheadChange?: (value: number) => void;
  /** Controlled transport seam for the existing reskin-clean preview control. */
  previewPlaying?: boolean;
  onPreviewToggle?: () => void;
  onPreviewMenu?: () => void;
  /** Shared element/selection/slide still-image export contract. */
  exportSettings?: InspectorExportSetting[];
  exportTargetName?: string;
  onAddExportSetting?: () => void;
  onRemoveExportSetting?: (id: string) => void;
  onUpdateExportSetting?: (id: string, patch: Partial<Omit<InspectorExportSetting, "id">>) => void;
  onExport?: () => void;
  /** Slide mode — controlled when provided; demo fallback remains editable. */
  slideId?: string;
  slideName?: string;
  onSlideNameChange?: (value: string) => void;
  slideStart?: number;
  slideDuration?: number;
  onSlideStartChange?: (value: number) => void;
  onSlideDurationChange?: (value: number) => void;
  slideSkipped?: boolean;
  onSlideSkippedChange?: (value: boolean) => void;
  slideBackgroundType?: SlideBackgroundType;
  slideBackgroundColor?: string;
  slideBackgroundOpacity?: number;
  onSlideBackgroundTypeChange?: (value: SlideBackgroundType) => void;
  onSlideBackgroundColorChange?: (value: string) => void;
  onSlideBackgroundOpacityChange?: (value: number) => void;
  slideTransitionType?: SlideTransitionType;
  slideTransitionDirection?: SlideTransitionDirection;
  slideTransitionDuration?: number;
  slideTransitionEasing?: SlideTransitionEasing;
  onSlideTransitionTypeChange?: (value: SlideTransitionType) => void;
  onSlideTransitionDirectionChange?: (value: SlideTransitionDirection) => void;
  onSlideTransitionDurationChange?: (value: number) => void;
  onSlideTransitionEasingChange?: (value: SlideTransitionEasing) => void;
  onApplySlideTransitionToAll?: () => void;
  onDuplicateSlide?: () => void;
  onDeleteSlide?: () => void;
  /** Video Clip mode — controlled when callbacks are supplied; demo fallbacks remain editable. */
  clipName?: string;
  onClipNameChange?: (value: string) => void;
  clipSourceFile?: string;
  clipSourceResolution?: string;
  clipSourceDuration?: string;
  clipStart?: number;
  clipDuration?: number;
  onClipStartChange?: (value: number) => void;
  onClipDurationChange?: (value: number) => void;
  clipTrimIn?: number;
  clipTrimOut?: number;
  onClipTrimInChange?: (value: number) => void;
  onClipTrimOutChange?: (value: number) => void;
  clipSpeed?: ClipSpeed;
  onClipSpeedChange?: (value: ClipSpeed) => void;
  onReplaceClip?: () => void;
  onDeleteClip?: () => void;
  className?: string;
}

// ─── Multiplayer bar ──────────────────────────────────────────────────────────
// Sits above the tab strip: avatar split-button (leading), then a play/present
// split-button + Share button trailing.
function MultiplayerBar({ previewPlaying = false, onPreviewToggle, onPreviewMenu }: { previewPlaying?: boolean; onPreviewToggle?: () => void; onPreviewMenu?: () => void }) {
  return (
    <div className="flex items-center gap-[8px] px-[8px] py-[6px]">
      <SplitButton
        size="large"
        icon={<Avatar initial="S" size="default" color="purple" />}
        actionLabel="Account"
        menuLabel="Account menu"
        onIconClick={() => {}}
        onChevronClick={() => {}}
      />
      <div className="flex-1" />
      <SplitButton
        size="large"
        icon={previewPlaying ? <Pause size={18} strokeWidth={1.5} /> : <Play size={18} strokeWidth={1.5} />}
        actionLabel={previewPlaying ? "Pause preview" : "Play preview"}
        menuLabel="Preview options"
        onIconClick={onPreviewToggle}
        onChevronClick={onPreviewMenu}
      />
      <Button label="Share" variant="Primary" size="large" />
    </div>
  );
}

export function PropertyPanel(props: PropertyPanelProps) {
  const {
  capabilities: capabilityOverrides,
  mode = "element",
  elementType = "text",
  multiSelect = false,
  x = 0, y = 0, rotation = 0,
  onXChange, onYChange, onRotationChange,
  onNumericEditStart, onNumericEditCommit, onNumericEditCancel,
  width = 1200, height = 115,
  onWidthChange, onHeightChange,
  opacity = 100,
  onOpacityChange,
  blendMode = "Pass through",
  cornerRadius = 0, onBlendModeChange, onCornerRadiusChange,
  layout, onLayoutChange, onSizingChange, onSizingConstraintChange, onApplySizingVariable, onAutoLayoutSettingsRequest, typography, onTypographyChange,
  fills, onAddFill, onUpdateFill, onToggleFill, onReorderFill, onRemoveFill,
  strokes, onAddStroke, onUpdateStroke, onToggleStroke, onReorderStroke, onRemoveStroke,
  effects, onAddEffect, onUpdateEffect, onToggleEffect, onReorderEffect, onRemoveEffect,
  layoutGuides, onAddLayoutGuide, onUpdateLayoutGuide, onRemoveLayoutGuide,
  selectionColors, onUpdateSelectionColor, onSelectAllUsingColor, objectAnimations, objectAnimationCallbacks, objectAnimationSettings, addableAnimationPhases,
  projectName = "Project",
  projectWidth = 1920,
  projectHeight = 1080,
  projectFrameRate = 30,
  projectDuration = 30,
  projectPlayhead = 0,
  onProjectWidthChange,
  onProjectHeightChange,
  onProjectFrameRateChange,
  onProjectDurationChange,
  onProjectPlayheadChange,
  previewPlaying = false,
  onPreviewToggle,
  onPreviewMenu,
  exportSettings,
  exportTargetName,
  onAddExportSetting,
  onRemoveExportSetting,
  onUpdateExportSetting,
  onExport,
  slideId,
  slideName = "Composition 1",
  onSlideNameChange,
  slideStart = 0,
  slideDuration = 5,
  onSlideStartChange,
  onSlideDurationChange,
  slideSkipped = false,
  onSlideSkippedChange,
  slideBackgroundType,
  slideBackgroundColor,
  slideBackgroundOpacity,
  onSlideBackgroundTypeChange,
  onSlideBackgroundColorChange,
  onSlideBackgroundOpacityChange,
  slideTransitionType,
  slideTransitionDirection,
  slideTransitionDuration,
  slideTransitionEasing,
  onSlideTransitionTypeChange,
  onSlideTransitionDirectionChange,
  onSlideTransitionDurationChange,
  onSlideTransitionEasingChange,
  onApplySlideTransitionToAll,
  onDuplicateSlide,
  onDeleteSlide,
  clipName = "hero-cover",
  onClipNameChange,
  clipSourceFile = "hero-cover.mp4",
  clipSourceResolution = "1920 × 1080",
  clipSourceDuration = "1:24.00",
  clipStart = 0,
  clipDuration = 8,
  onClipStartChange,
  onClipDurationChange,
  clipTrimIn = 10,
  clipTrimOut = 18,
  onClipTrimInChange,
  onClipTrimOutChange,
  clipSpeed = 1,
  onClipSpeedChange,
  onReplaceClip,
  onDeleteClip,
  className,
  } = props;
  const capabilities: Required<InspectorCapabilities> = {
    templates: capabilityOverrides?.templates ?? true,
    styles: capabilityOverrides?.styles ?? true,
    variables: capabilityOverrides?.variables ?? true,
    libraries: capabilityOverrides?.libraries ?? true,
  };
  const [tab, setTab] = useState("design");
  const [demoSlideName, setDemoSlideName] = useState(slideName);
  const [demoSkipped, setDemoSkipped] = useState(slideSkipped);
  const [demoTransitionType, setDemoTransitionType] = useState<SlideTransitionType>(slideTransitionType ?? "none");
  const [demoTransitionDirection, setDemoTransitionDirection] = useState<SlideTransitionDirection>(slideTransitionDirection ?? "right");
  const [demoTransitionDuration, setDemoTransitionDuration] = useState(slideTransitionDuration ?? 500);
  const [demoTransitionEasing, setDemoTransitionEasing] = useState<SlideTransitionEasing>(slideTransitionEasing ?? "ease-in-out");
  const [demoClipName, setDemoClipName] = useState(clipName);
  const slideNameControlled = props.slideName !== undefined;
  const slideSkippedControlled = props.slideSkipped !== undefined;
  const clipNameControlled = props.clipName !== undefined;
  const renderedSlideName = slideNameControlled ? slideName : demoSlideName;
  const renderedSkipped = slideSkippedControlled ? slideSkipped : demoSkipped;
  const renderedTransitionType = slideTransitionType ?? demoTransitionType;
  const renderedTransitionDirection = slideTransitionDirection ?? demoTransitionDirection;
  const renderedTransitionDuration = slideTransitionDuration ?? demoTransitionDuration;
  const renderedTransitionEasing = slideTransitionEasing ?? demoTransitionEasing;
  const renderedClipName = clipNameControlled ? clipName : demoClipName;
  const isText     = elementType === "text";
  const isShape    = elementType === "shape";
  const isInstance = elementType === "component";

  // Auto-layout is reachable from a plain frame two ways: the Layout header's "+"
  // button, or moving Flow off its first ("Freeform") option — both just flip this.
  const isFrameLike = elementType === "frame" || elementType === "frame-auto";
  const [autoLayoutOn, setAutoLayoutOn] = useState(elementType === "frame-auto");
  const controlledAutoLayout = layout ? layout.mode !== "none" : undefined;
  useEffect(() => setAutoLayoutOn(elementType === "frame-auto"), [elementType]);
  const resolvedAutoLayout = controlledAutoLayout ?? autoLayoutOn;
  const isFrame = isFrameLike && !resolvedAutoLayout;
  const isAutoLayout = isFrameLike && resolvedAutoLayout;

  const emitSizing = (axis: ElementSizingAxis, change: ElementSizingChange) => {
    if (onSizingChange) { onSizingChange(axis, change); return; }
    if (change.value !== undefined) (axis === "width" ? onWidthChange : onHeightChange)?.(change.value);
    onLayoutChange?.(axis === "width" ? { widthMode: change.mode } : { heightMode: change.mode });
  };
  const emitConstraint = (axis: ElementSizingAxis, constraint: ElementSizingConstraint, value: number | undefined) => {
    if (onSizingConstraintChange) { onSizingConstraintChange(axis, constraint, value); return; }
    const key = `${constraint}${axis === "width" ? "Width" : "Height"}` as "minWidth" | "minHeight" | "maxWidth" | "maxHeight";
    onLayoutChange?.({ [key]: value });
  };
  const sizingContract: Omit<DimensionSizingFieldsProps, "width" | "height"> = {
    widthMode: layout?.widthMode,
    heightMode: layout?.heightMode,
    widthMixed: layout?.widthModeMixed,
    heightMixed: layout?.heightModeMixed,
    availableWidthModes: layout?.availableWidthModes,
    availableHeightModes: layout?.availableHeightModes,
    minWidth: layout?.minWidth,
    minHeight: layout?.minHeight,
    maxWidth: layout?.maxWidth,
    maxHeight: layout?.maxHeight,
    minWidthMixed: layout?.minWidthMixed,
    minHeightMixed: layout?.minHeightMixed,
    maxWidthMixed: layout?.maxWidthMixed,
    maxHeightMixed: layout?.maxHeightMixed,
    variablesEnabled: capabilities.variables,
    onWidthChange,
    onHeightChange,
    onSizingChange: (onSizingChange || onLayoutChange) ? emitSizing : undefined,
    onConstraintChange: (onSizingConstraintChange || onLayoutChange) ? emitConstraint : undefined,
    onApplySizingVariable,
  };

  const elementLabel: Record<ElementType, string> = {
    text: "Text",
    frame: "Frame",
    "frame-auto": "Frame",
    shape: "Rectangle",
    component: "Component",
    group: "Group",
  };

  return (
    <NumericEditSessionProvider onEditStart={onNumericEditStart} onEditCommit={onNumericEditCommit} onEditCancel={onNumericEditCancel}>
    <Panel className={clsx("h-full overflow-hidden flex flex-col", className)}>
      {/* Multiplayer tools — above the tabs; shared across all modes */}
      <MultiplayerBar previewPlaying={previewPlaying} onPreviewToggle={onPreviewToggle} onPreviewMenu={onPreviewMenu} />

      {/* ── PROJECT mode (inspector-project-mode.md) ─────────────────────────
          Active when nothing is selected. Static "Project" header, no tabs. */}
      {mode === "project" && (
        <ScrollArea>
          {/* Panel header — static "Project" label */}
          <div className="h-[40px] flex items-center px-[16px] border-b border-c-border">
            <span className={clsx(FONT, "text-[11px] font-[550] text-c-text")}>{projectName}</span>
          </div>

          <CanvasSection width={projectWidth} height={projectHeight} frameRate={projectFrameRate}
            widthControlled={props.projectWidth !== undefined} heightControlled={props.projectHeight !== undefined} frameRateControlled={props.projectFrameRate !== undefined}
            onWidthChange={onProjectWidthChange} onHeightChange={onProjectHeightChange} onFrameRateChange={onProjectFrameRateChange} />
          <MasterTimelineSection totalDuration={projectDuration} playhead={projectPlayhead}
            durationControlled={props.projectDuration !== undefined} playheadControlled={props.projectPlayhead !== undefined}
            onTotalDurationChange={onProjectDurationChange} onPlayheadChange={onProjectPlayheadChange} />
          <ProjectExportSection />
        </ScrollArea>
      )}

      {/* ── SLIDE mode (inspector-slide-mode.md) ─────────────────────────────
          Active when a slide is selected. Design owns structural slide settings;
          Animate owns transitions and object-animation sequencing. */}
      {mode === "slide" && (
        <>
          <div className="border-b border-c-border px-[8px] pt-[6px] pb-[6px]">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "design", label: "Design", panelId: "slide-design-panel" },
                { value: "animate", label: "Animate", panelId: "slide-animate-panel" },
              ]}
            />
          </div>

          {tab === "design" && <div role="tabpanel" id="slide-design-panel" aria-labelledby="slide-design-panel-tab" className="contents"><ScrollArea>
          {/* Panel header — inline-editable slide name + options IconButton */}
          <div className="h-[40px] flex items-center gap-[8px] px-[16px] border-b border-c-border">
            <div className="flex-1 min-w-0">
              <InputField value={renderedSlideName} onChange={value => { if (!slideNameControlled) setDemoSlideName(value); onSlideNameChange?.(value); }} placeholder="Composition name" />
            </div>
            <PopoverMenu
              align="right"
              trigger={<PanelActionBtn icon={<MoreHorizontal size={16} strokeWidth={1.5} />} label="Composition options" />}
            >
              {(close) => (
                <Menu minWidth={180}>
                  <MenuRow type="simple" label="Duplicate composition" onClick={() => { onDuplicateSlide?.(); close(); }} />
                  <MenuRow type="toggle" label="Skip composition" checked={renderedSkipped} onClick={() => { const next = !renderedSkipped; if (!slideSkippedControlled) setDemoSkipped(next); onSlideSkippedChange?.(next); close(); }} />
                  <MenuRow type="simple" label="Delete composition" destructive onClick={() => { onDeleteSlide?.(); close(); }} />
                </Menu>
              )}
            </PopoverMenu>
          </div>

          {/* Slide template first, ahead of Timing (user's preferred order). */}
          {capabilities.templates && <TemplateStyleSection />}
          <SlideTimingSection
            start={slideStart}
            end={slideStart + slideDuration}
            controlled={props.slideStart !== undefined || props.slideDuration !== undefined}
            onStartChange={onSlideStartChange}
            onEndChange={value => onSlideDurationChange?.(Math.max(0, value - slideStart))}
            onDurationChange={onSlideDurationChange}
          />
          <SlideBackgroundSection
            capabilities={capabilities}
            type={slideBackgroundType}
            color={slideBackgroundColor}
            opacity={slideBackgroundOpacity}
            onTypeChange={onSlideBackgroundTypeChange}
            onColorChange={onSlideBackgroundColorChange}
            onOpacityChange={onSlideBackgroundOpacityChange}
          />
          <LayoutGuideSection entries={layoutGuides} onAdd={onAddLayoutGuide} onUpdate={onUpdateLayoutGuide} onRemove={onRemoveLayoutGuide} />
          {/* Selection colors — reuse the existing element-mode section */}
          <SelectionColorsSection colors={selectionColors} onUpdate={onUpdateSelectionColor} onSelectAll={onSelectAllUsingColor} capabilities={capabilities} />
          <ExportSection settings={exportSettings} targetName={exportTargetName ?? renderedSlideName}
            onAdd={onAddExportSetting} onRemove={onRemoveExportSetting} onUpdate={onUpdateExportSetting} onExport={onExport} />
          </ScrollArea></div>}

          {tab === "animate" && <div role="tabpanel" id="slide-animate-panel" aria-labelledby="slide-animate-panel-tab" className="contents"><AnimatePanel anims={objectAnimations}
            contextKey={slideId}
            objectAnimationCallbacks={objectAnimationCallbacks} objectAnimationSettings={objectAnimationSettings} addablePhases={addableAnimationPhases}
            compTransition={{ style: renderedTransitionType, direction: renderedTransitionDirection, durationMs: renderedTransitionDuration, easing: renderedTransitionEasing }}
            compTransitionCallbacks={{
              onStyleChange: value => { if (slideTransitionType === undefined) setDemoTransitionType(value); onSlideTransitionTypeChange?.(value); },
              onDirectionChange: value => { if (slideTransitionDirection === undefined) setDemoTransitionDirection(value); onSlideTransitionDirectionChange?.(value); },
              onDurationChange: value => { if (slideTransitionDuration === undefined) setDemoTransitionDuration(value); onSlideTransitionDurationChange?.(value); },
              onEasingChange: value => { if (slideTransitionEasing === undefined) setDemoTransitionEasing(value); onSlideTransitionEasingChange?.(value); },
              onApplyToAll: onApplySlideTransitionToAll,
            }} /></div>}
        </>
      )}

      {/* ── VIDEO CLIP mode (video-clip-inspector-mode.md) ───────────────────
          Active exclusively when a base-video clip block is selected in the
          master timeline (not a slide — Slides/Layers panels don't update).
          Header = clip-name field plus the requested replace/delete actions in
          the shared options-menu pattern. No tabs or dialogs. */}
      {mode === "video-clip" && (
        <ScrollArea>
          <div className="h-[40px] flex items-center gap-[8px] px-[16px] border-b border-c-border">
            <div className="flex-1 min-w-0">
              <InputField value={renderedClipName} onChange={value => { if (!clipNameControlled) setDemoClipName(value); onClipNameChange?.(value); }} placeholder="Clip name" />
            </div>
            <PopoverMenu align="right" trigger={<PanelActionBtn icon={<MoreHorizontal size={16} strokeWidth={1.5} />} label="Video clip options" />}>
              {close => <Menu minWidth={180}>
                <MenuRow type="simple" label="Replace video" onClick={() => { onReplaceClip?.(); close(); }} />
                <MenuRow type="simple" label="Delete clip" destructive onClick={() => { onDeleteClip?.(); close(); }} />
              </Menu>}
            </PopoverMenu>
          </div>

          <ClipSourceSection file={clipSourceFile} resolution={clipSourceResolution} sourceDuration={clipSourceDuration} />
          {/* Demo data kept consistent per spec: Clipped duration (trimOut −
              trimIn = 8s) equals the Timeline duration (end − start = 8s). */}
          <SlideTimingSection title="Timeline" landmark start={clipStart} end={clipStart + clipDuration}
            controlled={props.clipStart !== undefined || props.clipDuration !== undefined}
            onStartChange={onClipStartChange}
            onEndChange={value => onClipDurationChange?.(Math.max(0, value - clipStart))}
            onDurationChange={onClipDurationChange} />
          <ClipTrimSection trimIn={clipTrimIn} trimOut={clipTrimOut} controlled={props.clipTrimIn !== undefined || props.clipTrimOut !== undefined} onTrimInChange={onClipTrimInChange} onTrimOutChange={onClipTrimOutChange} />
          <ClipPlaybackSection speed={clipSpeed} controlled={props.clipSpeed !== undefined} onSpeedChange={onClipSpeedChange} />
        </ScrollArea>
      )}

      {/* ── ELEMENT mode (default) — tabs + selection inspector ──────────────── */}
      {mode === "element" && (
      <>
      {/* Tab strip */}
      <div className="border-b border-c-border px-[8px] pt-[6px] pb-[6px]">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "design",  label: "Design", panelId: "element-design-panel" },
            { value: "animate", label: "Animate", panelId: "element-animate-panel" },
          ]}
        />
      </div>

      {/* Design tab content */}
      {tab === "design" && (
        <div role="tabpanel" id="element-design-panel" aria-labelledby="element-design-panel-tab" className="contents"><ScrollArea>
          {/* Element type label */}
          <div className="h-[40px] flex items-center px-[16px] border-b border-c-border">
            <span className={clsx(FONT, "text-[11px] font-[550] text-c-text")}>
              {elementLabel[elementType]}
            </span>
          </div>

          {/* Component Properties — instances only (§5.1), at the very top */}
          {isInstance && <ComponentPropertiesSection />}

          {/* Position — always present */}
          <PositionSection
            x={x} y={y} rotation={rotation}
            onXChange={onXChange} onYChange={onYChange} onRotationChange={onRotationChange}
            positioning={layout?.positioning}
            positioningApplicable={layout?.positioningApplicable}
            onPositioningChange={onLayoutChange ? positioning => onLayoutChange({ positioning }) : undefined}
            multiSelect={multiSelect}
          />

          {/* Layout — polymorphic */}
          {(isFrame)       && <LayoutFrameSection width={width} height={height} sizing={sizingContract} clipContent={layout?.clipsContent} onWidthChange={onWidthChange} onHeightChange={onHeightChange} onClipContentChange={onLayoutChange ? value => onLayoutChange({ clipsContent: value }) : undefined} onEnableAutoLayout={() => { setAutoLayoutOn(true); onLayoutChange?.({ mode: "vertical" }); }} />}
          {(isAutoLayout)  && <LayoutAutoSection width={width} height={height}
            flowMode={layout?.mode}
            gap={layout?.gap} paddingTop={layout?.padding.top} paddingRight={layout?.padding.right} paddingBottom={layout?.padding.bottom} paddingLeft={layout?.padding.left}
            alignValue={layout?.align} clipContent={layout?.clipsContent}
            widthMode={layout?.widthMode} heightMode={layout?.heightMode}
            sizing={sizingContract}
            onLayoutChange={onLayoutChange} onPaddingChange={onLayoutChange ? padding => onLayoutChange({ padding }) : undefined}
            onAlignChange={onLayoutChange ? align => onLayoutChange({ align }) : undefined} onClipContentChange={onLayoutChange ? clipsContent => onLayoutChange({ clipsContent }) : undefined}
            onAutoLayoutSettingsRequest={onAutoLayoutSettingsRequest} />}
          {(isShape || isText) && (
            <PanelSection title="Layout">
              <DimensionSizingFields {...sizingContract} width={width} height={height} />
              {/* Corner radius moved to Appearance */}
            </PanelSection>
          )}

          {/* Appearance — always present */}
          <AppearanceSection opacity={opacity} blendMode={blendMode} cornerRadius={cornerRadius} blendControlled={props.blendMode !== undefined} cornerControlled={props.cornerRadius !== undefined} onOpacityChange={onOpacityChange} onBlendModeChange={onBlendModeChange} onCornerRadiusChange={onCornerRadiusChange} />

          {/* Typography — text only */}
          {isText && <TypographySection value={typography} onChange={onTypographyChange} stylesAvailable={capabilities.styles} />}

          {/* Stackable sections */}
          <FillSection entries={fills} onAdd={onAddFill} onUpdate={onUpdateFill} onToggle={onToggleFill} onReorder={onReorderFill} onRemove={onRemoveFill} capabilities={capabilities} />
          <StrokeSection entries={strokes} onAdd={onAddStroke} onUpdate={onUpdateStroke} onToggle={onToggleStroke} onReorder={onReorderStroke} onRemove={onRemoveStroke} capabilities={capabilities} />
          <EffectsSection entries={effects} onAdd={onAddEffect} onUpdate={onUpdateEffect} onToggle={onToggleEffect} onReorder={onReorderEffect} onRemove={onRemoveEffect} capabilities={capabilities} />

          {/* Selection Colors — multi-select only (§5.8), positioned right after Effects */}
          {multiSelect && <SelectionColorsSection colors={selectionColors} onUpdate={onUpdateSelectionColor} onSelectAll={onSelectAllUsingColor} capabilities={capabilities} />}

          <ExportSection settings={exportSettings} targetName={exportTargetName ?? elementLabel[elementType]}
            onAdd={onAddExportSetting} onRemove={onRemoveExportSetting} onUpdate={onUpdateExportSetting} onExport={onExport} />
        </ScrollArea></div>
      )}

      {/* Animate tab — the animation panel */}
      {tab === "animate" && <div role="tabpanel" id="element-animate-panel" aria-labelledby="element-animate-panel-tab" className="contents"><AnimatePanel anims={objectAnimations} contextKey={slideId} objectAnimationCallbacks={objectAnimationCallbacks} objectAnimationSettings={objectAnimationSettings} addablePhases={addableAnimationPhases} /></div>}

      {/* Prototype placeholder */}
      {tab === "prototype" && (
        <div className="flex-1 flex items-center justify-center">
          <span className={clsx(FONT, "text-[11px] text-c-text-tertiary")}>Prototype settings</span>
        </div>
      )}
      </>
      )}
    </Panel>
    </NumericEditSessionProvider>
  );
}
