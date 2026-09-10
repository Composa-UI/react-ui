import { useEffect, useRef, useState, Fragment, type ReactNode } from "react";
import { clsx } from "clsx";
import {
  RotateCw, FlipHorizontal2, FlipVertical2,
  Link2, Link2Off, MoreHorizontal,
  Maximize2, Minimize2, Plus, Eye,
  Columns,
  BookOpen,
  Crosshair, Grid3x3, ExternalLink, Link, Unlink,
  Minus, EyeOff, AlignJustify, Maximize, ChevronDown, Ruler,
  MoveHorizontal, MoveVertical, Play, Pause, MonitorPlay,
  Image as ImageIcon, Clock, SquareSquare,
  ArrowLeftFromLine, ArrowRightFromLine, Timer,
  Square, SquareDashedMousePointer, PanelTop, PanelBottom, PanelLeft, PanelRight, Diamond, ArrowLeft,
} from "lucide-react";
import { CirclesFour } from "@phosphor-icons/react";
import { ProposedSquareText, ProposedTextMargins } from "../../icons/proposed-lucide";
import {
  PanelSection, PanelFieldRow, PanelSegmentedRow, PanelFullRow, PanelRow,
  IconButtonRow, PanelActionBtn, PanelEntry, PanelReorderableEntry, ScrollArea, PANEL_W, type IconBtn,
} from "./Panel";
import { Tabs } from "./Tabs";
import { NumericEditSessionProvider, NumericInput, NumericComboInput, NumericPairInput, InputField, ColorInput, ComboInput, formatNumericDisplay } from "./Input";
import { Dropdown } from "./Dropdown";
import { SegmentedControl } from "./SegmentedControl";
import { AlignmentControl, type AlignmentValue } from "./AlignmentControl";
import { Chit } from "./Chit";
import { Checkbox } from "./Checkbox";
import { ColorDialog, type FillType, type GradientStop, type GradientStopKeyframeControls, type ImageAdjustment, type ImageAdjustments, type MediaFillFit, type VideoPlaybackOptions } from "./ColorDialog";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { AnimatePanel } from "./AnimatePanel";
import { Avatar, type AvatarColor } from "./Avatar";
import { SplitButton } from "./SplitButton";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";
import { EffectDetailsDialog, type EffectDetailsValue } from "./EffectDetailsDialog";
import { AutoLayoutSettingsDialog } from "./AutoLayoutSettingsDialog";
import { GridDimensionsPicker } from "./GridDimensionsPicker";
import {
  StrokeSettingsDialog,
  type StrokeCap,
  type StrokeJoin,
  type StrokeStyle,
} from "./StrokeSettingsDialog";
import { EasingInspectorSection, type EasingInspectorSectionProps, type EasingInspectorValue } from "./EasingInspectorSection";
import { Dial } from "./Dial";
import { Slider } from "./Slider";
import { ColorAdjustmentsDialog, type ColorAdjustmentGroup } from "./ColorAdjustmentsDialog";
import type { EasingApplyScope, EasingPreset } from "./easing";
import { iconForSemantic } from "./IconSemantics";
import { AutoLayoutSpacingIcon } from "./AutoLayoutSpacingIcon";
import { TypeSettingsDialog } from "./TypeSettingsDialog";
import { DEFAULT_FONT_WEIGHTS, FontPickerDialog, type FontEntry, type FontWeightOption } from "./FontPickerDialog";
import { COMPOSA_NON_SELECTABLE_CHROME_CLASS } from "./AnchoredInspectorOverlay";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ElementType = "text" | "frame" | "frame-auto" | "frame-grid" | "shape" | "component" | "group";

export type PanelMode = "project" | "slide" | "element" | "video-clip" | "audio-clip" | "media-effects";

// ─── Video / Audio inspector types (effects-mental-model.md) ──────────────────
// The AV inspectors are STRUCTURE ONLY: controls render at sensible defaults and
// map to the document model where a field exists (Blend, Volume). Colour grading
// and audio DSP are a later WebGL/Web-Audio effort — those controls render but do
// not process signal, and carry no invented engine schema.
export type ClipBlendMode = "Normal" | "Add" | "Subtract" | "Reverse subtract";
export const CLIP_BLEND_MODES: ClipBlendMode[] = ["Normal", "Add", "Subtract", "Reverse subtract"];

export type SlideBackgroundType = "solid" | "gradient" | "image" | "video" | "drop-zone";
export type SlideTransitionType = "none" | "fade" | "push" | "slide" | "wipe";
export type SlideTransitionDirection = "left" | "right" | "up" | "down";
export type SlideTransitionEasing = EasingPreset;
export type ClipSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2 | 4;
export type ExportFormat = "PNG" | "JPG";
/** Static exports authored values; Animated samples one evaluated playhead still. */
export type InspectorExportMode = "static" | "frame";
/**
 * `suffix` is vestigial: Composa#661 removed the Suffix field, and nothing in this
 * component reads it any more. Kept OPTIONAL rather than deleted because the app
 * still passes it, and an excess-property check would break the host the moment
 * this shipped. It can go once the app stops sending it.
 */
export interface InspectorExportSetting { id: string; scale: number; suffix?: string; format: ExportFormat; quality?: number; }
export type ProjectFrameRate = 24 | 25 | 30 | 60;
export interface ElementFillSetting {
  id: string; color: string; opacity: number; visible: boolean; label?: string;
  /** Per-entry motion bindings. Hosts omit these for non-solid paints. */
  keyframes?: {
    color?: InspectorKeyframeControl;
    opacity?: InspectorKeyframeControl;
    gradientStops?: Record<string, GradientStopKeyframeControls>;
    imageAdjustments?: Partial<Record<ImageAdjustment, InspectorKeyframeControl>>;
    mediaTileScale?: InspectorKeyframeControl;
  };
  /** The controlled ColorDialog mode for this specific fill entry. */
  fillType?: FillType;
  gradientStops?: GradientStop[];
  /** Host-owned CSS projection of the authored gradient, shared with canvas/thumbnail direction math. */
  gradientPreview?: string;
  imageSourceLabel?: string;
  imagePreviewUrl?: string;
  videoSourceLabel?: string;
  videoPreviewUrl?: string;
  videoPlayback?: VideoPlaybackOptions;
  mediaFit?: MediaFillFit;
  mediaTileScale?: number;
  imageAdjustments?: Partial<ImageAdjustments>;
  /** A host-owned visual track binding for a standalone drop-zone fill. */
  dropZoneSourceId?: string;
}

/** Canvas gradient chrome is an editor for one authored gradient, never a
 * generic colour-dialog affordance. Resolving this from the current fill list
 * also clears stale chrome when the inspector selection changes. */
export function activeGradientFillDialogId(activeStackDialog: string | null, fills: readonly ElementFillSetting[] | undefined): string | null {
  if (!activeStackDialog?.startsWith("fill-color:")) return null;
  const id = activeStackDialog.slice("fill-color:".length);
  const type = fills?.find(fill => fill.id === id)?.fillType;
  return type === "linear" || type === "radial" || type === "angular" || type === "diamond" ? id : null;
}

export type StrokeWeightMode = "all" | "top" | "bottom" | "left" | "right" | "custom";
export interface StrokeEdgeWeights { top: number; right: number; bottom: number; left: number; }
export interface ElementStrokeSetting extends ElementFillSetting {
  weight: number;
  align: "inside" | "center" | "outside";
  /** Which closed-shape edges receive the stroke. Undefined preserves legacy All. */
  weightMode?: StrokeWeightMode;
  /** Authored per-edge values used only while weightMode is Custom. */
  edgeWeights?: StrokeEdgeWeights;
  /** SVG-path trim percentages. Undefined preserves the full visible path. */
  pathTrimStart?: number;
  pathTrimEnd?: number;
  /** Per-stroke motion bindings. The host supplies only genuinely supported controls. */
  keyframes?: {
    color?: InspectorKeyframeControl;
    opacity?: InspectorKeyframeControl;
    weight?: InspectorKeyframeControl;
    edgeWeights?: Partial<Record<keyof StrokeEdgeWeights, InspectorKeyframeControl>>;
    pathTrimStart?: InspectorKeyframeControl;
    pathTrimEnd?: InspectorKeyframeControl;
  };
  style?: StrokeStyle;
  join?: StrokeJoin;
  cap?: StrokeCap;
  styleMixed?: boolean;
  joinMixed?: boolean;
  capMixed?: boolean;
}
export interface ElementEffectSetting extends EffectDetailsValue { id: string; }
export interface ElementLayoutGuideSetting { id: string; type: "Grid" | "Columns" | "Rows"; visible: boolean; size: number; }
export interface ElementSelectionColorSetting {
  id: string; color: string; opacity: number; usageCount?: number;
  /** A shared gradient remains one Selection colors entry, never one row per stop. */
  fillType?: Extract<FillType, "linear" | "radial" | "angular" | "diamond">;
  gradientStops?: GradientStop[];
  gradientPreview?: string;
}
export interface InspectorCapabilities { templates?: boolean; styles?: boolean; variables?: boolean; libraries?: boolean; videoFill?: boolean; dropZone?: boolean; animationDelay?: boolean; layoutFidelityTools?: boolean; }
export interface ElementTypographySettings {
  fontFamily: string; fontWeight: string; fontSize: number; lineHeight: number; letterSpacing: number;
  align: "left" | "center" | "right" | "justify"; verticalAlign: "top" | "middle" | "bottom"; styleName?: string;
  /** Type-settings dialog fields — host-backed typographic properties (#431). */
  decoration?: "none" | "underline" | "strikethrough";
  textCase?: "none" | "upper" | "lower" | "title";
  /** Variable-font weight 100–900 (regular 400 · medium 500 · bold 700). */
  weight?: number;
  /** Mixed-selection truth flags so multi-select never fabricates a concrete value. */
  alignMixed?: boolean;
  verticalAlignMixed?: boolean;
  decorationMixed?: boolean;
  textCaseMixed?: boolean;
  weightMixed?: boolean;
  lineHeightMixed?: boolean;
  letterSpacingMixed?: boolean;
}
// Grid track/model mirror of the engine's GridProperties (grid-and-wrap-spec §3).
// Phase A: fixed/hug tracks, two gaps, per-axis item + content alignment. `fr`,
// spans, and auto-placement are Phase B.
export type GridTrackMode = "fixed" | "hug";
export interface ElementGridTrack { id: string; mode: GridTrackMode; size: number; }
export type GridItemAlign = "start" | "center" | "end" | "stretch";
export type GridContentAlign = "start" | "center" | "end";
export interface ElementGridSettings {
  rows: ElementGridTrack[];
  columns: ElementGridTrack[];
  rowGap: number;
  columnGap: number;
  justifyItems: GridItemAlign;
  alignItems: GridItemAlign;
  justifyContent: GridContentAlign;
  alignContent: GridContentAlign;
  /** Host projection over explicit gridArea ownership. */
  automaticPositioning?: boolean | "mixed";
}

export interface ElementLayoutSettings {
  // Wrap is a horizontal-only modifier (Figma parity), not a peer flow direction.
  // `grid` is a distinct 2D layout mode (§5 Reading A); wrap and grid never coexist.
  mode: "none" | "horizontal" | "vertical" | "grid"; gap: number | "auto";
  /** 2D grid track model — present only when `mode === "grid"`. */
  grid?: ElementGridSettings;
  /** Horizontal-only wrap modifier. */
  wrap?: boolean;
  /** Cross-axis gap between wrapped rows. Meaningful only while wrapping. */
  rowGap?: number | "auto";
  padding: { top: number; right: number; bottom: number; left: number };
  align: string; widthMode: "fixed" | "hug" | "fill"; heightMode: "fixed" | "hug" | "fill"; clipsContent: boolean;
  positioning?: "auto" | "absolute";
  positioningApplicable?: boolean;
  minWidth?: number; minHeight?: number; maxWidth?: number; maxHeight?: number;
  availableWidthModes?: ElementSizingMode[];
  availableHeightModes?: ElementSizingMode[];
  widthModeMixed?: boolean;
  heightModeMixed?: boolean;
  /** The resolved numeric W/H differs across a multi-selection (mode may still be
   *  uniformly Fixed). Renders the "Mixed" placeholder in the value field. */
  widthValueMixed?: boolean;
  heightValueMixed?: boolean;
  minWidthMixed?: boolean; minHeightMixed?: boolean; maxWidthMixed?: boolean; maxHeightMixed?: boolean;
  paddingTopMixed?: boolean; paddingRightMixed?: boolean; paddingBottomMixed?: boolean; paddingLeftMixed?: boolean;
  paddingDisabled?: boolean;
  textBaseline?: boolean;
  strokeSizing?: "excluded" | "included";
  canvasStacking?: "first-on-top" | "last-on-top";
  textBaselineMixed?: boolean;
  strokeSizingMixed?: boolean;
  canvasStackingMixed?: boolean;
  autoLayoutSettingsBaselineApplicable?: boolean;
  autoLayoutSettingsDisabled?: boolean;
}
export type ElementPaddingEdge = keyof ElementLayoutSettings["padding"];

export type ElementSizingAxis = "width" | "height";
export type ElementSizingMode = "fixed" | "hug" | "fill";
export interface ElementSizingChange { mode: ElementSizingMode; value?: number; }
/** A slide/composition's duration derivation: a pinned fixed length, or hug —
 *  follow the composition's longest object-animation extent. */
export type SlideDurationMode = "fixed" | "hug";
export type ElementSizingConstraint = "min" | "max";
export type TextSizingMode = "auto-width" | "auto-height" | "fixed-size";
export type PositionPresentation = "combined" | "separate";
export interface ProjectCanvasSize {
  width: number;
  height: number;
}

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
const SettingsIcon = iconForSemantic("settings");
const ResizeToFitIcon = iconForSemantic("resize-to-fit");
// Blend mode reads as a droplet (owner ask) — the glyph is defined once in the
// icon-semantics map (blend-mode → Droplet); the trigger + collapsed row share it.
const BlendModeIcon = iconForSemantic("blend-mode");
const AbsolutePositionIcon = iconForSemantic("absolute-position");
const RotationIcon = iconForSemantic("rotation");
const OpacityIcon = iconForSemantic("opacity");
const LineHeightIcon = iconForSemantic("line-height");
const LetterSpacingIcon = iconForSemantic("letter-spacing");
const LayoutFreeformIcon = iconForSemantic("layout-freeform");
const LayoutHorizontalIcon = iconForSemantic("layout-horizontal");
const LayoutVerticalIcon = iconForSemantic("layout-vertical");
const LayoutWrapIcon = iconForSemantic("layout-wrap");
const LayoutGridIcon = iconForSemantic("layout-grid");
// The Layout header's auto-layout toggle (Composa#661): panel-plus while auto
// layout is OFF, panel-check while it is ON. A bare Plus/Grid glyph read as an
// unrelated "add something" action rather than a two-state toggle.
const AutoLayoutAddIcon = iconForSemantic("auto-layout-add");
const AutoLayoutOnIcon = iconForSemantic("auto-layout-frame");
const AlignLeftIcon = iconForSemantic("align-left");
const AlignCenterXIcon = iconForSemantic("align-center-x");
const AlignRightIcon = iconForSemantic("align-right");
const AlignTopIcon = iconForSemantic("align-top");
const AlignCenterYIcon = iconForSemantic("align-center-y");
const AlignBottomIcon = iconForSemantic("align-bottom");
const DistributeHorizontalIcon = iconForSemantic("distribute-horizontal");
const DistributeVerticalIcon = iconForSemantic("distribute-vertical");
const TidyUpIcon = iconForSemantic("tidy-up");
const TextAlignLeftIcon = iconForSemantic("text-align-left");
const TextAlignCenterXIcon = iconForSemantic("text-align-center-x");
const TextAlignRightIcon = iconForSemantic("text-align-right");
const TextAlignTopIcon = iconForSemantic("text-align-top");
const TextAlignCenterIcon = iconForSemantic("text-align-center");
const TextAlignBottomIcon = iconForSemantic("text-align-bottom");
const SizingFixedIcon = iconForSemantic("sizing-fixed");
const SizingHugIcon = iconForSemantic("sizing-hug");
const SizingFillIcon = iconForSemantic("sizing-fill");
const VideoFillIcon = iconForSemantic("fill-video");

// Two independently-labeled fields side by side. Used by the project/slide/clip
// panels (not the element PropertyPanel) where two related controls read better as
// one two-column row — e.g. Speed | Volume, Trim in | Trim out, Total dur | Playhead.
function DualField({
  leftLabel,
  left,
  rightLabel,
  right,
  reserveRightSlot = true,
}: {
  leftLabel?: string;
  left: ReactNode;
  rightLabel?: string;
  right: ReactNode;
  /** Preserve the standard 24px trailing-action column plus its 8px gap. */
  reserveRightSlot?: boolean;
}) {
  return (
    <div data-composa-dual-field data-reserve-right-slot={reserveRightSlot ? "true" : "false"} className="h-[48px] flex items-center gap-[8px] px-[16px]">
      <div className="flex-1 min-w-0 flex flex-col pt-[3px] pb-[4px]">
        {leftLabel && <span className={clsx(SUBLABEL, "mb-[3px]")}>{leftLabel}</span>}
        <div className="min-h-[24px] flex items-center">{left}</div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col pt-[3px] pb-[4px]">
        {rightLabel && <span className={clsx(SUBLABEL, "mb-[3px]")}>{rightLabel}</span>}
        <div className="min-h-[24px] flex items-center">{right}</div>
      </div>
      {reserveRightSlot && <span aria-hidden className="block w-[24px] shrink-0" />}
    </div>
  );
}

// ─── Small icon for panel use ─────────────────────────────────────────────────
const S = 16; // icon size in panel (24px button frame, 16px glyph = Figma inset)
const si = (n: number) => n; // alias for clarity

// Shared blend-mode menu (grouped + checkmark on current). Render fn → receives
// `close` from PopoverMenu. The full blend list (19 modes across 6 groups) is
// long, so the menu is capped at a fixed max-height and scrolls its overflow
// rather than growing unbounded (owner ask #504).
const BLEND_MENU_MAX_HEIGHT = 280;
function blendMenu(current: BlendMode, onPick: (m: BlendMode) => void, supported?: readonly BlendMode[]) {
  const isSupported = (m: BlendMode) => !supported || supported.includes(m);
  return (close: () => void) => (
    <Menu maxHeight={BLEND_MENU_MAX_HEIGHT}>
      {BLEND_GROUPS.map((group, gi) => (
        <Fragment key={gi}>
          {gi > 0 && <MenuRow type="divider" />}
          {group.map(m => {
            // Modes the host engine can't apply yet are shown (Figma-parity full
            // list) but disabled, so selecting one never silently no-ops.
            const enabled = isSupported(m);
            return (
              <MenuRow
                key={m}
                type="checkmark"
                label={m}
                checked={current === m}
                disabled={!enabled}
                disabledReason={enabled ? undefined : "Not supported yet"}
                onClick={enabled ? () => { onPick(m); close(); } : undefined}
              />
            );
          })}
        </Fragment>
      ))}
    </Menu>
  );
}

// ─── Shared W/H sizing controls ─────────────────────────────────────────────

export interface SizingComboFieldProps {
  axis: ElementSizingAxis;
  value: number;
  mode: ElementSizingMode;
  /** Sizing MODE (Fixed/Hug/Fill) is mixed across the selection — shows the "Mixed" mode chip. */
  mixed?: boolean;
  /** Resolved numeric VALUE differs across the selection while the mode is uniform —
   *  shows the "Mixed" placeholder inside the value field; typing commits to all. */
  valueMixed?: boolean;
  availableModes?: ElementSizingMode[];
  minValue?: number;
  maxValue?: number;
  variablesEnabled?: boolean;
  onApplyVariable?: () => void;
  onValueChange?: (value: number) => void;
  onSizingChange?: (change: ElementSizingChange) => void;
  onConstraintChange?: (constraint: ElementSizingConstraint, value: number | undefined) => void;
  /** Motion mode: drop the sizing-mode combo and show the value + keyframe diamond. */
  keyframe?: { active: boolean; onToggle: () => void };
}

export function getSizingMenuLabels({
  axis, value, availableModes = ["fixed", "hug", "fill"], minValue, maxValue, variablesEnabled = false,
}: Pick<SizingComboFieldProps, "axis" | "value" | "availableModes" | "minValue" | "maxValue" | "variablesEnabled">): string[] {
  const noun = axis;
  return [
    ...(availableModes.includes("fixed") ? [`Fixed ${noun} (${formatNumericDisplay(value)})`] : []),
    ...(availableModes.includes("hug") ? ["Hug contents"] : []),
    ...(availableModes.includes("fill") ? ["Fill container"] : []),
    ...(minValue === undefined ? [`Add min ${noun}`] : []),
    ...(maxValue === undefined ? [`Add max ${noun}`] : []),
    ...(variablesEnabled ? ["Apply variable"] : []),
  ];
}

export function SizingComboField({
  axis, value, mode, mixed = false, valueMixed = false, availableModes = ["fixed", "hug", "fill"],
  minValue, maxValue, variablesEnabled = false, onValueChange, onSizingChange, onConstraintChange, onApplyVariable, keyframe,
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
  const modeIcons: Record<ElementSizingMode, ReactNode> = {
    fixed: <SizingFixedIcon data-icon-semantic="sizing-fixed" size={14} strokeWidth={1.5} />,
    hug: <SizingHugIcon data-icon-semantic="sizing-hug" size={14} strokeWidth={1.5} />,
    fill: <SizingFillIcon data-icon-semantic="sizing-fill" size={14} strokeWidth={1.5} />,
  };
  const menu = (close: () => void) => (
    <Menu>
      {availableModes.includes("fixed") && <MenuRow type="checkmark" leading={modeIcons.fixed} label={`Fixed ${axis} (${formatNumericDisplay(value)})`} checked={!mixed && mode === "fixed"} onClick={() => { emitMode("fixed"); close(); }} />}
      {availableModes.includes("hug") && <MenuRow type="checkmark" leading={modeIcons.hug} label="Hug contents" checked={!mixed && mode === "hug"} onClick={() => { emitMode("hug"); close(); }} />}
      {availableModes.includes("fill") && <MenuRow type="checkmark" leading={modeIcons.fill} label="Fill container" checked={!mixed && mode === "fill"} onClick={() => { emitMode("fill"); close(); }} />}
      <MenuRow type="divider" />
      {/* Set to current {axis}: snapshots the layer's current rendered dimension
          (the resolved `value`) into an authored Fixed dimension via the shared
          typed sizing mutation. Checkmark row so its label shares the reserved
          check + semantic-icon gutters with the mode rows. */}
      {availableModes.includes("fixed") && <MenuRow type="checkmark" leading={<Ruler size={14} strokeWidth={1.5} />} label={`Set to current ${axis}`} onClick={() => { emitMode("fixed"); close(); }} />}
      {(minValue === undefined || maxValue === undefined) && <MenuRow type="divider" />}
      {minValue === undefined && <MenuRow type="checkmark" leading={<Minimize2 size={14} strokeWidth={1.5} />} label={`Add min ${axis}`} onClick={() => { onConstraintChange?.("min", initialMin); close(); }} />}
      {maxValue === undefined && <MenuRow type="checkmark" leading={<Maximize2 size={14} strokeWidth={1.5} />} label={`Add max ${axis}`} onClick={() => { onConstraintChange?.("max", initialMax); close(); }} />}
      {variablesEnabled && <><MenuRow type="divider" /><MenuRow type="simple" label="Apply variable" disabled={!onApplyVariable} onClick={onApplyVariable ? () => { onApplyVariable(); close(); } : undefined} /></>}
    </Menu>
  );
  if (keyframe && !mixed && mode === "fixed") {
    // Motion mode: value + keyframe diamond (the sizing-mode combo is dropped —
    // a keyframed fixed dimension is numeric, matching Figma's motion inspector).
    // Relative Hug/Fill axes stay visibly relative until the user edits their
    // resolved value, which atomically converts that axis to Fixed.
    return <NumericInput
      ariaLabel={axisLabel}
      iconLead={<span className={FONT}>{axis === "width" ? "W" : "H"}</span>}
      value={value} onChange={emitValue} min={1}
      mixed={valueMixed}
      keyframe={keyframe}
    />;
  }
  return <NumericComboInput
    dataMode={mixed ? "mixed" : mode}
    ariaLabel={axisLabel}
    dropdownAriaLabel={`${axisLabel} sizing mode: ${mixed ? "Mixed" : modeLabel ?? "Fixed"}`}
    idleLabel={modeLabel}
    iconLead={<span className={FONT}>{axis === "width" ? "W" : "H"}</span>}
    value={value}
    onChange={emitValue}
    mixed={valueMixed}
    min={0}
    menu={menu}
    className="w-full"
  />;
}

export interface DimensionSizingFieldsProps {
  width: number; height: number;
  widthMode?: ElementSizingMode; heightMode?: ElementSizingMode;
  widthMixed?: boolean; heightMixed?: boolean;
  /** Numeric W/H value differs across the selection (mode uniform) — "Mixed" placeholder. */
  widthValueMixed?: boolean; heightValueMixed?: boolean;
  availableWidthModes?: ElementSizingMode[]; availableHeightModes?: ElementSizingMode[];
  minWidth?: number; minHeight?: number; maxWidth?: number; maxHeight?: number;
  minWidthMixed?: boolean; minHeightMixed?: boolean; maxWidthMixed?: boolean; maxHeightMixed?: boolean;
  variablesEnabled?: boolean;
  onWidthChange?: (value: number) => void; onHeightChange?: (value: number) => void;
  onSizingChange?: (axis: ElementSizingAxis, change: ElementSizingChange) => void;
  onConstraintChange?: (axis: ElementSizingAxis, constraint: ElementSizingConstraint, value: number | undefined) => void;
  onApplySizingVariable?: (axis: ElementSizingAxis) => void;
  /** Motion mode: width/height become value + keyframe diamond (diamond on the H field). */
  dimensionsKeyframe?: { active: boolean; onToggle: () => void };
  /** Per-bound motion bindings. Omitted bounds render no field and therefore no diamond. */
  constraintKeyframes?: Partial<Record<"minWidth" | "maxWidth" | "minHeight" | "maxHeight", InspectorKeyframeControl>>;
}

export interface SpatialSelectionLayoutControl {
  axis: "x" | "y";
  gap: number;
  onGapChange?: (value: number) => void;
  onAddAutoLayout?: () => void;
}

function SpatialSelectionLayoutFields({ value }: { value?: SpatialSelectionLayoutControl }) {
  if (!value) return null;
  const horizontal = value.axis === "x";
  return <>
    <PanelFieldRow
      label="Spacing"
      left={<NumericInput
        ariaLabel={horizontal ? "Horizontal spacing gap" : "Vertical spacing gap"}
        iconLead={<AutoLayoutSpacingIcon kind="gap" axis={horizontal ? "horizontal" : "vertical"} />}
        value={value.gap}
        min={0}
        step={1}
        commitOnBlur
        onChange={value.onGapChange}
      />}
      right={<span aria-hidden />}
    />
    {value.onAddAutoLayout && <PanelFullRow height={32}>
      <Button label="Add auto layout" variant="Secondary" size="wide" onClick={value.onAddAutoLayout} />
    </PanelFullRow>}
  </>;
}

/**
 * The value the opposite axis must take to preserve the current width:height
 * ratio. Returns undefined when there is no ratio to preserve (a non-finite or
 * non-positive current dimension), so a locked lock can never emit NaN or 0.
 */
export function lockedAspectCounterpart(axis: ElementSizingAxis, nextValue: number, width: number, height: number): number | undefined {
  if (![nextValue, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return undefined;
  const paired = nextValue * (axis === "width" ? height / width : width / height);
  return Number.isFinite(paired) ? paired : undefined;
}

/**
 * The glyph for a chain-link aspect toggle, given whether the axes are CURRENTLY
 * locked.
 *
 * The owner's mapping, stated twice and still not honoured before this: a
 * SLASHED link (`Link2Off`, the one lucide draws a 2,2→22,22 line across) means
 * the two axes are locked RIGHT NOW, and pressing it breaks the link. An
 * unslashed link (`Link2`) means they are free right now, and pressing it joins
 * them. i.e. the icon reports the CURRENT state, not the action — the inverse of
 * the "icon shows what you will get" reading a previous pass applied.
 *
 * This lives in exactly one place because the inspector has two of these
 * toggles (Dimensions and Scale). They were written out separately and would
 * otherwise drift, leaving one chain-link contradicting the other in the same
 * panel. `active` on the button follows the same truth: active === locked.
 */
export function aspectLockIcon(locked: boolean) {
  return locked
    ? <Link2Off size={16} strokeWidth={1.5} />
    : <Link2 size={16} strokeWidth={1.5} />;
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
  const emitSizing = (axis: ElementSizingAxis, change: ElementSizingChange) => {
    if (!controlledSizing) {
      if (axis === "width") setLocalWidthMode(change.mode); else setLocalHeightMode(change.mode);
      if (change.value !== undefined) (axis === "width" ? props.onWidthChange : props.onHeightChange)?.(change.value);
    }
    props.onSizingChange?.(axis, change);
  };
  const widthMode = controlledSizing ? props.widthMode ?? "fixed" : localWidthMode;
  const heightMode = controlledSizing ? props.heightMode ?? "fixed" : localHeightMode;
  const changeSizing = (axis: ElementSizingAxis, change: ElementSizingChange) => {
    emitSizing(axis, change);
    // Aspect lock. The chain-link button used to do nothing but swap its own
    // icon, so a locked circle kept its height when you changed its width
    // (Composa#661 item 5). A fixed value on one axis now drives the other
    // through the SAME emit path, preserving the ratio of the two values
    // currently shown. Deliberately skipped when the other axis is relative
    // (Hug/Fill) — a lock must not silently convert an authored relative axis
    // to Fixed — and when either side is Mixed, where there is no one ratio.
    if (!lockAspect || change.mode !== "fixed" || change.value === undefined) return;
    if (props.widthMixed || props.heightMixed || props.widthValueMixed || props.heightValueMixed) return;
    const other: ElementSizingAxis = axis === "width" ? "height" : "width";
    if ((other === "width" ? widthMode : heightMode) !== "fixed") return;
    const paired = lockedAspectCounterpart(axis, change.value, props.width, props.height);
    if (paired === undefined) return;
    emitSizing(other, { mode: "fixed", value: paired });
  };
  const constraintRows = [
    [
      ["min", "width", "Min width", values.minWidth, props.minWidthMixed],
      ["min", "height", "Min height", values.minHeight, props.minHeightMixed],
    ],
    [
      ["max", "width", "Max width", values.maxWidth, props.maxWidthMixed],
      ["max", "height", "Max height", values.maxHeight, props.maxHeightMixed],
    ],
  ] as const;
  // Pack only the ACTIVE constraint fields, in canonical order
  // (min-width · min-height · max-width · max-height), two per grid row, so a
  // sparse set never leaves an empty canonical position. e.g. Min width + Max
  // height active → they pack side-by-side in a single row instead of straddling
  // two rows with holes. Labels stay explicit so packing never hides an axis/bound.
  const activeConstraints = constraintRows.flat().filter(([, , , value, mixed]) => value !== undefined || mixed);
  const hasConstraints = activeConstraints.length > 0;
  const packedConstraintRows: (typeof activeConstraints)[] = [];
  for (let i = 0; i < activeConstraints.length; i += 2) packedConstraintRows.push(activeConstraints.slice(i, i + 2));
  return <>
    <PanelFieldRow
      label="Dimensions"
      left={<SizingComboField axis="width" value={props.width} mode={widthMode} mixed={props.widthMixed} valueMixed={props.widthValueMixed} availableModes={props.availableWidthModes} minValue={values.minWidth} maxValue={values.maxWidth} variablesEnabled={props.variablesEnabled} onSizingChange={change => changeSizing("width", change)} onConstraintChange={(constraint, value) => changeConstraint("width", constraint, value)} onApplyVariable={props.onApplySizingVariable ? () => props.onApplySizingVariable?.("width") : undefined} keyframe={props.dimensionsKeyframe} />}
      right={<SizingComboField axis="height" value={props.height} mode={heightMode} mixed={props.heightMixed} valueMixed={props.heightValueMixed} availableModes={props.availableHeightModes} minValue={values.minHeight} maxValue={values.maxHeight} variablesEnabled={props.variablesEnabled} onSizingChange={change => changeSizing("height", change)} onConstraintChange={(constraint, value) => changeConstraint("height", constraint, value)} onApplyVariable={props.onApplySizingVariable ? () => props.onApplySizingVariable?.("height") : undefined} keyframe={props.dimensionsKeyframe} />}
      rightAction={<PanelActionBtn icon={aspectLockIcon(lockAspect)} label="Lock aspect ratio" selected={lockAspect} onClick={() => setLockAspect(value => !value)} />}
    />
    {hasConstraints && <div className="flex flex-col gap-y-[6px] px-[16px] pb-[8px]">
      {packedConstraintRows.map((row, rowIndex) => <div key={rowIndex} className="flex items-end gap-[8px]">
        {row.map(([constraint, axis, label, value, mixed]) => {
          const key = `${constraint}${axis === "width" ? "Width" : "Height"}` as "minWidth" | "maxWidth" | "minHeight" | "maxHeight";
          return <div key={`${constraint}-${axis}`} className="flex-1 min-w-0">
            <div className={clsx(SUBLABEL, "mb-[3px]")}>{label}</div>
            <NumericComboInput
              dataMode="constraint"
              ariaLabel={label}
              dropdownAriaLabel={`${label} options`}
              value={value}
              defaultValue={0}
              mixed={mixed}
              keyframe={props.constraintKeyframes?.[key]}
              onChange={next => changeConstraint(axis, constraint, next)}
              min={constraint === "max" ? (axis === "width" ? values.minWidth : values.minHeight) ?? 0 : 0}
              max={constraint === "min" ? (axis === "width" ? values.maxWidth : values.maxHeight) : undefined}
              menu={close => <Menu>
                <MenuRow
                  type="checkmark"
                  leading={<Minus size={14} strokeWidth={1.5} />}
                  label={`Remove ${constraint} ${axis}`}
                  onClick={() => { changeConstraint(axis, constraint, undefined); close(); }}
                />
              </Menu>}
              className="w-full"
            />
          </div>;
        })}
        {/* Keep a lone trailing field at half width so packed rows share the
            two-column geometry; this is a layout spacer, not a canonical hole. */}
        {row.length === 1 && <div aria-hidden className="flex-1 min-w-0" />}
        <div aria-hidden className="shrink-0 w-[24px]" />
      </div>)}
    </div>}
  </>;
}

const TEXT_SIZING_LABELS: Record<TextSizingMode, string> = {
  "auto-width": "Auto width",
  "auto-height": "Auto height",
  "fixed-size": "Fixed size",
};

// Icon segments for the text-resizing control (owner ask: icons, not text
// labels). Owner-specified glyphs, updated to the exact Lucide icons he linked:
//   auto-width  → an arrow-from-a-line glyph               (ArrowRightFromLine)
//   auto-height → text bounded by two vertical rules       (text-margins, lucide#4610)
//   fixed-size  → a solid text box                          (square-text, lucide#4609)
// text-margins / square-text aren't in lucide-react yet, so they render via the
// proposed-lucide shims (auto-replaced on upstream merge). Word labels are kept
// as each segment's ariaLabel for accessibility.
const TEXT_SIZING_ICONS: Record<TextSizingMode, ReactNode> = {
  "auto-width": <ArrowRightFromLine size={16} strokeWidth={1.5} />,
  "auto-height": <ProposedTextMargins size={16} strokeWidth={1.5} />,
  "fixed-size": <ProposedSquareText size={16} strokeWidth={1.5} />,
};

function TextSizingModeField({
  value,
  availableModes = ["auto-width", "auto-height", "fixed-size"],
  disabled = false,
  onChange,
}: {
  value?: TextSizingMode | "mixed";
  availableModes?: readonly TextSizingMode[];
  disabled?: boolean;
  onChange?: (mode: TextSizingMode) => void;
}) {
  // Persistent mode selection → segmented control (property-panel.md §Segmented:
  // "2–5 mutually exclusive inline options … used for persistent mode selection").
  // "mixed" (or no value yet) shows no active segment, matching the DS mixed rule.
  // PanelSegmentedRow, not PanelFieldRow: this row used to opt out of the
  // trailing 24px slot, so the control ran to the panel edge with nowhere left
  // for a per-row icon and out of line with every other row's right gutter
  // (Composa#661 item 6). The row type no longer accepts that opt-out.
  return (
    <PanelSegmentedRow
      label="Text resizing"
      left={
        <SegmentedControl
          className="w-full"
          ariaLabel="Text resizing"
          segments={availableModes.map(mode => ({
            value: mode,
            icon: TEXT_SIZING_ICONS[mode],
            ariaLabel: TEXT_SIZING_LABELS[mode],
          }))}
          value={value === "mixed" || value === undefined ? "" : value}
          onChange={next => onChange?.(next as TextSizingMode)}
          disabled={disabled || !onChange}
        />
      }
    />
  );
}

// ─── Inspector keyframe affordance ────────────────────────────────────────────
// Per-property keyframe diamond shown in the Design tab, matching the timeline's
// own keyframe stepper (Timeline.tsx). Present ONLY when the host supplies a
// control (the host gates this on the slide-local timeline being active). Filled
// = a keyframe exists at the current playhead; hollow = none. Click toggles.

export interface InspectorKeyframeControl { active: boolean; onToggle: () => void; }
export interface InspectorKeyframeControls {
  position?: InspectorKeyframeControl;
  scale?: InspectorKeyframeControl;
  rotation?: InspectorKeyframeControl;
  opacity?: InspectorKeyframeControl;
  dimensions?: InspectorKeyframeControl;
  /** Uniform scalar corner radius. */
  cornerRadius?: InspectorKeyframeControl;
  /** Physical independent-corner lanes, shown only on the four expanded fields. */
  cornerRadiusTopLeft?: InspectorKeyframeControl;
  cornerRadiusTopRight?: InspectorKeyframeControl;
  cornerRadiusBottomRight?: InspectorKeyframeControl;
  cornerRadiusBottomLeft?: InspectorKeyframeControl;
  /** Fixed Auto-layout item gap. Omitted while the gap is Auto. */
  layoutGap?: InspectorKeyframeControl;
  /** Wrapped Auto-layout row gap. */
  layoutCounterGap?: InspectorKeyframeControl;
  /** Grid column and row gaps. */
  gridColumnGap?: InspectorKeyframeControl;
  gridRowGap?: InspectorKeyframeControl;
  /** Stable track-id keyed controls. Hosts expose entries only for Fixed tracks. */
  gridTrackSizes?: Record<string, InspectorKeyframeControl>;
  /** Physical Auto-layout padding edges. Aggregate Vertical/Horizontal controls
   * intentionally expose no diamond because each edge owns an independent lane. */
  paddingTop?: InspectorKeyframeControl;
  paddingRight?: InspectorKeyframeControl;
  paddingBottom?: InspectorKeyframeControl;
  paddingLeft?: InspectorKeyframeControl;
  /** Continuous numeric typography values. */
  fontWeight?: InspectorKeyframeControl;
  fontSize?: InspectorKeyframeControl;
  lineHeight?: InspectorKeyframeControl;
  letterSpacing?: InspectorKeyframeControl;
  /** Authored Min/Max bounds. Hosts supply these only while the corresponding
   * bound exists, so sizing menus never imply an aggregate animation track. */
  minWidth?: InspectorKeyframeControl;
  maxWidth?: InspectorKeyframeControl;
  minHeight?: InspectorKeyframeControl;
  maxHeight?: InspectorKeyframeControl;
}

// ─── Section: Position ────────────────────────────────────────────────────────

export type ElementAlignmentAction =
  | "left" | "center-x" | "right"
  | "top" | "center-y" | "bottom"
  // Overflow ("More alignment") actions for a multi-selection.
  | "distribute-horizontal" | "distribute-vertical"
  | "tidy-up";

interface PositionSectionProps {
  x?: number; y?: number; rotation?: number;
  /** Multi-select with differing values renders the field's "Mixed" state; edits still commit to all. */
  xMixed?: boolean; yMixed?: boolean; rotationMixed?: boolean;
  scaleX?: number; scaleY?: number;
  onXChange?: (v: number) => void;
  onYChange?: (v: number) => void;
  onRotationChange?: (v: number) => void;
  onRotate90Clockwise?: () => void;
  onFlipHorizontal?: () => void;
  onFlipVertical?: () => void;
  onScaleXChange?: (v: number) => void;
  onScaleYChange?: (v: number) => void;
  positioning?: "auto" | "absolute";
  positioningApplicable?: boolean;
  onPositioningChange?: (value: "auto" | "absolute") => void;
  onAlignmentAction?: (action: ElementAlignmentAction) => void;
  multiSelect?: boolean;
  positionKeyframe?: InspectorKeyframeControl;
  scaleKeyframe?: InspectorKeyframeControl;
  rotationKeyframe?: InspectorKeyframeControl;
  scaleApplicable?: boolean;
  positionPresentation?: PositionPresentation;
  onPositionPresentationChange?: (presentation: PositionPresentation) => void;
}

function PositionSection({
  x = 0, y = 0, rotation = 0,
  xMixed = false, yMixed = false, rotationMixed = false,
  scaleX = 100, scaleY = 100,
  onXChange, onYChange, onRotationChange, onRotate90Clockwise, onFlipHorizontal, onFlipVertical, onScaleXChange, onScaleYChange,
  positioning, positioningApplicable, onPositioningChange, onAlignmentAction,
  multiSelect = false,
  positionKeyframe, scaleKeyframe, rotationKeyframe, scaleApplicable = false,
  positionPresentation = "separate", onPositionPresentationChange,
}: PositionSectionProps) {
  // These icon-only actions carry a hover tooltip (Composa DS gap) mirroring their
  // aria-label, so sighted users get the same hint assistive tech already had.
  const hAlignBtns: IconBtn[] = [
    { icon: <AlignLeftIcon data-icon-semantic="align-left" size={S} strokeWidth={1.5} />, label: "Align left", tooltip: "Align left", onClick: () => onAlignmentAction?.("left") },
    { icon: <AlignCenterXIcon data-icon-semantic="align-center-x" size={S} strokeWidth={1.5} />, label: "Align center", tooltip: "Align center", onClick: () => onAlignmentAction?.("center-x") },
    { icon: <AlignRightIcon data-icon-semantic="align-right" size={S} strokeWidth={1.5} />, label: "Align right", tooltip: "Align right", onClick: () => onAlignmentAction?.("right") },
  ];
  const vAlignBtns: IconBtn[] = [
    { icon: <AlignTopIcon data-icon-semantic="align-top" size={S} strokeWidth={1.5} />, label: "Align top", tooltip: "Align top", onClick: () => onAlignmentAction?.("top") },
    { icon: <AlignCenterYIcon data-icon-semantic="align-center-y" size={S} strokeWidth={1.5} />, label: "Align middle", tooltip: "Align middle", onClick: () => onAlignmentAction?.("center-y") },
    { icon: <AlignBottomIcon data-icon-semantic="align-bottom" size={S} strokeWidth={1.5} />, label: "Align bottom", tooltip: "Align bottom", onClick: () => onAlignmentAction?.("bottom") },
  ];
  const rotateBtns: IconBtn[] = [
    { icon: <RotateCw       size={S} strokeWidth={1.5} />, label: "Rotate 90° CW", tooltip: "Rotate 90° CW", onClick: onRotate90Clockwise ?? (onRotationChange ? () => onRotationChange(rotation + 90) : undefined) },
    { icon: <FlipHorizontal2 size={S} strokeWidth={1.5} />, label: "Flip horizontal", tooltip: "Flip horizontal", onClick: onFlipHorizontal },
    { icon: <FlipVertical2   size={S} strokeWidth={1.5} />, label: "Flip vertical", tooltip: "Flip vertical", onClick: onFlipVertical },
  ];
  // Scale aspect-lock (Figma Motion scale row's trailing ⊡). When locked, the two
  // axes scale uniformly. Kept in one edit session by NumericEditSessionProvider.
  const [scaleLocked, setScaleLocked] = useState(true);
  const emitScaleX = (value: number) => { onScaleXChange?.(value); if (scaleLocked) onScaleYChange?.(value); };
  const emitScaleY = (value: number) => { onScaleYChange?.(value); if (scaleLocked) onScaleXChange?.(value); };

  return (
    <PanelSection
      title="Position"
      rightActions={positioningApplicable === false ? undefined :
        <PanelActionBtn icon={<AbsolutePositionIcon data-icon-semantic="absolute-position" size={16} strokeWidth={1.5} />}
          label={positioning === "absolute" ? "Use auto layout" : "Ignore auto layout"}
          tooltip={positioning === "absolute" ? "Use auto layout" : "Ignore auto layout"}
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
          ? <PopoverMenu
              align="right"
              trigger={<PanelActionBtn icon={<MoreHorizontal size={16} strokeWidth={1.5} />} label="More alignment" />}
            >
              {close => <Menu>
                <MenuRow
                  type="simple"
                  leading={<DistributeHorizontalIcon data-icon-semantic="distribute-horizontal" size={14} strokeWidth={1.5} />}
                  label="Distribute horizontal spacing"
                  disabled={!onAlignmentAction}
                  onClick={onAlignmentAction ? () => { onAlignmentAction("distribute-horizontal"); close(); } : undefined}
                />
                <MenuRow
                  type="simple"
                  leading={<DistributeVerticalIcon data-icon-semantic="distribute-vertical" size={14} strokeWidth={1.5} />}
                  label="Distribute vertical spacing"
                  disabled={!onAlignmentAction}
                  onClick={onAlignmentAction ? () => { onAlignmentAction("distribute-vertical"); close(); } : undefined}
                />
                <MenuRow type="divider" />
                <MenuRow
                  type="simple"
                  leading={<TidyUpIcon data-icon-semantic="tidy-up" size={14} strokeWidth={1.5} />}
                  label="Tidy up"
                  disabled={!onAlignmentAction}
                  onClick={onAlignmentAction ? () => { onAlignmentAction("tidy-up"); close(); } : undefined}
                />
              </Menu>}
            </PopoverMenu>
          : undefined}
      />
      {/* Position topology is presentation-only. A combined row never implies
          independent X/Y timing tracks — and neither does a separate row, so BOTH
          separated fields carry the diamond and both drive the one position
          keyframe. Only Y had one, which read as "X cannot be keyframed"
          (Composa#661 item 4). */}
      {positionPresentation === "combined" ? (
        <PanelFieldRow
          label="Position"
          left={
            <NumericPairInput
              a={{ ariaLabel: "Position X", iconLead: <span className={clsx(FONT, "text-[11px] font-normal")}>X</span>, value: x, onChange: onXChange, defaultValue: 0, mixed: xMixed }}
              b={{ ariaLabel: "Position Y", iconLead: <span className={clsx(FONT, "text-[11px] font-normal")}>Y</span>, value: y, onChange: onYChange, defaultValue: 0, mixed: yMixed }}
              keyframe={positionKeyframe}
            />
          }
          rightAction={onPositionPresentationChange
            ? <PanelActionBtn
                icon={<Link2Off size={16} strokeWidth={1.5} />}
                label="Combine position dimensions"
                tooltip="Separate dimensions"
                selected
                onClick={() => onPositionPresentationChange("separate")}
              />
            : undefined}
        />
      ) : (
        <PanelFieldRow
          label="Position"
          left={<NumericInput ariaLabel="Position X" iconLead={<span className={clsx(FONT, "text-[11px] font-normal")}>X</span>} value={x} onChange={onXChange} defaultValue={0} mixed={xMixed} keyframe={positionKeyframe} />}
          right={<NumericInput ariaLabel="Position Y" iconLead={<span className={clsx(FONT, "text-[11px] font-normal")}>Y</span>} value={y} onChange={onYChange} defaultValue={0} mixed={yMixed} keyframe={positionKeyframe} />}
          // The separate branch used to render NO rightAction, so pressing
          // "Separate dimensions" destroyed the only control that could undo it —
          // the trip was one-way for the rest of the session. The mirror action
          // costs no layout: PanelFieldRow reserves the 24px right slot either
          // way, so the affordance was literally a hole. Gated on the same
          // callback the combined branch is, which is how a host that FORCES
          // separation (the master view) keeps the row from offering a combine it
          // would not honour.
          rightAction={onPositionPresentationChange
            ? <PanelActionBtn
                icon={<Link2 size={16} strokeWidth={1.5} />}
                label="Combine position dimensions"
                tooltip="Combine dimensions"
                selected={false}
                onClick={() => onPositionPresentationChange("combined")}
              />
            : undefined}
        />
      )}

      {/* Scale — combined [X | Y | ◇] field + aspect-lock (Figma Motion scale row).
          % of the object's base size. Present when the host marks it applicable. */}
      {scaleApplicable && (
        <PanelFieldRow
          label="Scale"
          left={
            <NumericPairInput
              a={{ ariaLabel: "Scale X", iconLead: <MoveHorizontal size={16} strokeWidth={1.5} />, value: scaleX, onChange: emitScaleX, min: 0, suffix: "%", defaultValue: 100 }}
              b={{ ariaLabel: "Scale Y", iconLead: <MoveVertical size={16} strokeWidth={1.5} />, value: scaleY, onChange: emitScaleY, min: 0, suffix: "%", defaultValue: 100 }}
              keyframe={scaleKeyframe}
            />
          }
          rightAction={<PanelActionBtn icon={aspectLockIcon(scaleLocked)} label="Lock scale aspect ratio" selected={scaleLocked} onClick={() => setScaleLocked(value => !value)} />}
        />
      )}

      {/* Rotation — single-column value (with its keyframe diamond) in the left column;
          the flip/rotate segmented control is PRESERVED in the right column (Composa#319:
          Figma keeps rotation half-width; we keep our flip actions beside it). */}
      <PanelFieldRow
        label="Rotation"
        left={
          <NumericInput
            ariaLabel="Rotation"
            iconLead={<RotationIcon data-icon-semantic="rotation" size={16} strokeWidth={1.5} />}
            value={rotation} onChange={onRotationChange} min={-360} max={360}
            mixed={rotationMixed}
            keyframe={rotationKeyframe}
          />
        }
        right={<IconButtonRow buttons={rotateBtns} fill />}
      />

    </PanelSection>
  );
}

// ─── Layout flow (shared by the Frame / Auto-layout / Grid sections) ─────────

/** The four mutually exclusive layout modes the Flow control selects between. */
type FlowValue = "none" | "v" | "h" | "grid";

// Flow is one four-way layout-mode selector (Composa#661): Freeform, Vertical,
// Horizontal, Grid. Grid is a peer mode, not a side action reached from a header
// button — every frame section renders the same segments so the selected mode is
// always visible and reversible. Wrap is deliberately NOT a segment: it is a
// modifier that rides alongside the selected flow.
const FLOW_SEGMENTS: IconBtn[] = [
  { icon: <LayoutFreeformIcon data-icon-semantic="layout-freeform" size={S} strokeWidth={1.5} />, label: "Freeform", value: "none" },
  { icon: <LayoutVerticalIcon data-icon-semantic="layout-vertical" size={S} strokeWidth={1.5} />, label: "Vertical", value: "v" },
  { icon: <LayoutHorizontalIcon data-icon-semantic="layout-horizontal" size={S} strokeWidth={1.5} />, label: "Horizontal", value: "h" },
  { icon: <LayoutGridIcon data-icon-semantic="layout-grid" size={S} strokeWidth={1.5} />, label: "Grid", value: "grid" },
];

const flowSegments = FLOW_SEGMENTS.map(segment => ({ value: segment.value!, icon: segment.icon, ariaLabel: segment.label }));

// ─── Section: Layout — Frame (no auto-layout) ─────────────────────────────────

interface LayoutFrameProps {
  width?: number; height?: number;
  cornerRadius?: number;
  clipContent?: boolean;
  onWidthChange?: (v: number) => void;
  onHeightChange?: (v: number) => void;
  sizing?: Omit<DimensionSizingFieldsProps, "width" | "height" | "onWidthChange" | "onHeightChange">;
  onClipContentChange?: (value: boolean) => void;
  onResizeToFit?: () => void;
  /** Auto-layout is reached from here two ways: the "+" button, or moving Flow
   * off its first ("Freeform") option. Both call this. */
  /** Omitted mode means the generic header toggle; hosts may infer from geometry. */
  onEnableAutoLayout?: (mode?: "vertical" | "horizontal") => void;
  /** Grid is the fourth Auto-layout flow mode. */
  onEnableGrid?: () => void;
  spatialSelectionLayout?: SpatialSelectionLayoutControl;
}

function LayoutFrameSection({
  width = 0, height = 0, cornerRadius = 0,
  clipContent = false,
  onWidthChange, onHeightChange, onClipContentChange,
  sizing,
  onEnableAutoLayout,
  onEnableGrid,
  onResizeToFit,
  spatialSelectionLayout,
}: LayoutFrameProps) {
  // Plain frame defaults to Freeform (no auto-layout yet) — NOT "v", which would
  // already imply vertical auto-layout while this is the "no auto-layout" section.
  const [flow, setFlow] = useState<FlowValue>("none");

  const handleFlowChange = (v: string) => {
    setFlow(v as FlowValue);
    // Grid is entered from Flow; there is no separate Add Grid action.
    if (v === "grid") { onEnableGrid?.(); return; }
    if (v === "v" || v === "h") onEnableAutoLayout?.(v === "h" ? "horizontal" : "vertical");
  };

  return (
    <PanelSection
      title="Layout"
      rightActions={
        <>
          <PanelActionBtn icon={<ResizeToFitIcon data-icon-semantic="resize-to-fit" size={16} strokeWidth={1.5} />} label="Resize to fit" disabled={!onResizeToFit} onClick={onResizeToFit} />
          {/* Trailing header toggle, OFF face (Composa#661 item 4): panel-plus.
              A bare Plus read as a generic "add" rather than the off state of the
              auto-layout toggle whose on face lives in the Auto layout section. */}
          <PanelActionBtn icon={<AutoLayoutAddIcon data-icon-semantic="auto-layout-add" size={16} strokeWidth={1.5} />} label="Add auto-layout" onClick={onEnableAutoLayout} />
        </>
      }
    >
      {/* Flow */}
      <PanelSegmentedRow
        label="Flow"
        left={<SegmentedControl segments={flowSegments} value={flow} onChange={handleFlowChange} className="w-full" />}
      />

      <DimensionSizingFields width={width} height={height} onWidthChange={onWidthChange} onHeightChange={onHeightChange} {...sizing} />
      <SpatialSelectionLayoutFields value={spatialSelectionLayout} />

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
  wrap?: boolean;
  rowGap?: number | "auto";
  grid?: ElementGridSettings;
  widthMode?: "fixed" | "hug" | "fill";
  heightMode?: "fixed" | "hug" | "fill";
  gap?: number | "auto";
  paddingTop?: number; paddingRight?: number;
  paddingBottom?: number; paddingLeft?: number;
  paddingTopMixed?: boolean; paddingRightMixed?: boolean;
  paddingBottomMixed?: boolean; paddingLeftMixed?: boolean;
  paddingDisabled?: boolean;
  alignValue?: string;
  clipContent?: boolean;
  textBaseline?: boolean;
  strokeSizing?: "excluded" | "included";
  canvasStacking?: "first-on-top" | "last-on-top";
  textBaselineMixed?: boolean;
  strokeSizingMixed?: boolean;
  canvasStackingMixed?: boolean;
  settingsBaselineApplicable?: boolean;
  settingsDisabled?: boolean;
  onLayoutChange?: (patch: Partial<ElementLayoutSettings>) => void;
  onPaddingChange?: (value: ElementLayoutSettings["padding"], changedEdges: readonly ElementPaddingEdge[]) => void;
  onAlignChange?: (value: string) => void;
  onClipContentChange?: (value: boolean) => void;
  onAutoLayoutSettingsRequest?: () => void;
  /** Switch this frame to the distinct Grid layout type (Reading A). */
  onEnableGrid?: () => void;
  /** Turn auto layout back off from the header toggle (Composa#661 item 4). */
  onDisableAutoLayout?: () => void;
  sizing?: Omit<DimensionSizingFieldsProps, "width" | "height" | "widthMode" | "heightMode">;
  spatialSelectionLayout?: SpatialSelectionLayoutControl;
  gapKeyframe?: InspectorKeyframeControl;
  rowGapKeyframe?: InspectorKeyframeControl;
  gridColumnGapKeyframe?: InspectorKeyframeControl;
  gridRowGapKeyframe?: InspectorKeyframeControl;
  gridTrackSizeKeyframes?: Record<string, InspectorKeyframeControl>;
  onAddGridTrack?: (axis: "row" | "column") => void;
  onGridAutomaticPositioningChange?: (enabled: boolean) => void;
  paddingTopKeyframe?: InspectorKeyframeControl;
  paddingRightKeyframe?: InspectorKeyframeControl;
  paddingBottomKeyframe?: InspectorKeyframeControl;
  paddingLeftKeyframe?: InspectorKeyframeControl;
}

export function reconcileAutoLayoutGap(
  wrap: boolean,
  gap: number | "auto",
  lastFixedGap: number,
): number | "auto" {
  // Auto item-gap distribution is unavailable while wrapping — fall back to the last fixed gap.
  return wrap && gap === "auto" ? lastFixedGap : gap;
}

function LayoutAutoSection({
  width = 240, height = 0,
  flowMode,
  wrap: wrapProp,
  rowGap: rowGapProp,
  grid,
  widthMode = "hug", heightMode = "fill",
  gap: gapProp,
  paddingTop = 16, paddingRight = 0, paddingBottom = 8, paddingLeft = 0,
  paddingTopMixed = false, paddingRightMixed = false, paddingBottomMixed = false, paddingLeftMixed = false,
  paddingDisabled = false,
  alignValue = "mc",
  clipContent = false,
  textBaseline = false,
  strokeSizing = "excluded",
  canvasStacking = "last-on-top",
  textBaselineMixed = false,
  strokeSizingMixed = false,
  canvasStackingMixed = false,
  settingsBaselineApplicable,
  settingsDisabled = false,
  onLayoutChange, onPaddingChange, onAlignChange, onClipContentChange, onAutoLayoutSettingsRequest, onEnableGrid, onDisableAutoLayout, sizing, spatialSelectionLayout,
  gapKeyframe, rowGapKeyframe, gridColumnGapKeyframe, gridRowGapKeyframe, gridTrackSizeKeyframes, onAddGridTrack, onGridAutomaticPositioningChange,
  paddingTopKeyframe, paddingRightKeyframe, paddingBottomKeyframe, paddingLeftKeyframe,
}: LayoutAutoProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const controlled = flowMode !== undefined;
  const [flow, setFlow] = useState<FlowValue>("v");
  const renderedFlow = flowMode === "horizontal" ? "h" : flowMode === "vertical" ? "v" : flowMode ?? flow;
  const [align, setAlign] = useState(alignValue);
  const renderedAlign = controlled ? alignValue : align;
  const gapControlled = gapProp !== undefined;
  const [internalGap, setInternalGap] = useState<number | "auto">(gapProp ?? 0);
  const renderedGap = gapControlled ? gapProp : internalGap;
  const [lastFixedGap, setLastFixedGap] = useState(typeof renderedGap === "number" ? renderedGap : 0);
  // Wrap is a horizontal-only modifier; the row gap is the wrapped cross-axis spacing.
  const wrapControlled = wrapProp !== undefined;
  const [internalWrap, setInternalWrap] = useState(!!wrapProp);
  const wrapping = renderedFlow === "h" && (wrapControlled ? !!wrapProp : internalWrap);
  const rowGapControlled = rowGapProp !== undefined;
  const [internalRowGap, setInternalRowGap] = useState<number | "auto">(rowGapProp ?? (typeof renderedGap === "number" ? renderedGap : 0));
  const renderedRowGap = rowGapControlled ? rowGapProp : internalRowGap;
  const [lastFixedRowGap, setLastFixedRowGap] = useState(typeof renderedRowGap === "number" ? renderedRowGap : 0);
  const [indivPadding, setIndivPadding] = useState(false);
  // Combined presentation owns two axes, not one all-sides scalar: Top is the
  // vertical source and Right is the horizontal source.
  const paddingSidesDiffer = paddingTop !== paddingBottom || paddingRight !== paddingLeft;
  const paddingHasMixedSide = paddingTopMixed || paddingRightMixed || paddingBottomMixed || paddingLeftMixed;
  // Animated padding is always presented as four physical edges. The combined
  // Vertical/Horizontal fields edit two values and therefore cannot truthfully
  // own one scalar track or diamond.
  const paddingKeyframesPresent = !!(paddingTopKeyframe || paddingRightKeyframe || paddingBottomKeyframe || paddingLeftKeyframe);
  const expandedPadding = indivPadding || paddingSidesDiffer || paddingHasMixedSide || paddingKeyframesPresent;
  const subLabel = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary mb-[3px]");

  // Freeform is the explicit "disable auto layout" action and remains distinct
  // from the trailing Auto-layout Settings entry point.
  const handleFlowChange = (v: string) => {
    setFlow(v as FlowValue);
    // Grid is a fourth Auto-layout flow mode, not a sibling section.
    if (v === "grid") { onEnableGrid?.(); return; }
    const mode = v === "h" ? "horizontal" : v === "v" ? "vertical" : "none";
    // Wrap only survives on Horizontal; leaving Horizontal clears it.
    const nextWrap = mode === "horizontal" ? (wrapControlled ? !!wrapProp : internalWrap) : false;
    const reconciledGap = reconcileAutoLayoutGap(nextWrap, renderedGap, lastFixedGap);
    const nextGap = reconciledGap === renderedGap ? undefined : reconciledGap;
    if (nextGap !== undefined && !gapControlled) setInternalGap(nextGap);
    onLayoutChange?.({ mode, ...(nextGap === undefined ? {} : { gap: nextGap }) });
  };

  const toggleWrap = () => {
    const next = !wrapping;
    if (!wrapControlled) setInternalWrap(next);
    // Entering wrap coerces an Auto item gap back to a fixed number.
    const reconciledGap = reconcileAutoLayoutGap(next, renderedGap, lastFixedGap);
    const gapPatch = reconciledGap === renderedGap ? {} : { gap: reconciledGap };
    if (!gapControlled && "gap" in gapPatch) setInternalGap(reconciledGap);
    onLayoutChange?.({ wrap: next, ...gapPatch });
  };

  // Item gap and row gap are independent (Composa#661 item 2). They used to be
  // yoked by a link toggle that sat, unlabelled, beside the row-gap field — an
  // unexplained control that also made typing in one field silently rewrite the
  // other. Each field now edits only its own axis.
  const emitGap = (value: number | "auto") => {
    if (!gapControlled) setInternalGap(value);
    if (typeof value === "number") setLastFixedGap(value);
    onLayoutChange?.({ gap: value });
  };

  const emitRowGap = (value: number | "auto") => {
    const next = value === "auto" ? value : Math.max(0, value);
    if (!rowGapControlled) setInternalRowGap(next);
    if (typeof next === "number") setLastFixedRowGap(next);
    onLayoutChange?.({ rowGap: next });
  };

  useEffect(() => {
    if (typeof gapProp === "number") setLastFixedGap(gapProp);
  }, [gapProp]);
  useEffect(() => {
    if (typeof rowGapProp === "number") setLastFixedRowGap(rowGapProp);
  }, [rowGapProp]);

  const gapMode = renderedGap === "auto" ? "auto" : "fixed";
  const rowGapMode = renderedRowGap === "auto" ? "auto" : "fixed";
  const gapAxis = renderedFlow === "v" ? "vertical" : "horizontal";
  const gapIcon = <AutoLayoutSpacingIcon kind="gap" axis={gapAxis} />;

  const gapMenu = (close: () => void) => (
    <Menu>
      <MenuRow
        type="checkmark"
        label="Fixed"
        checked={gapMode === "fixed"}
        onClick={() => { emitGap(lastFixedGap); close(); }}
      />
      {!wrapping && (
        <MenuRow
          type="checkmark"
          label="Auto"
          checked={gapMode === "auto"}
          onClick={() => { emitGap("auto"); close(); }}
        />
      )}
    </Menu>
  );
  const rowGapMenu = (close: () => void) => <Menu>
    <MenuRow type="checkmark" label="Fixed" checked={rowGapMode === "fixed"} onClick={() => { emitRowGap(lastFixedRowGap); close(); }} />
    <MenuRow type="checkmark" label="Auto" checked={rowGapMode === "auto"} onClick={() => { emitRowGap("auto"); close(); }} />
  </Menu>;

  const settingsValue = {
    mode: flowMode ?? (renderedFlow === "h" ? "horizontal" : renderedFlow === "v" ? "vertical" : renderedFlow === "grid" ? "grid" : "none"),
    textBaseline: textBaselineMixed ? "mixed" : textBaseline,
    strokeSizing: strokeSizingMixed ? "mixed" : strokeSizing,
    canvasStacking: canvasStackingMixed ? "mixed" : canvasStacking,
    baselineApplicable: settingsBaselineApplicable,
  } as const;
  const settingsTriggerButton = (
    <AutoLayoutSettingsDialog
      open={settingsOpen}
      value={settingsValue}
      disabled={settingsDisabled}
      trigger={<PanelActionBtn
        // Every settings entry point in the inspector (Type, Stroke, Template)
        // is the slider glyph; the auto-layout one used the Freeform *layout*
        // glyph, which read as another flow option (Composa#661 item 3).
        icon={<SettingsIcon data-icon-semantic="settings" size={16} strokeWidth={1.5} />}
        label="Auto-layout settings"
        disabled={settingsDisabled}
        onClick={settingsDisabled ? undefined : () => { setSettingsOpen(true); onAutoLayoutSettingsRequest?.(); }}
      />}
      onChange={patch => onLayoutChange?.(patch)}
      onClose={() => setSettingsOpen(false)}
    />
  );

  return (
    <PanelSection
      title="Auto layout"
      // Header toggle (Composa#661 item 4): auto layout is ON here, so the
      // trailing button is the panel-check "on" face and turns it back off. It
      // REPLACES the "Switch to grid" action that used to occupy this slot —
      // grid is the fourth Flow segment now, not a header side door.
      rightActions={onDisableAutoLayout && (
        <PanelActionBtn
          icon={<AutoLayoutOnIcon data-icon-semantic="auto-layout-frame" size={16} strokeWidth={1.5} />}
          label="Remove auto-layout"
          selected
          onClick={onDisableAutoLayout}
        />
      )}
    >
      <div role="group" aria-label="Flow" className="flex items-start gap-[8px] px-[16px] pt-[8px]">
        <div className="flex-1 min-w-0">
          <div className={subLabel}>Flow</div>
          <SegmentedControl
            segments={flowSegments}
            value={renderedFlow}
            onChange={handleFlowChange}
            className="w-full"
          />
        </div>
        {/* Trailing slot — Wrap is a modifier on Horizontal (Figma parity), shown here as a
            toggle beside the flow options. It matches the Alignment/Gap row's 24px column. */}
        <div className="shrink-0 w-[24px] pt-[17px]">
          {renderedFlow === "h" && (
            <PanelActionBtn
              icon={<LayoutWrapIcon data-icon-semantic="layout-wrap" size={16} strokeWidth={1.5} />}
              label="Wrap"
              selected={wrapping}
              onClick={toggleWrap}
            />
          )}
          {renderedFlow === "grid" && grid && (
            <PanelActionBtn
              icon={<AbsolutePositionIcon data-icon-semantic="absolute-position" size={16} strokeWidth={1.5} />}
              label="Toggle automatic positioning"
              selected={grid.automaticPositioning === true}
              disabled={!onGridAutomaticPositioningChange}
              onClick={() => onGridAutomaticPositioningChange?.(grid.automaticPositioning !== true)}
            />
          )}
        </div>
      </div>

      <DimensionSizingFields {...sizing} width={width} height={height} widthMode={widthMode} heightMode={heightMode} />

      {renderedFlow === "grid" && grid ? (
      /* Figma node 342:3501: Grid 88px, Gap 88px, settings 24px. The grid face
         opens dimensions; the trailing glyph opens the SAME Auto-layout settings. */
      <div role="group" aria-label="Grid and gap" className="flex items-start gap-[8px] px-[16px] pt-[8px] pb-[4px]">
        <div className="shrink-0">
          <div className={subLabel}>Grid</div>
          <GridDimensionsPicker grid={grid} keyframes={gridTrackSizeKeyframes} onChange={patch => onLayoutChange?.({ grid: { ...grid, ...patch } })} onAddTrack={onAddGridTrack} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
          <div>
            <div className={subLabel}>Gap</div>
            <NumericInput ariaLabel="Column gap" iconLead={<AutoLayoutSpacingIcon kind="gap" axis="horizontal" />} value={grid.columnGap} onChange={columnGap => onLayoutChange?.({ grid: { ...grid, columnGap: Math.max(0, columnGap) } })} min={0} suffix="px" keyframe={gridColumnGapKeyframe} className="w-full" />
          </div>
          <NumericInput ariaLabel="Row gap" iconLead={<AutoLayoutSpacingIcon kind="gap" axis="vertical" />} value={grid.rowGap} onChange={rowGap => onLayoutChange?.({ grid: { ...grid, rowGap: Math.max(0, rowGap) } })} min={0} suffix="px" keyframe={gridRowGapKeyframe} className="w-full" />
        </div>
        <div className="shrink-0 pt-[17px]">{settingsTriggerButton}</div>
      </div>
      ) : (
      /* Alignment and Gap are the paired authoring row. While wrapping, the
          cross-axis Row gap joins the SAME gap column instead of getting its own
          full-width row below the alignment block (Composa#661 item 2) — the two
          gaps are one pair, and the 240px inspector cannot fit the 88px alignment
          control plus two side-by-side numeric fields without shrinking both to
          ~36px. Auto remains unavailable while wrapping. */
      <div role="group" aria-label="Alignment and gap" className="flex items-start gap-[8px] px-[16px] pt-[8px] pb-[4px]">
        <div className="shrink-0">
          <div className={subLabel}>Alignment</div>
          <AlignmentControl
            value={renderedAlign as AlignmentValue}
            onChange={value => { setAlign(value); onAlignChange?.(value); }}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
          <div>
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
              keyframe={gapMode === "fixed" ? gapKeyframe : undefined}
              min={0}
              suffix="px"
              menu={gapMenu}
              className="w-full"
            />
          </div>
          {wrapping && (
            // No second title: the "Gap" above heads the pair. Kept identical to the
            // grid section's gap column so the two blocks stay structurally the same
            // ("row gap does not need a title row gap").
            <div>
              <NumericComboInput
                dataMode={rowGapMode}
                ariaLabel="Row gap"
                dropdownAriaLabel={`Row gap sizing mode: ${rowGapMode === "auto" ? "Auto" : "Fixed"}`}
                iconLead={<AutoLayoutSpacingIcon kind="gap" axis="vertical" />}
                readOnlyLabel={rowGapMode === "auto" ? "Auto" : undefined}
                value={rowGapControlled && typeof renderedRowGap === "number" ? renderedRowGap : undefined}
                defaultValue={lastFixedRowGap}
                onChange={emitRowGap}
                keyframe={rowGapMode === "fixed" ? rowGapKeyframe : undefined}
                min={0}
                suffix="px"
                menu={rowGapMenu}
                className="w-full"
              />
            </div>
          )}
        </div>
        <div className="shrink-0 pt-[17px]">{settingsTriggerButton}</div>
      </div>
      )}

      {/* Padding — cross layout. Combined (default): Vertical + Horizontal, two
          fields. Expanded (toggle): all four sides independently. */}
      <div className="px-[16px] pb-[4px]">
        <div className="flex items-center justify-between mb-[3px]">
          <span className={subLabel}>Padding</span>
        </div>
        {expandedPadding ? (
          // Same reserved icon column as the combined state below (shrink-0, right
          // edge) — the field grid is flex-1 so it shrinks to leave that room,
          // instead of the icon getting bumped to its own row underneath. Top-
          // aligned (not centered) since the field block is two rows tall here.
          <div className="flex items-start gap-[4px]">
            <div className="grid grid-cols-2 gap-[4px] flex-1 min-w-0">
              <NumericInput ariaLabel="Top padding" iconLead={<AutoLayoutSpacingIcon kind="padding" edge="top" />} value={controlled ? paddingTop : undefined} defaultValue={paddingTop} mixed={paddingTopMixed} disabled={paddingDisabled} onChange={top => onPaddingChange?.({ top, right: paddingRight, bottom: paddingBottom, left: paddingLeft }, ["top"])} keyframe={paddingTopKeyframe} min={0} />
              <NumericInput ariaLabel="Right padding" iconLead={<AutoLayoutSpacingIcon kind="padding" edge="right" />} value={controlled ? paddingRight : undefined} defaultValue={paddingRight} mixed={paddingRightMixed} disabled={paddingDisabled} onChange={right => onPaddingChange?.({ top: paddingTop, right, bottom: paddingBottom, left: paddingLeft }, ["right"])} keyframe={paddingRightKeyframe} min={0} />
              <NumericInput ariaLabel="Bottom padding" iconLead={<AutoLayoutSpacingIcon kind="padding" edge="bottom" />} value={controlled ? paddingBottom : undefined} defaultValue={paddingBottom} mixed={paddingBottomMixed} disabled={paddingDisabled} onChange={bottom => onPaddingChange?.({ top: paddingTop, right: paddingRight, bottom, left: paddingLeft }, ["bottom"])} keyframe={paddingBottomKeyframe} min={0} />
              <NumericInput ariaLabel="Left padding" iconLead={<AutoLayoutSpacingIcon kind="padding" edge="left" />} value={controlled ? paddingLeft : undefined} defaultValue={paddingLeft} mixed={paddingLeftMixed} disabled={paddingDisabled} onChange={left => onPaddingChange?.({ top: paddingTop, right: paddingRight, bottom: paddingBottom, left }, ["left"])} keyframe={paddingLeftKeyframe} min={0} />
            </div>
            <PanelActionBtn
              icon={<SquareSquare size={16} strokeWidth={1.5} />}
              label="Combine padding"
              selected
              disabled={paddingDisabled || paddingHasMixedSide || paddingKeyframesPresent}
              onClick={() => {
                onPaddingChange?.({ top: paddingTop, right: paddingRight, bottom: paddingTop, left: paddingRight }, ["bottom", "left"]);
                setIndivPadding(false);
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-[4px]">
            <div className="flex-1 min-w-0">
              <NumericInput ariaLabel="Vertical padding" iconLead={<AutoLayoutSpacingIcon kind="padding" axis="vertical" />} value={controlled ? paddingTop : undefined} defaultValue={paddingTop} disabled={paddingDisabled} onChange={vertical => onPaddingChange?.({ top: vertical, right: paddingRight, bottom: vertical, left: paddingLeft }, ["top", "bottom"])} min={0} />
            </div>
            <div className="flex-1 min-w-0">
              <NumericInput ariaLabel="Horizontal padding" iconLead={<AutoLayoutSpacingIcon kind="padding" axis="horizontal" />} value={controlled ? paddingRight : undefined} defaultValue={paddingRight} disabled={paddingDisabled} onChange={horizontal => onPaddingChange?.({ top: paddingTop, right: horizontal, bottom: paddingBottom, left: horizontal }, ["right", "left"])} min={0} />
            </div>
            <PanelActionBtn
              icon={<SquareSquare size={16} strokeWidth={1.5} />}
              label="Independent padding"
              disabled={paddingDisabled}
              onClick={() => setIndivPadding(true)}
            />
          </div>
        )}
      </div>

      <SpatialSelectionLayoutFields value={spatialSelectionLayout} />

      {/* Clip content */}
      <PanelFullRow height={28}>
        <Checkbox checked={controlled ? clipContent : undefined} defaultChecked={clipContent} onChange={onClipContentChange} label="Clip content" />
      </PanelFullRow>
    </PanelSection>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────
// ─── Section: Appearance ──────────────────────────────────────────────────────

interface AppearanceSectionProps {
  opacity?: number;
  blendMode?: BlendMode;
  cornerRadius?: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number };
  /** Multi-select with differing values renders the field's "Mixed" state; edits still commit to all. */
  opacityMixed?: boolean;
  cornerRadiusMixed?: boolean;
  onOpacityChange?: (v: number) => void;
  onBlendModeChange?: (value: BlendMode) => void;
  onCornerRadiusChange?: (value: AppearanceSectionProps["cornerRadius"]) => void;
  blendControlled?: boolean;
  cornerControlled?: boolean;
  /** Blend modes the host can actually apply. Others render disabled in the menu
   *  (Figma-parity list, but never a silent no-op). Omit = all enabled. */
  supportedBlendModes?: readonly BlendMode[];
  opacityKeyframe?: InspectorKeyframeControl;
  cornerRadiusKeyframe?: InspectorKeyframeControl;
  cornerRadiusKeyframes?: Partial<Record<"topLeft" | "topRight" | "bottomRight" | "bottomLeft", InspectorKeyframeControl>>;
}

function AppearanceSection({
  opacity = 100, blendMode = "Pass through", cornerRadius = 0, onOpacityChange, onBlendModeChange, onCornerRadiusChange, blendControlled = false, cornerControlled = false,
  supportedBlendModes,
  opacityMixed = false, cornerRadiusMixed = false,
  opacityKeyframe, cornerRadiusKeyframe, cornerRadiusKeyframes,
}: AppearanceSectionProps) {
  const subLabel = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary mb-[3px]");
  const [indivCorners, setIndivCorners] = useState(typeof cornerRadius === "object");
  const independentCornerTopology = typeof cornerRadius === "object";
  // Selection/controlled-prop topology changes reset the presentation to the
  // truthful shape. A same-topology user toggle is preserved because this
  // effect depends only on the scalar/object boundary, not the numeric values.
  useEffect(() => setIndivCorners(independentCornerTopology), [independentCornerTopology]);
  const [blend, setBlend] = useState<BlendMode>(blendMode);
  const [internalCornerRadius, setInternalCornerRadius] = useState(cornerRadius);
  const renderedBlend = blendControlled ? blendMode : blend;
  const renderedCornerRadius = cornerControlled ? cornerRadius : internalCornerRadius;
  const corners = typeof renderedCornerRadius === "number" ? { topLeft: renderedCornerRadius, topRight: renderedCornerRadius, bottomLeft: renderedCornerRadius, bottomRight: renderedCornerRadius } : renderedCornerRadius;
  const setBlendValue = (value: BlendMode) => { if (!blendControlled) setBlend(value); onBlendModeChange?.(value); };
  const setCornerValue = (value: NonNullable<AppearanceSectionProps["cornerRadius"]>) => { if (!cornerControlled) setInternalCornerRadius(value); onCornerRadiusChange?.(value); };
  const cornerKeys = ["topLeft", "topRight", "bottomLeft", "bottomRight"] as const;
  const cornerGlyphs = ["┌", "┐", "└", "┘"]; // TL TR BL BR
  const cornerLabels = ["Top-left corner radius", "Top-right corner radius", "Bottom-left corner radius", "Bottom-right corner radius"];
  return (
    <PanelSection
      title="Appearance"
      rightActions={
        <>
          <PanelActionBtn icon={<Eye size={16} strokeWidth={1.5} />} label="Visibility" />
          {/* Blend mode — outlined semantic glyph; opens the grouped blend menu. */}
          <PopoverMenu
            align="right"
            trigger={<PanelActionBtn icon={<BlendModeIcon data-icon-semantic="blend-mode" size={16} strokeWidth={1.5} />} label="Blend mode" />}
          >
            {blendMenu(renderedBlend, setBlendValue, supportedBlendModes)}
          </PopoverMenu>
        </>
      }
    >
      {/* Opacity + Corner radius — each labeled; reserved slot holds the independent-corners toggle.
          pb-[4px] matches the PanelFieldRow bottom inset used by sibling sections (Position, etc.)
          so Appearance's below-control spacing is not short when it is the section's last row (#460). */}
      <div className="flex items-end gap-[8px] pl-[16px] pr-[16px] pt-[3px] pb-[4px]">
        <div className="flex-1 min-w-0">
          <div className={subLabel}>Opacity</div>
          <NumericInput ariaLabel="Opacity" iconLead={<OpacityIcon data-icon-semantic="opacity" size={16} strokeWidth={1.5} />} value={opacity} onChange={onOpacityChange} min={0} max={100} suffix="%" mixed={opacityMixed} keyframe={opacityKeyframe} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={subLabel}>Corner radius</div>
          <NumericInput ariaLabel="Corner radius" iconLead={<Maximize size={16} strokeWidth={1.5} />} value={corners.topLeft} onChange={setCornerValue} min={0} mixed={cornerRadiusMixed && !indivCorners} disabled={indivCorners} keyframe={indivCorners ? undefined : cornerRadiusKeyframe} />
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
                  <NumericInput ariaLabel={cornerLabels[i]} iconLead={<span className={clsx(FONT, "text-[11px]")}>{cornerGlyphs[i]}</span>} value={corners[cornerKeys[i]]} onChange={value => setCornerValue({ ...corners, [cornerKeys[i]]: value })} min={0} keyframe={cornerRadiusKeyframes?.[cornerKeys[i]]} />
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
          <PopoverMenu className="flex-1 min-w-0" trigger={<Dropdown value={renderedBlend} fullWidth leadingIcon={<BlendModeIcon data-icon-semantic="blend-mode" size={16} strokeWidth={1.5} />} />}>
            {blendMenu(renderedBlend, setBlendValue, supportedBlendModes)}
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

/**
 * Font sizes the size field's chevron offers. Presets only — the field stays a
 * free-text combo, so any size not on this list is still typeable. The roster is
 * the conventional editor type ramp (fine steps where UI text lives, coarser
 * ones for display sizes); hosts with their own scale pass `fontSizes`.
 */
export const DEFAULT_FONT_SIZES: ReadonlyArray<number> = [8, 9, 10, 11, 12, 14, 16, 18, 24, 36, 48, 64, 72, 96, 128];

/** Same cap + overlay-thumb scroll treatment the blend-mode menu uses. */
const FONT_SIZE_MENU_MAX_HEIGHT = 280;

/**
 * Weights offered for the selected family: the family's own roster when the host
 * declared one, else the host-wide roster, else the DS default four. Families
 * differ widely (Inter ships 9 weights, many text faces ship 2), and neither the
 * Google catalog nor the Local Font Access roster carries axis metadata, so this
 * can only be as good as what the host supplies.
 */
function weightsForFamily(
  family: string,
  fonts: ReadonlyArray<FontEntry> | undefined,
  hostWeights: ReadonlyArray<FontWeightOption> | undefined,
): ReadonlyArray<FontWeightOption> {
  const entry = fonts?.find(font => font.name === family);
  return entry?.weights ?? hostWeights ?? DEFAULT_FONT_WEIGHTS;
}

function TypographySection({ value, onChange, stylesAvailable, fonts, fontSizes = DEFAULT_FONT_SIZES, fontWeights, keyframes }: { value?: ElementTypographySettings; onChange?: (patch: Partial<ElementTypographySettings>) => void; stylesAvailable: boolean; fonts?: ReadonlyArray<FontEntry>; fontSizes?: ReadonlyArray<number>; fontWeights?: ReadonlyArray<FontWeightOption>; keyframes?: Pick<InspectorKeyframeControls, "fontWeight" | "fontSize" | "lineHeight" | "letterSpacing"> }) {
  const [internal, setInternal] = useState<ElementTypographySettings>({ fontFamily: "Inter", fontWeight: "Medium", fontSize: 11, lineHeight: 16, letterSpacing: 0, align: "left", verticalAlign: "top", decoration: "none", textCase: "none", weight: 500, styleName: "Title · 96/120" });
  const settings = value ?? internal;
  const update = (patch: Partial<ElementTypographySettings>) => { if (!value) setInternal(current => ({ ...current, ...patch })); onChange?.(patch); };
  const hasStyle = stylesAvailable && !!settings.styleName;
  const weightOptions = weightsForFamily(settings.fontFamily, fonts, fontWeights);
  const weightLabels = Object.fromEntries(weightOptions.map(option => [option.label, option.label])) as Record<string, string>;
  const subLabel = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary mb-[3px]");
  const textAlignBtns: IconBtn[] = [
    { icon: <TextAlignLeftIcon data-icon-semantic="text-align-left" size={S} strokeWidth={1.5} />, label: "Align left", tooltip: "Align left", onClick: () => update({ align: "left" }) },
    { icon: <TextAlignCenterXIcon data-icon-semantic="text-align-center-x" size={S} strokeWidth={1.5} />, label: "Align center", tooltip: "Align center", onClick: () => update({ align: "center" }) },
    { icon: <TextAlignRightIcon data-icon-semantic="text-align-right" size={S} strokeWidth={1.5} />, label: "Align right", tooltip: "Align right", onClick: () => update({ align: "right" }) },
  ];
  const vAlignBtns: IconBtn[] = [
    { icon: <TextAlignTopIcon data-icon-semantic="text-align-top" size={S} strokeWidth={1.5} />, label: "Top", tooltip: "Align top", onClick: () => update({ verticalAlign: "top" }) },
    { icon: <TextAlignCenterIcon data-icon-semantic="text-align-center" size={S} strokeWidth={1.5} />, label: "Middle", tooltip: "Align middle", onClick: () => update({ verticalAlign: "middle" }) },
    { icon: <TextAlignBottomIcon data-icon-semantic="text-align-bottom" size={S} strokeWidth={1.5} />, label: "Bottom", tooltip: "Align bottom", onClick: () => update({ verticalAlign: "bottom" }) },
  ];
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const [typeSettingsOpen, setTypeSettingsOpen] = useState(false);
  const typeSettingsTrigger = (
    <PanelActionBtn
      icon={<SettingsIcon data-icon-semantic="settings" size={16} strokeWidth={1.5} />}
      label="Type settings"
      active={typeSettingsOpen}
      onClick={() => setTypeSettingsOpen(true)}
    />
  );

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
          {/* Font family — opens the searchable Font Picker dialog (§9.5) */}
          <div className="flex items-center gap-[8px] pl-[16px] pr-[16px] pt-[3px]">
            <div className="flex-1 min-w-0">
              <FontPickerDialog
                open={fontPickerOpen}
                onClose={() => setFontPickerOpen(false)}
                fonts={fonts}
                value={settings.fontFamily}
                onSelect={fontFamily => { update({ fontFamily }); setFontPickerOpen(false); }}
                trigger={
                  <Dropdown
                    aria-haspopup="dialog"
                    ariaLabel={`Font: ${settings.fontFamily}`}
                    value={settings.fontFamily}
                    fullWidth
                    state={fontPickerOpen ? "active" : "default"}
                    onClick={() => setFontPickerOpen(true)}
                  />
                }
              />
            </div>
            <div className="shrink-0 min-w-[24px]" />
          </div>

          {/* Weight / Size — no labels (Figma); Size is a combo input */}
          <div className="flex items-center gap-[8px] pl-[16px] pr-[16px] pt-[3px]">
            {/* Weight rows come from the selected family, not a fixed four
                (Composa#661) — and each pick emits BOTH the named weight and its
                numeric value so a name outside the host's own name table (Thin,
                Black, …) still persists as the right CSS weight. */}
            <div className="flex-1 min-w-0"><ChoiceDropdown ariaLabel="Font weight" value={settings.fontWeight} options={weightOptions.map(option => option.label)} labels={weightLabels} keyframe={keyframes?.fontWeight} onChange={label => { const picked = weightOptions.find(option => option.label === label); update({ fontWeight: label, ...(picked ? { weight: picked.value } : {}) }); }} /></div>
            <div className="flex-1 min-w-0">
              <ComboInput
                ariaLabel="Font size"
                selectAllOnFocus
                iconLead={<span className={FONT}>T</span>}
                value={String(settings.fontSize)}
                onInputChange={fontSize => update({ fontSize: Number(fontSize) })}
                dropdownAriaLabel="Font size presets"
                menu={close => (
                  <Menu maxHeight={FONT_SIZE_MENU_MAX_HEIGHT}>
                    {fontSizes.map(size => (
                      <MenuRow key={size} type="checkmark" checked={size === settings.fontSize} label={String(size)} onClick={() => { update({ fontSize: size }); close(); }} />
                    ))}
                  </Menu>
                )}
                keyframe={keyframes?.fontSize}
              />
            </div>
            <div className="shrink-0 min-w-[24px]" />
          </div>

          {/* Line height / Letter spacing — labeled */}
          <div className="flex items-end gap-[8px] pl-[16px] pr-[16px] pt-[6px]">
            <div className="flex-1 min-w-0">
              <div className={subLabel}>Line height</div>
              <NumericInput ariaLabel="Line height" iconLead={<LineHeightIcon data-icon-semantic="line-height" size={16} strokeWidth={1.5} />} value={settings.lineHeight} onChange={lineHeight => update({ lineHeight })} min={0} keyframe={keyframes?.lineHeight} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={subLabel}>Letter spacing</div>
              <NumericInput ariaLabel="Letter spacing" iconLead={<LetterSpacingIcon data-icon-semantic="letter-spacing" size={16} strokeWidth={1.5} />} value={settings.letterSpacing} onChange={letterSpacing => update({ letterSpacing })} suffix="%" keyframe={keyframes?.letterSpacing} />
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
        rightAction={
          <TypeSettingsDialog
            open={typeSettingsOpen}
            onClose={() => setTypeSettingsOpen(false)}
            trigger={typeSettingsTrigger}
            value={settings}
            keyframes={{ weight: keyframes?.fontWeight, lineHeight: keyframes?.lineHeight, letterSpacing: keyframes?.letterSpacing }}
            onChange={update}
          />
        }
      />
    </PanelSection>
  );
}

// ─── Section: Fill ────────────────────────────────────────────────────────────

type FillEntry = ElementFillSetting;

function FillSection({ entries, onAdd, onUpdate, onToggle, onReorder, onRemove,
  onFillTypeChange, onGradientStopsChange, onChooseImage, onChooseVideo,
  onFlipGradient, onRotateGradient, onRotateMedia,
  onImageAdjustmentChange, onVideoPlaybackChange, onApplyVideoPlaybackToAll, onMediaFitChange, onMediaTileScaleChange, onEditCrop, dropZoneSources, onSelectDropZoneSource,
  onOpenMediaEffects,
  onEyedropperActivate, activeEyedropperId,
  imageAdjustmentsReadOnly = false, swatches, capabilities, activeStackDialog, onActiveStackDialogChange }: {
  entries?: FillEntry[]; onAdd?: () => void; onUpdate?: (id: string, patch: Partial<Omit<FillEntry, "id">>) => void;
  onToggle?: (id: string, visible: boolean) => void; onReorder?: (id: string, targetId: string) => void; onRemove?: (id: string) => void;
  onFillTypeChange?: (id: string, type: FillType) => void;
  onGradientStopsChange?: (id: string, stops: GradientStop[]) => void;
  onFlipGradient?: (id: string) => void;
  onRotateGradient?: (id: string) => void;
  onRotateMedia?: (id: string) => void;
  onChooseImage?: (id: string) => void; onChooseVideo?: (id: string) => void;
  onImageAdjustmentChange?: (id: string, adjustment: ImageAdjustment, value: number) => void;
  onOpenMediaEffects?: (id: string) => void;
  onVideoPlaybackChange?: (id: string, patch: Partial<VideoPlaybackOptions>) => void;
  onApplyVideoPlaybackToAll?: (id: string) => void;
  onMediaFitChange?: (id: string, fit: MediaFillFit) => void;
  onMediaTileScaleChange?: (id: string, scale: number) => void;
  onEditCrop?: (id: string) => void;
  imageAdjustmentsReadOnly?: boolean;
  dropZoneSources?: { id: string; label: string }[];
  onSelectDropZoneSource?: (id: string, sourceId: string) => void;
  onEyedropperActivate?: (id: string, gradientStopId?: string) => void;
  activeEyedropperId?: string | null;
  swatches?: string[];
  capabilities: Required<InspectorCapabilities>;
  activeStackDialog: string | null;
  onActiveStackDialogChange: (dialog: string | null) => void;
}) {
  const [internal, setInternal] = useState<FillEntry[]>([
    { id: "1", color: "#1e1e1e", opacity: 100, visible: true, label: "Black" },
  ]);
  const fills = entries ?? internal;

  const addFill = () => { if (!entries) setInternal(f => [...f, { id: String(Date.now()), color: "#ffffff", opacity: 100, visible: true }]); onAdd?.(); };
  const updateFill = (id: string, patch: Partial<Omit<FillEntry, "id">>) => { if (!entries) setInternal(f => f.map(x => x.id === id ? { ...x, ...patch } : x)); onUpdate?.(id, patch); };
  const removeFill = (id: string) => { if (!entries) setInternal(f => f.filter(x => x.id !== id)); onRemove?.(id); };
  const toggleFill = (id: string) => { const fill = fills.find(item => item.id === id); if (!fill) return; if (!entries) setInternal(items => items.map(item => item.id === id ? { ...item, visible: !item.visible } : item)); onToggle?.(id, !fill.visible); };
  const fillIds = fills.map(fill => fill.id);

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
      {/* Entry = ColorInput summary + the shared PanelEntry grip/eye/remove anatomy,
          so Fill · Stroke · Effects render through ONE row primitive (#460). */}
      {fills.map(fill => (
        <PanelReorderableEntry key={fill.id} id={fill.id} ids={fillIds} onReorder={onReorder}>
          <PanelEntry
            draggable={fills.length > 1}
            visible={fill.visible}
            hideLabel="Hide"
            showLabel="Show"
            removeLabel="Remove fill"
            onToggleVisible={() => toggleFill(fill.id)}
            onRemove={() => removeFill(fill.id)}
          >
            <ColorDialog
              capabilities={capabilities}
              open={activeStackDialog === `fill-color:${fill.id}`}
              onClose={() => onActiveStackDialogChange(null)}
              trigger={<ColorInput
                ariaLabel="Fill color"
                fullWidth
                color={fill.color}
                gradient={fill.gradientPreview}
                previewUrl={fill.fillType === "image" ? fill.imagePreviewUrl : fill.fillType === "video" ? fill.videoPreviewUrl : undefined}
                fillType={fill.fillType === "linear" || fill.fillType === "radial" || fill.fillType === "angular" || fill.fillType === "diamond"
                  ? "Gradient" : fill.fillType === "image" ? "Image" : fill.fillType === "video" ? "Video" : fill.fillType === "drop-zone" ? "Drop zone" : "Fill"}
                fillLabel={fill.label}
                opacity={fill.opacity}
                colorKeyframe={fill.fillType === undefined || fill.fillType === "solid" ? fill.keyframes?.color : undefined}
                opacityKeyframe={fill.keyframes?.opacity}
                onColorChange={color => updateFill(fill.id, { color })}
                onOpacityChange={opacity => updateFill(fill.id, { opacity })}
                onSwatchClick={() => onActiveStackDialogChange(`fill-color:${fill.id}`)}
              />}
              hex={fill.color.replace("#", "")}
              swatches={swatches}
              onHexChange={color => updateFill(fill.id, { color: `#${color.replace(/^#/, "")}` })}
              fillType={fill.fillType}
              onFillTypeChange={onFillTypeChange ? type => onFillTypeChange(fill.id, type) : undefined}
              gradientStops={fill.gradientStops}
              gradientStopKeyframes={fill.keyframes?.gradientStops}
              onStopsChange={onGradientStopsChange ? stops => onGradientStopsChange(fill.id, stops) : undefined}
              onEyedropperActivate={onEyedropperActivate ? stopId => onEyedropperActivate(fill.id, stopId) : undefined}
              eyedropperActive={activeEyedropperId === fill.id}
              onFlipGradient={onFlipGradient ? () => onFlipGradient(fill.id) : undefined}
              onRotateGradient={onRotateGradient ? () => onRotateGradient(fill.id) : undefined}
              imageSourceLabel={fill.imageSourceLabel}
              imagePreviewUrl={fill.imagePreviewUrl}
              onChooseImage={onChooseImage ? () => onChooseImage(fill.id) : undefined}
              imageExposure={fill.imageAdjustments?.exposure}
              imageContrast={fill.imageAdjustments?.contrast}
              imageSaturation={fill.imageAdjustments?.saturation}
              imageTemperature={fill.imageAdjustments?.temperature}
              imageTint={fill.imageAdjustments?.tint}
              imageHighlights={fill.imageAdjustments?.highlights}
              imageShadows={fill.imageAdjustments?.shadows}
              imageAdjustmentKeyframes={fill.keyframes?.imageAdjustments}
              imageAdjustmentsReadOnly={imageAdjustmentsReadOnly}
              onImageAdjustmentChange={onImageAdjustmentChange ? (adjustment, value) => onImageAdjustmentChange(fill.id, adjustment, value) : undefined}
              videoSourceLabel={fill.videoSourceLabel}
              videoPreviewUrl={fill.videoPreviewUrl}
              onChooseVideo={onChooseVideo ? () => onChooseVideo(fill.id) : undefined}
              onOpenMediaEffects={onOpenMediaEffects ? () => { onActiveStackDialogChange(null); onOpenMediaEffects(fill.id); } : undefined}
              videoPlayback={fill.videoPlayback}
              onVideoPlaybackChange={onVideoPlaybackChange ? patch => onVideoPlaybackChange(fill.id, patch) : undefined}
              onApplyVideoPlaybackToAll={onApplyVideoPlaybackToAll ? () => onApplyVideoPlaybackToAll(fill.id) : undefined}
              mediaFit={fill.mediaFit}
              onMediaFitChange={onMediaFitChange ? fit => onMediaFitChange(fill.id, fit) : undefined}
              mediaTileScale={fill.mediaTileScale}
              mediaTileScaleKeyframe={fill.keyframes?.mediaTileScale}
              onMediaTileScaleChange={onMediaTileScaleChange ? scale => onMediaTileScaleChange(fill.id, scale) : undefined}
              onRotateMedia={onRotateMedia ? () => onRotateMedia(fill.id) : undefined}
              onEditCrop={onEditCrop ? () => onEditCrop(fill.id) : undefined}
              dropZoneSources={dropZoneSources}
              dropZoneSourceId={fill.dropZoneSourceId}
              onSelectDropZoneSource={onSelectDropZoneSource ? sourceId => onSelectDropZoneSource(fill.id, sourceId) : undefined}
            />
          </PanelEntry>
        </PanelReorderableEntry>
      ))}
    </PanelSection>
  );
}

// ─── Section: Stroke ──────────────────────────────────────────────────────────

const STROKE_WEIGHT_MODES = ["all", "top", "bottom", "left", "right", "custom"] as const satisfies readonly StrokeWeightMode[];

function strokeWeightModeLabel(mode: StrokeWeightMode): string {
  return mode[0].toUpperCase() + mode.slice(1);
}

function strokeWeightModeIcon(mode: StrokeWeightMode, size = 16) {
  const props = { size, strokeWidth: 1.5, "aria-hidden": true } as const;
  if (mode === "top") return <PanelTop {...props} />;
  if (mode === "bottom") return <PanelBottom {...props} />;
  if (mode === "left") return <PanelLeft {...props} />;
  if (mode === "right") return <PanelRight {...props} />;
  if (mode === "custom") return <SettingsIcon data-icon-semantic="settings" {...props} />;
  return <Square {...props} />;
}

function StrokeSection({ entries, onAdd, onUpdate, onToggle, onReorder, onRemove, onEyedropperActivate, activeEyedropperId, swatches, capabilities, readOnly, activeStackDialog, onActiveStackDialogChange }: {
  entries?: ElementStrokeSetting[]; onAdd?: () => void; onUpdate?: (id: string, patch: Partial<Omit<ElementStrokeSetting, "id">>) => void;
  onToggle?: (id: string, visible: boolean) => void; onReorder?: (id: string, targetId: string) => void; onRemove?: (id: string) => void;
  onEyedropperActivate?: (id: string) => void;
  activeEyedropperId?: string | null;
  swatches?: string[];
  capabilities: Required<InspectorCapabilities>;
  readOnly: boolean;
  activeStackDialog: string | null;
  onActiveStackDialogChange: (dialog: string | null) => void;
}) {
  const [internal, setInternal] = useState<ElementStrokeSetting[]>([]);
  const strokes = entries ?? internal;
  const update = (id: string, patch: Partial<Omit<ElementStrokeSetting, "id">>) => { if (!entries) setInternal(s => s.map(x => x.id === id ? { ...x, ...patch } : x)); onUpdate?.(id, patch); };
  const add = () => { if (!entries) setInternal(s => [...s, { id: String(Date.now()), color: "#000000", opacity: 100, visible: true, weight: 1, align: "center", weightMode: "all", pathTrimStart: 0, pathTrimEnd: 100, style: "solid", join: "miter", cap: "none" }]); onAdd?.(); };
  const remove = (id: string) => { if (!entries) setInternal(s => s.filter(x => x.id !== id)); onRemove?.(id); };
  const toggle = (id: string) => { const stroke = strokes.find(item => item.id === id); if (!stroke) return; if (!entries) setInternal(items => items.map(item => item.id === id ? { ...item, visible: !item.visible } : item)); onToggle?.(id, !stroke.visible); };
  const strokeIds = strokes.map(stroke => stroke.id);
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
        <PanelReorderableEntry key={stroke.id} id={stroke.id} ids={strokeIds} onReorder={onReorder} className="pb-[2px]">
          {/* Row 1 — color summary through the shared PanelEntry primitive (#460). */}
          <PanelEntry
            draggable={strokes.length > 1}
            visible={stroke.visible}
            hideLabel="Hide"
            showLabel="Show"
            removeLabel="Remove stroke"
            onToggleVisible={() => toggle(stroke.id)}
            onRemove={() => remove(stroke.id)}
          >
            <ColorDialog
              capabilities={capabilities}
              solidOnly
              swatches={swatches}
              open={activeStackDialog === `stroke-color:${stroke.id}`}
              onClose={() => onActiveStackDialogChange(null)}
              trigger={<ColorInput
                ariaLabel="Stroke color"
                fullWidth
                color={stroke.color}
                opacity={stroke.opacity}
                colorKeyframe={stroke.fillType === undefined || stroke.fillType === "solid" ? stroke.keyframes?.color : undefined}
                opacityKeyframe={stroke.keyframes?.opacity}
                onColorChange={color => update(stroke.id, { color })}
                onOpacityChange={opacity => update(stroke.id, { opacity })}
                onSwatchClick={() => onActiveStackDialogChange(`stroke-color:${stroke.id}`)}
              />}
              hex={stroke.color.replace("#", "")}
              onHexChange={color => update(stroke.id, { color: `#${color.replace(/^#/, "")}` })}
              onEyedropperActivate={onEyedropperActivate ? () => onEyedropperActivate(stroke.id) : undefined}
              eyedropperActive={activeEyedropperId === stroke.id}
            />
          </PanelEntry>
          {/* Row 2 — Position · Weight · settings · edge targeting */}
          <div className="flex items-end gap-[8px] px-[16px] pb-[4px]">
            <div className="flex-1 min-w-0">
              <div className={subLabel}>Position</div>
              <ChoiceDropdown value={stroke.align} options={["inside", "center", "outside"]} labels={{ inside: "Inside", center: "Center", outside: "Outside" }} onChange={align => update(stroke.id, { align })} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={subLabel}>Weight</div>
              <NumericInput ariaLabel="Stroke weight" iconLead={<AlignJustify size={16} strokeWidth={1.5} />} value={stroke.weight} onChange={weight => update(stroke.id, { weight })} min={0} keyframe={stroke.keyframes?.weight} />
            </div>
            <StrokeSettingsDialog
              open={activeStackDialog === `stroke-settings:${stroke.id}`}
              onClose={() => onActiveStackDialogChange(null)}
              readOnly={readOnly}
              value={{
                style: stroke.style ?? "solid",
                join: stroke.join ?? "miter",
                cap: stroke.cap ?? "none",
                styleMixed: stroke.styleMixed,
                joinMixed: stroke.joinMixed,
                capMixed: stroke.capMixed,
              }}
              onChange={readOnly ? undefined : patch => update(stroke.id, patch)}
              trigger={<PanelActionBtn
                icon={<SettingsIcon data-icon-semantic="settings" size={16} strokeWidth={1.5} />}
                label="Stroke settings"
                active={activeStackDialog === `stroke-settings:${stroke.id}`}
                onClick={() => onActiveStackDialogChange(`stroke-settings:${stroke.id}`)}
              />}
            />
            <PopoverMenu
              align="right"
              trigger={<PanelActionBtn
                icon={strokeWeightModeIcon(stroke.weightMode ?? "all")}
                label={`Stroke sides: ${strokeWeightModeLabel(stroke.weightMode ?? "all")}`}
              />}
            >
              {close => <Menu>{STROKE_WEIGHT_MODES.map(mode => <MenuRow
                key={mode}
                type="checkmark"
                selectionRole="radio"
                checked={(stroke.weightMode ?? "all") === mode}
                leading={strokeWeightModeIcon(mode, 14)}
                label={strokeWeightModeLabel(mode)}
                onClick={() => { update(stroke.id, {
                  weightMode: mode,
                  ...(mode === "custom" && !stroke.edgeWeights
                    ? { edgeWeights: { top: stroke.weight, right: stroke.weight, bottom: stroke.weight, left: stroke.weight } }
                    : {}),
                }); close(); }}
              />)}</Menu>}
            </PopoverMenu>
          </div>
          {(stroke.weightMode ?? "all") === "custom" && <div className="grid grid-cols-2 gap-[4px] px-[16px] pb-[4px]">
            {(["top", "right", "bottom", "left"] as const).map(side => <Tooltip key={side} label={`${strokeWeightModeLabel(side)} stroke weight`} direction="Left" delayDuration={300}>
              <span className="block min-w-0">
                <NumericInput
                  ariaLabel={`${strokeWeightModeLabel(side)} stroke weight`}
                  iconLead={strokeWeightModeIcon(side, 14)}
                  value={stroke.edgeWeights?.[side] ?? stroke.weight}
                  min={0}
                  keyframe={stroke.keyframes?.edgeWeights?.[side]}
                  onChange={value => update(stroke.id, { edgeWeights: { top: stroke.edgeWeights?.top ?? stroke.weight, right: stroke.edgeWeights?.right ?? stroke.weight, bottom: stroke.edgeWeights?.bottom ?? stroke.weight, left: stroke.edgeWeights?.left ?? stroke.weight, [side]: value } })}
                />
              </span>
            </Tooltip>)}
          </div>}
          <div className="px-[16px] pb-[6px]">
            <div className={subLabel}>Path trim</div>
            <div data-composa-path-trim-row className="flex items-center gap-[8px]">
              <Tooltip label="Start position along the path (0% is the path origin)" direction="Left" delayDuration={300}>
                <span className="block flex-1 min-w-0"><NumericInput ariaLabel="Path trim start" iconLead={<ArrowRightFromLine size={14} strokeWidth={1.5} />} value={stroke.pathTrimStart ?? 0} onChange={pathTrimStart => update(stroke.id, { pathTrimStart })} min={0} max={100} suffix="%" keyframe={stroke.keyframes?.pathTrimStart} /></span>
              </Tooltip>
              <Tooltip label="End position along the path (100% is the path end)" direction="Left" delayDuration={300}>
                <span className="block flex-1 min-w-0"><NumericInput ariaLabel="Path trim end" iconLead={<ArrowLeftFromLine size={14} strokeWidth={1.5} />} value={stroke.pathTrimEnd ?? 100} onChange={pathTrimEnd => update(stroke.id, { pathTrimEnd })} min={0} max={100} suffix="%" keyframe={stroke.keyframes?.pathTrimEnd} /></span>
              </Tooltip>
              {/* Match the Stroke row above: the two values occupy its field columns,
                  while these empty 24px cells preserve the settings + side-control columns. */}
              <span aria-hidden data-composa-trailing-control-slot className="size-[24px] shrink-0" />
              <span aria-hidden data-composa-trailing-control-slot className="size-[24px] shrink-0" />
            </div>
          </div>
        </PanelReorderableEntry>
      ))}
    </PanelSection>
  );
}

// ─── Section: Effects ─────────────────────────────────────────────────────────

function EffectsSection({ entries, onAdd, onUpdate, onToggle, onReorder, onRemove, onEyedropperActivate, activeEyedropperId, capabilities, activeStackDialog, onActiveStackDialogChange }: {
  entries?: ElementEffectSetting[]; onAdd?: () => void; onUpdate?: (id: string, patch: Partial<Omit<ElementEffectSetting, "id">>) => void;
  onToggle?: (id: string, visible: boolean) => void; onReorder?: (id: string, targetId: string) => void; onRemove?: (id: string) => void;
  onEyedropperActivate?: (id: string) => void;
  activeEyedropperId?: string | null;
  capabilities: Required<InspectorCapabilities>;
  activeStackDialog: string | null;
  onActiveStackDialogChange: (dialog: string | null) => void;
}) {
  const [internal, setInternal] = useState<ElementEffectSetting[]>([]);
  const effects = entries ?? internal;
  const update = (id: string, patch: Partial<Omit<ElementEffectSetting, "id">>) => { if (!entries) setInternal(e => e.map(x => x.id === id ? { ...x, ...patch } : x)); onUpdate?.(id, patch); };
  const add = () => { if (!entries) setInternal(e => [...e, { id: String(Date.now()), type: "Drop shadow", visible: true }]); onAdd?.(); };
  const remove = (id: string) => { if (!entries) setInternal(e => e.filter(x => x.id !== id)); onRemove?.(id); };
  const toggle = (id: string) => { const effect = effects.find(item => item.id === id); if (!effect) return; if (!entries) setInternal(items => items.map(item => item.id === id ? { ...item, visible: !item.visible } : item)); onToggle?.(id, !effect.visible); };
  const effectIds = effects.map(effect => effect.id);

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
        <PanelReorderableEntry key={effect.id} id={effect.id} ids={effectIds} onReorder={onReorder}>
          <PanelEntry
            draggable={!!onReorder && effects.length > 1}
            visible={effect.visible}
            hideLabel="Hide effect"
            showLabel="Show effect"
            removeLabel="Remove effect"
            onToggleVisible={() => toggle(effect.id)}
            onRemove={() => remove(effect.id)}
          >
            <EffectDetailsDialog open={activeStackDialog === `effect:${effect.id}`} value={effect}
              trigger={<Dropdown value={effect.type} fullWidth ariaLabel={`Effect type: ${effect.type}`} onClick={() => onActiveStackDialogChange(`effect:${effect.id}`)} />}
              capabilities={capabilities}
              onEyedropperActivate={onEyedropperActivate ? () => onEyedropperActivate(effect.id) : undefined}
              eyedropperActive={activeEyedropperId === effect.id}
              onChange={patch => update(effect.id, patch)} onClose={() => onActiveStackDialogChange(null)} />
          </PanelEntry>
        </PanelReorderableEntry>
      ))}
    </PanelSection>
  );
}

// ─── Section: Export ──────────────────────────────────────────────────────────

function ExportSection({ animatedFormats, exporting, settings, targetName = "selection", mode = "static", animatedAvailable = true, frameRate, onModeChange, onFrameRateChange, onAdd, onRemove, onUpdate, onExport }: {
  animatedFormats?: Record<string, "MP4" | "WebM" | "Detecting…" | "Unavailable">;
  exporting?: boolean;
  settings?: InspectorExportSetting[];
  targetName?: string;
  mode?: InspectorExportMode;
  animatedAvailable?: boolean;
  frameRate?: ProjectFrameRate;
  onModeChange?: (mode: InspectorExportMode) => void;
  onFrameRateChange?: (frameRate: ProjectFrameRate) => void;
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
      {exports.length > 0 && animatedAvailable && <div className="px-[16px] pt-[4px] pb-[8px]">
        <SegmentedControl
          ariaLabel="Export mode"
          segments={[{ value: "static", label: "Static" }, { value: "frame", label: "Animated" }]}
          value={mode}
          onChange={value => onModeChange?.(value as InspectorExportMode)}
          className="w-full"
        />
      </div>}
      {exports.map(exp => (
        <div key={exp.id} className="group/row flex items-start min-h-[52px] pr-[16px] py-[4px]">
          {/* Single-item stacks have nothing to reorder, so suppress the grip while
              keeping the 16px inset column — same grip-only-when->1 rule already
              applied to Fill/Stroke/Effects (#460b, #501). */}
          <DragGutter grip={exports.length > 1} />
          <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-[4px] gap-y-[4px]">
            <div className="min-w-0">
              <div className={SUBLABEL}>Size</div>
              <NumericInput ariaLabel="Export size" value={exp.scale} min={0.01} step={0.25} suffix="×" onChange={scale => update(exp.id, { scale })} />
            </div>
            {/* The Suffix field is gone (Composa#661). The app stopped reading it, so
                it round-tripped a value nothing consumed: still editable, still
                placeholdered, and no longer able to change an exported filename.
                Removed rather than disabled -- a disabled field still promises the
                feature exists. Format takes the freed width. */}
            <div className="min-w-0">
              <div className={SUBLABEL}>Format</div>
              {mode === "frame" && animatedFormats
                ? <ChoiceDropdown ariaLabel="Export video format" value={animatedFormats[exp.id] ?? "Detecting…"} options={[animatedFormats[exp.id] ?? "Detecting…"]} labels={{ MP4: "MP4", WebM: "WebM", "Detecting…": "Detecting…", Unavailable: "Unavailable" }} disabled />
                : <ChoiceDropdown ariaLabel="Export format" value={exp.format} options={["PNG", "JPG"]} labels={{ PNG: "PNG", JPG: "JPG" }} onChange={format => update(exp.id, { format })} />}
            </div>
            {exp.format === "JPG" && !(mode === "frame" && animatedFormats) && <div className="min-w-0">
              <div className={SUBLABEL}>Quality</div>
              <NumericInput ariaLabel="Export quality" value={exp.quality ?? 90} min={1} max={100} step={1} suffix="%" onChange={quality => update(exp.id, { quality })} />
            </div>}
            {mode === "frame" && frameRate !== undefined && <div className="min-w-0">
              <div className={SUBLABEL}>Frame rate</div>
              <ChoiceDropdown ariaLabel="Export frame rate" value={String(frameRate)} options={["24", "25", "30", "60"]}
                labels={{ "24": "24 fps", "25": "25 fps", "30": "30 fps", "60": "60 fps" }}
                onChange={value => onFrameRateChange?.(Number(value) as ProjectFrameRate)} disabled={!onFrameRateChange} />
            </div>}
          </div>
          <div
            data-composa-export-remove-slot
            className="self-start mt-[16px] shrink-0 flex items-center gap-[4px] pl-[8px]"
          >
            <PanelActionBtn icon={<Minus size={16} strokeWidth={1.5} />} label="Remove export" onClick={() => remove(exp.id)} />
          </div>
        </div>
      ))}
      {exports.length > 0 && <PanelFullRow height={40}>
        <Button label={exporting ? "Exporting…" : mode === "frame" ? animatedFormats ? "Export video" : "Export frame" : `Export ${targetName}`} variant="Secondary" size="wide" onClick={onExport}
          disabled={exporting || (mode === "frame" && !!animatedFormats && exports.some(exp => !["MP4", "WebM"].includes(animatedFormats[exp.id] ?? "")))} />
      </PanelFullRow>}
    </PanelSection>
  );
}

// StylesButton glyph — phosphor circles-four
const StylesIcon = () => <CirclesFour size={16} weight="regular" />;

// Reserved 16px left gutter holding the drag handle (hover-reveal). The handle gets its
// OWN space so it never overlaps the content's 16px inset. Rows must be `group/row`.
// `grip` gates only the reorder affordance: a single-item stack has nowhere to reorder,
// so the grip glyph and grab cursor are suppressed while the 16px inset column is kept
// intact — content centerline and row width stay identical as items are added/removed.
const DragGutter = ({ grip = true }: { grip?: boolean }) => (
  <span className={clsx(
    "w-[16px] shrink-0 flex items-center justify-center",
    grip && "opacity-0 group-hover/row:opacity-40 cursor-grab text-c-icon",
  )}>
    {grip && (
      <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
        <circle cx="1.5" cy="2" r="1" fill="currentColor" /><circle cx="4.5" cy="2" r="1" fill="currentColor" />
        <circle cx="1.5" cy="5" r="1" fill="currentColor" /><circle cx="4.5" cy="5" r="1" fill="currentColor" />
        <circle cx="1.5" cy="8" r="1" fill="currentColor" /><circle cx="4.5" cy="8" r="1" fill="currentColor" />
      </svg>
    )}
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

function SelectionColorsSection({ colors, onUpdate, onSelectAll, onEyedropperActivate, activeEyedropperId, swatches, capabilities = { templates: true, styles: true, variables: true, libraries: true, videoFill: false, dropZone: false, animationDelay: false, layoutFidelityTools: false } }: {
  colors?: ElementSelectionColorSetting[];
  onUpdate?: (id: string, patch: Partial<Omit<ElementSelectionColorSetting, "id">>) => void;
  onSelectAll?: (id: string) => void;
  onEyedropperActivate?: (id: string, gradientStopId?: string) => void;
  activeEyedropperId?: string | null;
  swatches?: string[];
  capabilities?: Required<InspectorCapabilities>;
}) {
  const renderedColors = colors ?? DEMO_SELECTION_COLORS;
  const [colorOpen, setColorOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  if (renderedColors.length === 0) return null;
  return (
    <PanelSection title="Selection colors">
      {renderedColors.map((c, index) => (
        <div key={c.id} className="group/row flex items-center px-[16px] h-[32px] gap-[8px]">
          <div className="flex-1 min-w-0">
            <ColorDialog
              capabilities={capabilities}
              open={colorOpen && activeIndex === index}
              onClose={() => setColorOpen(false)}
              trigger={<ColorInput ariaLabel="Selection color" fullWidth color={c.color} opacity={c.opacity}
                fillType={c.fillType ? "Gradient" : "Fill"} gradient={c.gradientPreview}
                onSwatchClick={() => { setActiveIndex(index); setColorOpen(true); }} />}
              hex={c.color.replace(/^#/, "")}
              swatches={swatches}
              opacity={c.opacity}
              fillType={c.fillType}
              gradientStops={c.gradientStops}
              onStopsChange={stops => onUpdate?.(c.id, { gradientStops: stops })}
              onHexChange={hex => onUpdate?.(c.id, { color: `#${hex.replace(/^#/, "")}` })}
              onOpacityChange={opacity => onUpdate?.(c.id, { opacity })}
              onEyedropperActivate={onEyedropperActivate ? stopId => onEyedropperActivate(c.id, stopId) : undefined}
              eyedropperActive={activeEyedropperId === c.id}
            />
          </div>
          {/* Reserved slot; actions reveal on this row's hover — no reflow (§5.8) */}
          <div className="shrink-0 flex items-center gap-[4px] opacity-0 group-hover/row:opacity-100 transition-opacity duration-100">
            {capabilities.styles && <PanelActionBtn icon={<StylesIcon />} label="Apply color style" />}
            <PanelActionBtn icon={<Crosshair size={16} strokeWidth={1.5} />} label={c.usageCount ? `Select all ${c.usageCount} using this color` : "Select all using this color"} onClick={() => onSelectAll?.(c.id)} />
          </div>
        </div>
      ))}
    </PanelSection>
  );
}

// ─── Project mode sections (inspector-project-mode.md) ───────────────────────
// Active when nothing is selected. Header label "Project" (+ the canvas-size /
// frame-rate control on the right); body = Master timeline, Export (stub).
//
// The Canvas section (Aspect ratio · Dimensions · Frame rate) no longer lives in
// the project inspector body: those controls were folded into the top-right
// ProjectCanvasSizeControl dropdown (owner ask), so aspect (presets), dimensions
// (Custom W/H) and frame rate are authored from that single control instead.

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

// Export §Export — project-level whole-project video export. A host supplies the
// truthful browser-supported container and encoder action; absent remains an
// explicitly hover/focus-explained capability gate.
function ProjectExportSection({ format = "MP4", exporting = false, onExport }: {
  format?: "MP4" | "WebM";
  exporting?: boolean;
  onExport?: () => void;
}) {
  if (onExport) return (
    <PanelSection title="Export">
      <PanelFieldRow
        label="Format"
        reserveRightSlot={false}
        left={<Dropdown ariaLabel="Project video format" value={format} fullWidth disabled />}
      />
      <PanelFullRow height={40}>
        <Button label={exporting ? "Exporting project…" : "Export project"} variant="Secondary" size="wide" disabled={exporting} onClick={onExport} />
      </PanelFullRow>
    </PanelSection>
  );
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
  durationMode,
  onDurationModeChange,
  controlled = false,
  reserveTrailingSlot = false,
}: {
  title?: string;
  landmark?: boolean;
  start?: number;
  end?: number;
  onStartChange?: (value: number) => void;
  onEndChange?: (value: number) => void;
  onDurationChange?: (value: number) => void;
  /** Slide/composition duration mode. Absent keeps the plain numeric Duration
   *  field (Video Clip Timeline mode and demo fallbacks never hug). */
  durationMode?: SlideDurationMode;
  onDurationModeChange?: (mode: SlideDurationMode) => void;
  controlled?: boolean;
  /** Reserve the standard trailing-action column (24px + 8px gap) so timing
   *  fields align with other inspector value rows. When set, Duration is also
   *  pinned to one column while an empty second column preserves the pair. */
  reserveTrailingSlot?: boolean;
}) {
  const [internalStart, setInternalStart] = useState(start);
  const [internalEnd, setInternalEnd] = useState(end);
  const renderedStart = controlled ? start : internalStart;
  const renderedEnd = controlled ? end : internalEnd;
  const renderedDuration = Math.max(0, renderedEnd - renderedStart);
  const hugging = durationMode === "hug";
  const commitDuration = (value: number) => { if (!controlled) setInternalEnd(renderedStart + value); onDurationChange?.(value); };
  return (
    <PanelSection title={title} landmark={landmark}>
      <DualField
        leftLabel="Start"
        left={<NumericInput ariaLabel="Start" value={renderedStart}
          onChange={value => { if (!controlled) setInternalStart(value); onStartChange?.(value); }} min={0} suffix="s" />}
        rightLabel="End"
        right={<NumericInput ariaLabel="End" value={renderedEnd}
          onChange={value => { if (!controlled) setInternalEnd(value); onEndChange?.(value); }} min={0} suffix="s" />}
        reserveRightSlot={reserveTrailingSlot}
      />
      <PanelFieldRow
        label="Duration"
        reserveRightSlot={reserveTrailingSlot}
        // Pin Duration to a single column in the slide/comp inspector: a
        // half-width spacer fills the second column so the control lines up
        // under Start (Range's left column) instead of spanning full width.
        right={reserveTrailingSlot ? <span aria-hidden className="block" /> : undefined}
        left={
          onDurationModeChange ? (
            // Fixed/Hug combo — the Duration row analogue of the Dimensions
            // SizingComboField. Hug follows the composition's longest action;
            // editing the value (or picking Fixed) pins it to a fixed duration.
            <NumericComboInput
              dataMode={hugging ? "hug" : "fixed"}
              ariaLabel="Duration"
              dropdownAriaLabel={`Duration mode: ${hugging ? "Hug" : "Fixed"}`}
              idleLabel={hugging ? "Hug" : undefined}
              iconLead={<Timer data-icon-semantic="duration-timer" size={16} strokeWidth={1.5} />}
              value={renderedDuration}
              onChange={value => { if (hugging) onDurationModeChange("fixed"); commitDuration(value); }}
              min={0}
              suffix={hugging ? undefined : "s"}
              menu={close => (
                <Menu>
                  <MenuRow type="checkmark" leading={<SizingFixedIcon data-icon-semantic="sizing-fixed" size={14} strokeWidth={1.5} />} label="Fixed duration" checked={!hugging} onClick={() => { onDurationModeChange("fixed"); close(); }} />
                  <MenuRow type="checkmark" leading={<SizingHugIcon data-icon-semantic="sizing-hug" size={14} strokeWidth={1.5} />} label="Hug content and animations" checked={hugging} onClick={() => { onDurationModeChange("hug"); close(); }} />
                </Menu>
              )}
              className="w-full"
            />
          ) : (
            <NumericInput
              ariaLabel="Duration"
              iconLead={<Timer data-icon-semantic="duration-timer" size={16} strokeWidth={1.5} />}
              value={renderedDuration}
              onChange={commitDuration}
              min={0}
              suffix="s"
            />
          )
        }
      />
    </PanelSection>
  );
}

// Fill-type glyphs — ported from ColorDialog's toolbar tabs (same house
// iconography: solid = filled square, gradient = a diagonal css-gradient swatch,
// image/video = the matching lucide icon), so Slide-mode's Background reads
// consistent with the Fill/Color dialog rather than text-labeled segments.
function SlideFillTypeIcon({ type }: { type: "solid" | "gradient" | "image" | "video" | "drop-zone" }) {
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
  if (type === "drop-zone") return <SquareDashedMousePointer size={12} strokeWidth={1.5} />;
  return <VideoFillIcon data-icon-semantic="fill-video" size={12} strokeWidth={1.5} />;
}

// Template style §Template style — a dropdown-shaped trigger (3-colour preview
// swatch + template name/fonts + chevron) that opens the template picker.
// Ported from the Figma-referenced SlideInspector.tsx, onto light c-* tokens.
function TemplateStyleSection({ name = "Radicle", fonts = "Whyte Inktrap, Inter" }: { name?: string; fonts?: string }) {
  return (
    <PanelSection
      title="Slide template"
      rightActions={
        <PanelActionBtn icon={<SettingsIcon data-icon-semantic="settings" size={16} strokeWidth={1.5} />} label="Template settings" />
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
  gradientPreview,
  gradientType = "linear",
  gradientStops,
  imageSourceLabel,
  imagePreviewUrl,
  videoSourceLabel,
  videoPreviewUrl,
  mediaFit = "fill",
  mediaTileScale = 50,
  dropZoneSources,
  dropZoneSourceId,
  swatches,
  onTypeChange,
  onColorChange,
  onOpacityChange,
  onGradientTypeChange,
  onGradientStopsChange,
  onFlipGradient,
  onRotateGradient,
  onChooseImage,
  onChooseVideo,
  onMediaFitChange,
  onMediaTileScaleChange,
  onEditCrop,
  onSelectDropZoneSource,
  onEyedropperActivate,
  eyedropperActive,
  onDialogOpenChange,
  onRotateMedia,
  capabilities,
}: {
  type?: SlideBackgroundType;
  color?: string;
  opacity?: number;
  gradientPreview?: string;
  gradientType?: Extract<FillType, "linear" | "radial" | "angular" | "diamond">;
  gradientStops?: GradientStop[];
  imageSourceLabel?: string;
  imagePreviewUrl?: string;
  videoSourceLabel?: string;
  videoPreviewUrl?: string;
  mediaFit?: MediaFillFit;
  mediaTileScale?: number;
  dropZoneSources?: { id: string; label: string }[];
  dropZoneSourceId?: string;
  swatches?: string[];
  onTypeChange?: (value: SlideBackgroundType) => void;
  onColorChange?: (value: string) => void;
  onOpacityChange?: (value: number) => void;
  onGradientTypeChange?: (value: Extract<FillType, "linear" | "radial" | "angular" | "diamond">) => void;
  onGradientStopsChange?: (stops: GradientStop[]) => void;
  onFlipGradient?: () => void;
  onRotateGradient?: () => void;
  onChooseImage?: () => void;
  onChooseVideo?: () => void;
  onMediaFitChange?: (fit: MediaFillFit) => void;
  onMediaTileScaleChange?: (scale: number) => void;
  onEditCrop?: () => void;
  onSelectDropZoneSource?: (sourceId: string) => void;
  onEyedropperActivate?: (gradientStopId?: string) => void;
  eyedropperActive?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
  onRotateMedia?: () => void;
  capabilities: Required<InspectorCapabilities>;
}) {
  const [internalType, setInternalType] = useState<SlideBackgroundType>("solid");
  const [internalColor, setInternalColor] = useState("#1e1e1e");
  const [internalOpacity, setInternalOpacity] = useState(100);
  const [pendingType, setPendingType] = useState<SlideBackgroundType | null>(null);
  useEffect(() => setPendingType(null), [controlledType]);
  const fillType = pendingType ?? controlledType ?? internalType;
  const color = controlledColor ?? internalColor;
  const opacity = controlledOpacity ?? internalOpacity;
  const [colorOpen, setColorOpen] = useState(false);
  const fillSegments = [
    { value: "solid", icon: <SlideFillTypeIcon type="solid" /> },
    { value: "gradient", icon: <SlideFillTypeIcon type="gradient" /> },
    { value: "image", icon: <SlideFillTypeIcon type="image" /> },
    ...(capabilities.videoFill && onChooseVideo ? [{ value: "video", icon: <SlideFillTypeIcon type="video" /> }] : []),
    ...(capabilities.dropZone && onSelectDropZoneSource ? [{ value: "drop-zone", icon: <SlideFillTypeIcon type="drop-zone" /> }] : []),
  ];
  const allowedFillModes = fillSegments.map(segment => segment.value === "gradient" ? "gradient" : segment.value) as ("solid" | "gradient" | "image" | "video" | "drop-zone")[];
  const commitType = (next: SlideBackgroundType) => {
    setPendingType(next);
    if (controlledType === undefined) setInternalType(next);
    onTypeChange?.(next);
  };
  const dialogType: FillType = fillType === "gradient" ? gradientType : fillType;
  const triggerFillType = fillType === "gradient" ? "Gradient" : fillType === "image" ? "Image" : fillType === "video" ? "Video" : "Fill";
  const triggerLabel = fillType === "gradient" ? `${gradientType[0].toUpperCase()}${gradientType.slice(1)} gradient`
    : fillType === "image" ? imageSourceLabel ?? "No image selected"
    : fillType === "video" ? videoSourceLabel ?? "No video selected"
    : fillType === "drop-zone" ? dropZoneSources?.find(source => source.id === dropZoneSourceId)?.label ?? "No source selected"
    : undefined;
  return (
    <PanelSection title="Background">
      {/* Fill type — icon-only segmented, matching the Figma reference / ColorDialog's
          fill-type tabs (not text-labeled) */}
      <PanelSegmentedRow
        label="Fill type"
        left={
          <SegmentedControl
            segments={fillSegments}
            value={fillType}
            onChange={value => {
              const next = value as SlideBackgroundType;
              commitType(next);
            }}
            className="w-full"
          />
        }
      />

      <div className="flex items-center px-[16px] h-[32px] gap-[8px]">
        <div className="flex-1 min-w-0">
          <ColorDialog
            capabilities={capabilities}
            allowedFillModes={allowedFillModes}
            open={colorOpen}
            onClose={() => { setColorOpen(false); onDialogOpenChange?.(false); }}
            trigger={<ColorInput
              ariaLabel="Background fill"
              fullWidth
              fillType={triggerFillType}
              fillLabel={triggerLabel}
              color={color}
              opacity={opacity}
              gradient={gradientPreview}
              previewUrl={fillType === "image" ? imagePreviewUrl : fillType === "video" ? videoPreviewUrl : undefined}
              onSwatchClick={() => { setColorOpen(true); onDialogOpenChange?.(true); }}
              onColorChange={value => {
                if (controlledColor === undefined) setInternalColor(value);
                onColorChange?.(value);
              }}
              onOpacityChange={value => {
                if (controlledOpacity === undefined) setInternalOpacity(value);
                onOpacityChange?.(value);
              }}
            />}
            fillType={dialogType}
            onFillTypeChange={next => {
              if (next === "linear" || next === "radial" || next === "angular" || next === "diamond") {
                commitType("gradient"); onGradientTypeChange?.(next);
              } else commitType(next);
            }}
            hex={color.replace(/^#/, "")}
            opacity={opacity}
            onHexChange={value => {
              const next = `#${value.replace(/^#/, "")}`;
              if (controlledColor === undefined) setInternalColor(next);
              onColorChange?.(next);
            }}
            gradientStops={gradientStops}
            onStopsChange={onGradientStopsChange}
            onFlipGradient={onFlipGradient}
            onRotateGradient={onRotateGradient}
            imageSourceLabel={imageSourceLabel}
            imagePreviewUrl={imagePreviewUrl}
            videoSourceLabel={videoSourceLabel}
            videoPreviewUrl={videoPreviewUrl}
            onChooseImage={onChooseImage}
            onChooseVideo={onChooseVideo}
            mediaFit={mediaFit}
            onMediaFitChange={onMediaFitChange}
            mediaTileScale={mediaTileScale}
            onMediaTileScaleChange={onMediaTileScaleChange}
            onEditCrop={onEditCrop}
            onRotateMedia={onRotateMedia}
            dropZoneSources={dropZoneSources}
            dropZoneSourceId={dropZoneSourceId}
            onSelectDropZoneSource={onSelectDropZoneSource}
            swatches={swatches}
            onEyedropperActivate={onEyedropperActivate}
            eyedropperActive={eyedropperActive}
          />
        </div>
        <div aria-hidden className="shrink-0 flex items-center justify-end min-w-[24px]" />
      </div>
    </PanelSection>
  );
}

function ChoiceDropdown<T extends string>({ ariaLabel, value, options, labels, onChange, keyframe, disabled = false }: {
  ariaLabel?: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange?: (value: T) => void;
  keyframe?: InspectorKeyframeControl;
  disabled?: boolean;
}) {
  // A roster-driven caller (the weight menu) can hold a value the current roster
  // doesn't list — e.g. the selection is Semibold and the newly chosen family
  // only ships Regular/Bold. Show the value verbatim rather than a blank field.
  const displayed = labels[value] ?? value;
  return <div className="flex min-w-0 w-full">
    <PopoverMenu directTrigger align="right" className="min-w-0 flex-1" trigger={<Dropdown aria-haspopup="menu" ariaLabel={ariaLabel ? `${ariaLabel}: ${displayed}` : undefined} value={displayed} fullWidth disabled={disabled} />}>
      {close => <Menu>{options.map(option => (
        <MenuRow key={option} type="checkmark" checked={option === value} label={labels[option]} disabled={disabled} onClick={() => { if (!disabled) onChange?.(option); close(); }} />
      ))}</Menu>}
    </PopoverMenu>
    {keyframe && <button type="button" aria-label={`${ariaLabel ?? "Value"} keyframe`} aria-pressed={keyframe.active} disabled={disabled}
      onClick={event => { event.stopPropagation(); if (!disabled) keyframe.onToggle(); }}
      className={clsx("shrink-0 flex items-center justify-center size-[24px] rounded-c-sm hover:bg-c-bg-hover", keyframe.active && "bg-c-bg-selected", disabled && "cursor-not-allowed opacity-60 hover:bg-transparent")}>
      <Diamond size={11} strokeWidth={1.5} className={clsx(keyframe.active ? "fill-current text-c-text-brand" : "text-c-icon-secondary")} />
    </button>}
  </div>;
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
        reserveRightSlot
      />
      <PanelFullRow label="Clipped duration" height={24}>
        <span className={clsx(FONT, "text-[11px] text-c-text-secondary")}>{Math.max(0, renderedTrimOut - renderedTrimIn)}s</span>
      </PanelFullRow>
    </PanelSection>
  );
}

// Playback §Playback — only modeled actions are shown. Audio clips own the real
// volume field; a disabled video-volume promise was misleading when the selected
// video already carried audio.
const CLIP_SPEEDS: ClipSpeed[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];
const CLIP_SPEED_LABELS = Object.fromEntries(CLIP_SPEEDS.map(speed => [String(speed), `${speed}×`])) as Record<string, string>;

function ClipPlaybackSection({ speed = 1, onSpeedChange, controlled = false }: { speed?: ClipSpeed; onSpeedChange?: (value: ClipSpeed) => void; controlled?: boolean }) {
  const [internalSpeed, setInternalSpeed] = useState<ClipSpeed>(speed);
  const renderedSpeed = controlled ? speed : internalSpeed;
  return (
    <PanelSection title="Playback" landmark>
      <PanelFullRow label="Speed">
        <ChoiceDropdown ariaLabel="Speed" value={String(renderedSpeed)} options={CLIP_SPEEDS.map(String)} labels={CLIP_SPEED_LABELS} onChange={value => { const next = Number(value) as ClipSpeed; if (!controlled) setInternalSpeed(next); onSpeedChange?.(next); }} />
      </PanelFullRow>
    </PanelSection>
  );
}

// ─── Video / Audio inspector sections (effects-mental-model.md) ───────────────
// STRUCTURE ONLY, mapped to the owner's Sequence reference. Composa conventions:
// sections are opened with a "+" (like adding a fill/stroke/effect), never a
// header switch; every input/slider row leaves space for one trailing control
// (Design-tab rhythm); knob rows read label → dial → value; dial groups are a
// 2×2 grid. Blend/Volume map to host fields; colour grading and audio DSP are a
// later WebGL / Web-Audio effort and carry no invented engine schema.

const AV_SUBLABEL = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary");

// A section that is added with "+" and removed with "−" (Composa's add pattern),
// replacing the header switch. Empty (not added) → muted header + Add button.
function ToggleableSection({ title, addLabel, children }: { title: string; addLabel: string; children: ReactNode }) {
  const [added, setAdded] = useState(false);
  return (
    <PanelSection
      title={title}
      landmark
      muted={!added}
      rightActions={added
        ? <PanelActionBtn icon={<Minus size={16} strokeWidth={1.5} />} label={`Remove ${title.toLowerCase()}`} onClick={() => setAdded(false)} />
        : <PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label={addLabel} onClick={() => setAdded(true)} />}
    >
      {added && children}
    </PanelSection>
  );
}

// Label + slider + trailing value field (one reserved trailing control).
function PanelSliderRow({ label, defaultValue = 0, min = 0, max = 100, step = 1, suffix, disabled = false, gradient, bipolar = false, value, onChange }: {
  label: string; defaultValue?: number; min?: number; max?: number; step?: number; suffix?: string;
  disabled?: boolean; gradient?: string; bipolar?: boolean; value?: number; onChange?: (value: number) => void;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const v = value ?? internal;
  const set = (n: number) => { if (value === undefined) setInternal(n); onChange?.(n); };
  return (
    <div className="flex flex-col gap-[3px] px-[16px] py-[6px]">
      <span className={AV_SUBLABEL}>{label}</span>
      <div className="flex items-center gap-[8px]">
        <div className="min-w-0 flex-1">
          <Slider value={v} min={min} max={max} step={step} disabled={disabled} onChange={set}
            showDelta={bipolar} handleVariant={bipolar ? "stroke" : "fill"}
            trackVariant={gradient ? "gradient" : "default"} trackGradient={gradient} />
        </div>
        <div className="w-[52px] shrink-0">
          <NumericInput ariaLabel={`${label} value`} value={v} min={min} max={max} step={step} suffix={suffix} size="small" disabled={disabled} onChange={set} scrub />
        </div>
      </div>
    </div>
  );
}

const CLIP_BLEND_LABELS = Object.fromEntries(CLIP_BLEND_MODES.map(m => [m, m])) as Record<ClipBlendMode, string>;

// Appearance — the clip's composite blend mode. Always present (no add/remove);
// maps to a host field. Section header reads "Appearance"; the control is the
// "Blend mode" chooser (owner feedback: Blend → Appearance / Blend mode).
function ClipBlendSection({ mode = "Normal", onModeChange, controlled = false }: {
  mode?: ClipBlendMode; onModeChange?: (value: ClipBlendMode) => void; controlled?: boolean;
}) {
  const [internal, setInternal] = useState<ClipBlendMode>(mode);
  const rendered = controlled ? mode : internal;
  return (
    <PanelSection title="Appearance" landmark>
      <PanelFieldRow
        label="Blend mode"
        left={<ChoiceDropdown ariaLabel="Blend mode" value={rendered} options={CLIP_BLEND_MODES} labels={CLIP_BLEND_LABELS} onChange={value => { if (!controlled) setInternal(value); onModeChange?.(value); }} />}
      />
    </PanelSection>
  );
}

// Color — added with "+"; Conversion-LUT + Look-LUT menus, then the four deep
// adjustment groups each opening a dedicated anchored dialog (reference order).
const CONVERSION_LUTS = ["None", "Apple Log", "Rec.709", "Rec.2020", "Log → Rec.709", "ACES"] as const;
const LOOK_LUTS = ["None", "Analog Indie", "Neutral", "Cinematic", "Teal & Orange", "Vintage Film"] as const;
const ADJUSTMENT_GROUPS: { group: ColorAdjustmentGroup; label: string }[] = [
  { group: "light", label: "Light adjustments" },
  { group: "color", label: "Color adjustments" },
  { group: "wheels", label: "Color wheels" },
  { group: "creative", label: "Creative adjustments" },
];

// The Light and Color adjustment groups each back a subset of the 7 engine keys
// (exposure/contrast/saturation/temperature/tint/highlights/shadows). Those
// sliders become controlled when the clip's persisted grade is supplied; every
// other slider (brightness/whites/blacks/vibrance/hue) and the Wheels/Creative
// groups stay uncontrolled/cosmetic for Phase 2. Slider keys match engine keys
// 1:1, so no renaming is needed.
const CLIP_GROUP_ENGINE_KEYS: Partial<Record<ColorAdjustmentGroup, readonly string[]>> = {
  light: ["exposure", "contrast", "highlights", "shadows"],
  color: ["temperature", "tint", "saturation"],
};

function ClipColorBody({ adjustments, onAdjustmentChange }: {
  adjustments?: Partial<Record<string, number>>;
  onAdjustmentChange?: (key: string, value: number) => void;
}) {
  const [conversion, setConversion] = useState<string>("Apple Log");
  const [look, setLook] = useState<string>("Analog Indie");
  const [openGroup, setOpenGroup] = useState<ColorAdjustmentGroup | null>(null);
  // Per-group "modified" state so each collapsed row shows the real value (the
  // group's current state) rather than a constant "Default". Guarded so a
  // no-change report never re-renders (avoids a report → render loop).
  const [modifiedGroups, setModifiedGroups] = useState<Partial<Record<ColorAdjustmentGroup, boolean>>>({});
  const setGroupModified = (group: ColorAdjustmentGroup) => (modified: boolean) =>
    setModifiedGroups(state => (state[group] === modified ? state : { ...state, [group]: modified }));
  const lutLabels = (opts: readonly string[]) => Object.fromEntries(opts.map(o => [o, o])) as Record<string, string>;
  // Seed the controlled sliders for a group from the clip's persisted grade
  // (keys absent from `adjustments` fall through to the dialog's neutral
  // default). Groups without engine keys stay fully uncontrolled.
  const groupValues = (group: ColorAdjustmentGroup): Record<string, number> | undefined => {
    const keys = CLIP_GROUP_ENGINE_KEYS[group];
    if (!keys) return undefined;
    const seeded: Record<string, number> = {};
    for (const key of keys) {
      const value = adjustments?.[key];
      if (value !== undefined) seeded[key] = value;
    }
    return seeded;
  };
  return (
    <>
      <PanelFieldRow label="Conversion LUT"
        left={<ChoiceDropdown ariaLabel="Conversion LUT" value={conversion} options={CONVERSION_LUTS} labels={lutLabels(CONVERSION_LUTS)} onChange={setConversion} />} />
      <PanelFieldRow label="Look LUT"
        left={<ChoiceDropdown ariaLabel="Look LUT" value={look} options={LOOK_LUTS} labels={lutLabels(LOOK_LUTS)} onChange={setLook} />} />
      {ADJUSTMENT_GROUPS.map(({ group, label }) => {
        const stateLabel = modifiedGroups[group] ? "Modified" : "Default";
        const controlledKeys = CLIP_GROUP_ENGINE_KEYS[group];
        return (
          <PanelFieldRow key={group} label={label}
            left={<ColorAdjustmentsDialog group={group} enabled open={openGroup === group} onClose={() => setOpenGroup(null)}
              values={groupValues(group)}
              controlledKeys={controlledKeys}
              onValueChange={onAdjustmentChange ? (key, value) => onAdjustmentChange(key, value) : undefined}
              onModifiedChange={setGroupModified(group)}
              trigger={<Dropdown ariaLabel={`${label}: ${stateLabel}`} value={stateLabel} fullWidth onClick={() => setOpenGroup(group)} />} />} />
        );
      })}
    </>
  );
}

// Chroma key — added with "+"; Key colour swatch + hex, then Threshold %.
function ChromaKeyBody({ swatches }: { swatches?: string[] }) {
  const [color, setColor] = useState("#00FF00");
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [threshold, setThreshold] = useState(50);
  return (
    <>
      <PanelFieldRow label="Key color"
        left={
          <ColorDialog
            open={colorDialogOpen}
            onClose={() => setColorDialogOpen(false)}
            trigger={<ColorInput ariaLabel="Key color" fullWidth color={color} opacity={100} onColorChange={setColor} onSwatchClick={() => setColorDialogOpen(true)} />}
            solidOnly
            capabilities={{ styles: false, variables: false, libraries: false, videoFill: false, dropZone: false }}
            swatches={swatches}
            hex={color.replace("#", "")}
            onHexChange={value => setColor(`#${value.replace(/^#/, "")}`)}
          />
        } />
      <PanelSliderRow label="Threshold" defaultValue={50} min={0} max={100} suffix="%" value={threshold} onChange={setThreshold} />
    </>
  );
}

function MediaEffectsBody({ kind = "video", sourceLabel, adjustments = {}, onAdjustmentChange, onBack, swatches }: {
  kind?: "image" | "video";
  sourceLabel?: string;
  adjustments?: Partial<ImageAdjustments>;
  onAdjustmentChange?: (adjustment: ImageAdjustment, value: number) => void;
  onBack?: () => void;
  swatches?: string[];
}) {
  const rows: Array<[ImageAdjustment, string]> = [
    ["exposure", "Exposure"], ["contrast", "Contrast"], ["saturation", "Saturation"],
    ["temperature", "Temperature"], ["tint", "Tint"], ["highlights", "Highlights"], ["shadows", "Shadows"],
  ];
  return <ScrollArea>
    <div className="flex h-[40px] items-center gap-[8px] border-b border-c-border px-[8px]">
      {onBack && <Button variant="Ghost" ariaLabel="Back to fill" iconLead="center" icon={<ArrowLeft size={16} strokeWidth={1.5} />} onClick={onBack} />}
      <span className="min-w-0 flex-1 truncate text-[11px] font-[550] text-c-text">{kind === "video" ? "Video effects" : "Image effects"}</span>
      {sourceLabel && <span className="max-w-[96px] truncate text-[9px] text-c-text-tertiary">{sourceLabel}</span>}
    </div>
    <PanelSection title="Color adjustments" landmark>
      {rows.map(([adjustment, label]) => <PanelSliderRow key={adjustment} label={label}
        value={adjustments[adjustment] ?? 0} defaultValue={0} min={-100} max={100}
        onChange={value => onAdjustmentChange?.(adjustment, value)} />)}
    </PanelSection>
    {kind === "video" && <PanelSection title="Chroma key" landmark><ChromaKeyBody swatches={swatches} /></PanelSection>}
  </ScrollArea>;
}

// ─── Audio inspector sections (effects-mental-model.md) ───────────────────────
// A distinct "audio-clip" inspector mode. Volume is host-wired; the effect
// sections are added with "+" and structural (unwired) until the DSP lands.

// Wrapped 2×2 grid of Dials — the shared knob-row layout (label above the knob).
function DialGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-[8px] gap-y-[14px] px-[16px] pt-[10px] pb-[12px] justify-items-center">{children}</div>;
}

function AudioVolumeSection({ volume = 100, onVolumeChange, controlled = false }: {
  volume?: number; onVolumeChange?: (value: number) => void; controlled?: boolean;
}) {
  return (
    <PanelSection title="Volume" landmark>
      <PanelSliderRow label="Level" defaultValue={100} min={0} max={200} suffix="%"
        value={controlled ? volume : undefined} onChange={onVolumeChange} />
    </PanelSection>
  );
}

const EQ_PRESETS = ["Flat", "Voice", "Music", "Bass boost", "Treble boost", "Podcast"] as const;
const EQ_BANDS = ["Low", "Low-mid", "Mid", "High-mid", "High"] as const;
const menuLabels = (opts: readonly string[]) => Object.fromEntries(opts.map(o => [o, o])) as Record<string, string>;

function AudioEqualizerSection() {
  const [preset, setPreset] = useState<string>("Flat");
  const [band, setBand] = useState<string>("Mid");
  return (
    <ToggleableSection title="Equalizer" addLabel="Add equalizer">
      <PanelFieldRow label="Preset"
        left={<ChoiceDropdown ariaLabel="Equalizer preset" value={preset} options={EQ_PRESETS} labels={menuLabels(EQ_PRESETS)} onChange={setPreset} />} />
      <PanelFieldRow label="Band"
        left={<ChoiceDropdown ariaLabel="Equalizer band" value={band} options={EQ_BANDS} labels={menuLabels(EQ_BANDS)} onChange={setBand} />} />
    </ToggleableSection>
  );
}

function AudioDenoiseSection() {
  return (
    <ToggleableSection title="Denoise" addLabel="Add denoise">
      <PanelSliderRow label="Threshold" defaultValue={40} min={0} max={100} suffix="%" />
    </ToggleableSection>
  );
}

const DEHUM_FREQUENCIES = ["50 Hz", "60 Hz", "100 Hz", "120 Hz"] as const;

function AudioDeHumSection() {
  const [baseFreq, setBaseFreq] = useState<string>("60 Hz");
  return (
    <ToggleableSection title="De-hum" addLabel="Add de-hum">
      <PanelFieldRow label="Base frequency"
        left={<ChoiceDropdown ariaLabel="Base frequency" value={baseFreq} options={DEHUM_FREQUENCIES} labels={menuLabels(DEHUM_FREQUENCIES)} onChange={setBaseFreq} />} />
      <DialGrid>
        <Dial size="small" labelPlacement="top" label="Frequency" defaultValue={60} min={20} max={500} suffix="Hz" />
        <Dial size="small" labelPlacement="top" label="Harmonics" defaultValue={4} min={0} max={12} />
        <Dial size="small" labelPlacement="top" label="Sharpness" defaultValue={50} min={0} max={100} suffix="%" />
        <Dial size="small" labelPlacement="top" label="Depth" defaultValue={50} min={0} max={100} suffix="%" />
        <Dial size="small" labelPlacement="top" label="De-hiss" defaultValue={0} min={0} max={100} suffix="%" />
        <Dial size="small" labelPlacement="top" label="Hiss sens." defaultValue={50} min={0} max={100} suffix="%" />
      </DialGrid>
    </ToggleableSection>
  );
}

function AudioReverbSection() {
  return (
    <ToggleableSection title="Reverb" addLabel="Add reverb">
      <DialGrid>
        <Dial size="small" labelPlacement="top" label="Mix" defaultValue={20} min={0} max={100} suffix="%" />
        <Dial size="small" labelPlacement="top" label="Size" defaultValue={50} min={0} max={100} suffix="%" />
        <Dial size="small" labelPlacement="top" label="Decay" defaultValue={40} min={0} max={100} suffix="%" />
        <Dial size="small" labelPlacement="top" label="Damping" defaultValue={50} min={0} max={100} suffix="%" />
        <Dial size="small" labelPlacement="top" label="Pre-delay" defaultValue={20} min={0} max={200} suffix="ms" />
        <Dial size="small" labelPlacement="top" label="Width" defaultValue={100} min={0} max={100} suffix="%" />
      </DialGrid>
    </ToggleableSection>
  );
}

const COMPRESSOR_MODES = ["Off", "Gentle", "Vocal", "Punchy", "Limiter"] as const;
const COMPRESSOR_CHARACTERISTICS = ["Clean", "Warm", "Vintage", "Optical", "FET"] as const;

function AudioCompressorSection() {
  const [compMode, setCompMode] = useState<string>("Gentle");
  const [character, setCharacter] = useState<string>("Clean");
  return (
    <ToggleableSection title="Compressor" addLabel="Add compressor">
      <PanelFieldRow label="Mode"
        left={<ChoiceDropdown ariaLabel="Compressor mode" value={compMode} options={COMPRESSOR_MODES} labels={menuLabels(COMPRESSOR_MODES)} onChange={setCompMode} />} />
      <PanelFieldRow label="Characteristics"
        left={<ChoiceDropdown ariaLabel="Compressor characteristics" value={character} options={COMPRESSOR_CHARACTERISTICS} labels={menuLabels(COMPRESSOR_CHARACTERISTICS)} onChange={setCharacter} />} />
      <PanelSliderRow label="Threshold" defaultValue={60} min={0} max={100} suffix="%" />
      <PanelSliderRow label="Ratio" defaultValue={30} min={0} max={100} suffix="%" />
    </ToggleableSection>
  );
}

function AudioLoudnessSection() {
  return (
    <ToggleableSection title="Loudness" addLabel="Add loudness">
      <DialGrid>
        <Dial size="small" labelPlacement="top" label="Target" defaultValue={-14} min={-36} max={0} suffix="LUFS" />
        <Dial size="small" labelPlacement="top" label="Gain" defaultValue={0} min={-24} max={24} suffix="dB" />
        <Dial size="small" labelPlacement="top" label="True peak" defaultValue={-1} min={-9} max={0} suffix="dB" />
        <Dial size="small" labelPlacement="top" label="Range" defaultValue={7} min={0} max={20} suffix="LU" />
      </DialGrid>
    </ToggleableSection>
  );
}

// ─── PropertyPanel ────────────────────────────────────────────────────────────

export interface PropertyPanelProps {
  /** Host-owned feature availability; UI only hides unsupported entry points. */
  capabilities?: InspectorCapabilities;
  /** Real unique colors from the active composition; never demo palette data. */
  pageSwatches?: string[];
  /** Controlled Design/Animate tab seam. A timeline preset can reveal its matching Animate card. */
  activeTab?: "design" | "animate";
  onActiveTabChange?: (tab: "design" | "animate") => void;
  /** Inspector mode. Defaults to "element" — the current selection inspector. */
  mode?: PanelMode;
  elementType?: ElementType;
  multiSelect?: boolean;
  /** Host-owned scale controls inserted after Layout while the Scale tool is active. */
  scaleToolSection?: ReactNode;
  x?: number; y?: number; rotation?: number;
  /** Per-field Mixed state for a multi-selection with differing values. The field
   *  renders the Figma-style "Mixed" placeholder; editing still commits to all. */
  xMixed?: boolean; yMixed?: boolean; rotationMixed?: boolean;
  scaleX?: number; scaleY?: number;
  onXChange?: (value: number) => void;
  onYChange?: (value: number) => void;
  onRotationChange?: (value: number) => void;
  onRotate90Clockwise?: () => void;
  onFlipHorizontal?: () => void;
  onFlipVertical?: () => void;
  onScaleXChange?: (value: number) => void;
  onScaleYChange?: (value: number) => void;
  /** Stateless alignment commands; hosts own the document mutation and history. */
  onAlignmentAction?: (action: ElementAlignmentAction) => void;
  /** Scale row is shown when applicable (host decides — text/shape support it). */
  scaleApplicable?: boolean;
  /** Per-property keyframe diamonds in the Design tab. Host supplies these ONLY
   *  when the slide-local timeline is active; absent = no diamonds. */
  keyframeControls?: InspectorKeyframeControls;
  /** Host-owned history boundary shared by every nested NumericInput. */
  onNumericEditStart?: () => void;
  onNumericEditCommit?: () => void;
  onNumericEditCancel?: () => void;
  /** Timeline-owned easing projection. Segment context renders Easing as the only Design section. */
  easing?: EasingInspectorValue;
  easingContext?: "keyframe" | "segment";
  easingApplyScope?: EasingApplyScope;
  easingApplyToLabel?: string;
  onEasingChange?: EasingInspectorSectionProps["onChange"];
  onEasingApplyScopeChange?: EasingInspectorSectionProps["onApplyScopeChange"];
  onEasingCurveEditStart?: () => void;
  onEasingCurveEditCommit?: () => void;
  onEasingCurveEditCancel?: () => void;
  width?: number; height?: number;
  onWidthChange?: (value: number) => void;
  onHeightChange?: (value: number) => void;
  opacity?: number;
  onOpacityChange?: (value: number) => void;
  /** Per-field Mixed state for a multi-selection with differing values. */
  opacityMixed?: boolean;
  cornerRadiusMixed?: boolean;
  blendMode?: BlendMode;
  /** Blend modes the host engine can actually apply; others render disabled in
   *  the menu (Figma-parity list, never a silent no-op). Omit = all enabled. */
  supportedBlendModes?: readonly BlendMode[];
  cornerRadius?: AppearanceSectionProps["cornerRadius"];
  onBlendModeChange?: (value: BlendMode) => void;
  onCornerRadiusChange?: AppearanceSectionProps["onCornerRadiusChange"];
  layout?: ElementLayoutSettings;
  onLayoutChange?: (patch: Partial<ElementLayoutSettings>) => void;
  /** Generic plain-frame Auto-layout toggle. Unlike an explicit Flow segment,
   * this intent carries no requested axis so the host can infer from geometry. */
  onAutoLayoutEnable?: () => void;
  /** Fit a plain frame to the outer bounds of its children. */
  onResizeToFit?: () => void;
  /** Reports the exact physical side(s) edited so controlled multi-selection hosts
   * can preserve every untouched side on each selected object. */
  onPaddingChange?: (value: ElementLayoutSettings["padding"], changedEdges: readonly ElementPaddingEdge[]) => void;
  /** Requests creation of a grid track. The host creates its durable ID and applies the document command. */
  onAddGridTrack?: (axis: "row" | "column") => void;
  /** Toggle row-major automatic placement for children of a Grid frame. */
  onGridAutomaticPositioningChange?: (enabled: boolean) => void;
  /** Preferred atomic sizing seam. Numeric edits from Hug/Fill emit Fixed + value together. */
  onSizingChange?: (axis: ElementSizingAxis, change: ElementSizingChange) => void;
  onSizingConstraintChange?: (axis: ElementSizingAxis, constraint: ElementSizingConstraint, value: number | undefined) => void;
  onApplySizingVariable?: (axis: ElementSizingAxis) => void;
  /** Text resizing is a controlled projection over width/height sizing modes. */
  textSizingMode?: TextSizingMode | "mixed";
  availableTextSizingModes?: readonly TextSizingMode[];
  textSizingModeDisabled?: boolean;
  onTextSizingModeChange?: (mode: TextSizingMode) => void;
  /** Presentation-only topology for the canonical 2D position value. */
  positionPresentation?: PositionPresentation;
  onPositionPresentationChange?: (presentation: PositionPresentation) => void;
  /** Opens the one shared Auto Layout Settings surface from the Flow + Gap row. */
  onAutoLayoutSettingsRequest?: () => void;
  /** Host-owned equal-spacing projection. It renders in the existing Layout
   * section directly below Dimensions; the UI package owns presentation only. */
  spatialSelectionLayout?: SpatialSelectionLayoutControl;
  typography?: ElementTypographySettings;
  onTypographyChange?: (patch: Partial<ElementTypographySettings>) => void;
  /** Host-provided font roster for the Typography Font Picker. Defaults to the
   * DS bundled/web-safe roster (BUNDLED_FONTS) when omitted. */
  fonts?: ReadonlyArray<FontEntry>;
  /** Presets the Typography font-size chevron offers. Defaults to DEFAULT_FONT_SIZES. */
  fontSizes?: ReadonlyArray<number>;
  /** Weight roster used for families whose `fonts` entry declares no `weights`.
   * Defaults to DEFAULT_FONT_WEIGHTS (Regular · Medium · Semibold · Bold). */
  fontWeights?: ReadonlyArray<FontWeightOption>;
  fills?: ElementFillSetting[];
  /** Locked or inherited-locked selections keep image adjustments visible but inert. */
  fillImageAdjustmentsReadOnly?: boolean;
  onAddFill?: () => void; onUpdateFill?: (id: string, patch: Partial<Omit<ElementFillSetting, "id">>) => void; onToggleFill?: (id: string, visible: boolean) => void; onReorderFill?: (id: string, targetId: string) => void; onRemoveFill?: (id: string) => void;
  /** Detailed Fill/Color dialog seams. Values live on each fill; callbacks remain host-owned. */
  onFillTypeChange?: (id: string, type: FillType) => void;
  /** Reports the exact current gradient fill whose shared dialog is open;
   * non-gradient dialogs and stale selections report null so canvas chrome clears. */
  onActiveFillDialogChange?: (id: string | null) => void;
  /** Activates host-owned composition sampling for one exact fill/gradient stop. */
  onFillEyedropperActivate?: (id: string, gradientStopId?: string) => void;
  activeFillEyedropperId?: string | null;
  onFillGradientStopsChange?: (id: string, stops: GradientStop[]) => void;
  /** Host-owned gradient transform commands for a specific fill entry. */
  onFlipFillGradient?: (id: string) => void;
  onRotateFillGradient?: (id: string) => void;
  onChooseFillImage?: (id: string) => void;
  onChooseFillVideo?: (id: string) => void;
  /** Leaves the fill dialog for a dedicated, host-selected media-effects inspector. */
  onOpenFillMediaEffects?: (id: string) => void;
  onFillImageAdjustmentChange?: (id: string, adjustment: ImageAdjustment, value: number) => void;
  mediaEffectsKind?: "image" | "video";
  mediaEffectsSourceLabel?: string;
  mediaEffectsAdjustments?: Partial<ImageAdjustments>;
  onMediaEffectsAdjustmentChange?: (adjustment: ImageAdjustment, value: number) => void;
  onCloseMediaEffects?: () => void;
  onFillVideoPlaybackChange?: (id: string, patch: Partial<VideoPlaybackOptions>) => void;
  onApplyFillVideoPlaybackToAll?: (id: string) => void;
  onFillMediaFitChange?: (id: string, fit: MediaFillFit) => void;
  onFillMediaTileScaleChange?: (id: string, scale: number) => void;
  onRotateFillMedia?: (id: string) => void;
  /** Enters canvas crop mode for the specified bound media fill. */
  onEditFillCrop?: (id: string) => void;
  fillDropZoneSources?: { id: string; label: string }[];
  onSelectFillDropZoneSource?: (id: string, sourceId: string) => void;
  strokes?: ElementStrokeSetting[];
  /** Locked or inherited-locked selections may inspect Stroke Settings but cannot mutate them. */
  strokeReadOnly?: boolean;
  onAddStroke?: () => void; onUpdateStroke?: (id: string, patch: Partial<Omit<ElementStrokeSetting, "id">>) => void; onToggleStroke?: (id: string, visible: boolean) => void; onReorderStroke?: (id: string, targetId: string) => void; onRemoveStroke?: (id: string) => void;
  onStrokeEyedropperActivate?: (id: string) => void;
  activeStrokeEyedropperId?: string | null;
  effects?: ElementEffectSetting[];
  onAddEffect?: () => void; onUpdateEffect?: (id: string, patch: Partial<Omit<ElementEffectSetting, "id">>) => void; onToggleEffect?: (id: string, visible: boolean) => void; onReorderEffect?: (id: string, targetId: string) => void; onRemoveEffect?: (id: string) => void;
  onEffectEyedropperActivate?: (id: string) => void;
  activeEffectEyedropperId?: string | null;
  layoutGuides?: ElementLayoutGuideSetting[];
  onAddLayoutGuide?: () => void; onUpdateLayoutGuide?: (id: string, patch: Partial<Omit<ElementLayoutGuideSetting, "id">>) => void; onRemoveLayoutGuide?: (id: string) => void;
  selectionColors?: ElementSelectionColorSetting[];
  onUpdateSelectionColor?: (id: string, patch: Partial<Omit<ElementSelectionColorSetting, "id">>) => void;
  onSelectAllUsingColor?: (id: string) => void;
  onSelectionColorEyedropperActivate?: (id: string, gradientStopId?: string) => void;
  activeSelectionColorEyedropperId?: string | null;
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
  /** Atomic preset seam for the project-global canvas size. */
  onProjectCanvasSizeChange?: (size: ProjectCanvasSize) => void;
  /** Opens the host-owned custom project-size route. */
  onCustomProjectCanvasSizeRequest?: () => void;
  onProjectFrameRateChange?: (value: ProjectFrameRate) => void;
  onProjectDurationChange?: (value: number) => void;
  onProjectPlayheadChange?: (value: number) => void;
  /** Browser-supported whole-project video container and host-owned encoder. */
  projectVideoFormat?: "MP4" | "WebM";
  projectVideoExporting?: boolean;
  onExportProject?: () => void;
  /** Controlled transport seam for the existing reskin-clean preview control. */
  previewPlaying?: boolean;
  /** Primary Present action — enter the full presentation/playback surface. */
  onPreviewToggle?: () => void;
  /**
   * Open the floating, non-destructive Preview surface (#440). The Preview
   * segment stays visibly capability-gated (disabled) until both this handler
   * and {@link previewAvailable} are supplied, so no inert control ships.
   */
  onPreviewOpen?: () => void;
  /** Capability gate for the floating Preview segment. Default false. */
  previewAvailable?: boolean;
  /** @deprecated Superseded by the segmented Play control (#482); accepted but ignored. */
  onPreviewMenu?: () => void;
  /** Access/invite action. Omit until a truthful share surface exists. */
  onShare?: () => void;
  /** Durable account/profile menu, independent of live multiplayer presence. */
  onAccountMenu?: () => void;
  /** Live presence/spotlight menu action. Only used when presence is enabled. */
  onPresenceMenu?: () => void;
  /** Live presence/spotlight capability, independent of durable sharing. */
  presenceControlsEnabled?: boolean;
  /** Multiplayer account avatar identity for the top bar. Defaults to the
   *  historical hardcoded initial "S" / color "purple" when omitted. */
  accountInitial?: string;
  accountColor?: AvatarColor;
  /** Persisted profile photo for the top-bar avatar. When set, the avatar renders
   *  the image; otherwise it falls back to the initial + color. */
  accountPhotoUrl?: string;
  /** Shared element/selection/slide still-image export contract. */
  exportSettings?: InspectorExportSetting[];
  exportMode?: InspectorExportMode;
  /** Show the Animated export choice only when the selected target has authored motion. */
  animatedExportAvailable?: boolean;
  /** Per-row negotiated video formats. Supplying this enables real Animated video presentation. */
  animatedExportFormats?: Record<string, "MP4" | "WebM" | "Detecting…" | "Unavailable">;
  exportInProgress?: boolean;
  exportTargetName?: string;
  onExportModeChange?: (mode: InspectorExportMode) => void;
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
  /** Slide/composition duration mode. Supplying onSlideDurationModeChange turns
   *  the Duration field into a Fixed/Hug combo; omit it for the plain field. */
  slideDurationMode?: SlideDurationMode;
  onSlideDurationModeChange?: (mode: SlideDurationMode) => void;
  slideSkipped?: boolean;
  onSlideSkippedChange?: (value: boolean) => void;
  slideBackgroundType?: SlideBackgroundType;
  slideBackgroundColor?: string;
  slideBackgroundOpacity?: number;
  slideBackgroundGradientPreview?: string;
  slideBackgroundGradientType?: Extract<FillType, "linear" | "radial" | "angular" | "diamond">;
  slideBackgroundGradientStops?: GradientStop[];
  slideBackgroundImageSourceLabel?: string;
  slideBackgroundImagePreviewUrl?: string;
  slideBackgroundVideoSourceLabel?: string;
  slideBackgroundVideoPreviewUrl?: string;
  slideBackgroundMediaFit?: MediaFillFit;
  slideBackgroundMediaTileScale?: number;
  slideBackgroundDropZoneSources?: { id: string; label: string }[];
  slideBackgroundDropZoneSourceId?: string;
  slideBackgroundSwatches?: string[];
  onSlideBackgroundTypeChange?: (value: SlideBackgroundType) => void;
  onSlideBackgroundColorChange?: (value: string) => void;
  onSlideBackgroundOpacityChange?: (value: number) => void;
  onSlideBackgroundGradientTypeChange?: (value: Extract<FillType, "linear" | "radial" | "angular" | "diamond">) => void;
  onSlideBackgroundGradientStopsChange?: (stops: GradientStop[]) => void;
  onChooseSlideBackgroundImage?: () => void;
  onChooseSlideBackgroundVideo?: () => void;
  onSlideBackgroundMediaFitChange?: (fit: MediaFillFit) => void;
  onSlideBackgroundMediaTileScaleChange?: (scale: number) => void;
  onEditSlideBackgroundCrop?: () => void;
  onSelectSlideBackgroundDropZoneSource?: (sourceId: string) => void;
  onSlideBackgroundEyedropperActivate?: (gradientStopId?: string) => void;
  slideBackgroundEyedropperActive?: boolean;
  /** Keeps host-owned canvas controls synchronized with the background fill dialog. */
  onSlideBackgroundFillDialogChange?: (open: boolean) => void;
  onFlipSlideBackgroundGradient?: () => void;
  onRotateSlideBackgroundGradient?: () => void;
  onRotateSlideBackgroundMedia?: () => void;
  slideTransitionType?: SlideTransitionType;
  slideTransitionDirection?: SlideTransitionDirection;
  slideTransitionDuration?: number;
  slideTransitionEasing?: SlideTransitionEasing;
  onSlideTransitionTypeChange?: (value: SlideTransitionType) => void;
  onSlideTransitionDirectionChange?: (value: SlideTransitionDirection) => void;
  onSlideTransitionDurationChange?: (value: number) => void;
  onSlideTransitionEasingChange?: (value: SlideTransitionEasing) => void;
  onCustomSlideTransitionEasingRequest?: () => void;
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
  /** Video Clip · Blend — composite mode. Controlled when the callback is set. */
  clipBlendMode?: ClipBlendMode;
  onClipBlendModeChange?: (value: ClipBlendMode) => void;
  /**
   * Video Clip · Color — the 7 engine-backed basic grade adjustments
   * (exposure/contrast/saturation/temperature/tint/highlights/shadows). When
   * provided, ClipColorBody's Light (exposure/contrast/highlights/shadows) and
   * Color (temperature/tint/saturation) dialog sliders for these keys are
   * controlled; every other Color control (LUTs, Color-Wheels, Creative, Chroma,
   * and brightness/whites/blacks/vibrance/hue) stays cosmetic until Phase 2.
   */
  clipAdjustments?: Partial<Record<string, number>>;
  onClipAdjustmentChange?: (key: string, value: number) => void;
  /** Audio Clip mode — clip name + Volume are the only host-wired controls; the
   *  remaining effect sections are structural (unwired) until the audio DSP lands. */
  audioClipName?: string;
  onAudioClipNameChange?: (value: string) => void;
  audioVolume?: number;
  onAudioVolumeChange?: (value: number) => void;
  onReplaceAudio?: () => void;
  onDeleteAudioClip?: () => void;
  className?: string;
}

/** See ProjectCanvasSizeControl — the single justified exception to the DS menu floor. */
const PROJECT_CANVAS_MENU_MIN_WIDTH = 190;

const PROJECT_CANVAS_PRESETS: ReadonlyArray<ProjectCanvasSize & { label: string }> = [
  { label: "HD 16:9", width: 1920, height: 1080 },
  { label: "HD 720p", width: 1280, height: 720 },
  { label: "Square", width: 1080, height: 1080 },
  { label: "Portrait 9:16", width: 1080, height: 1920 },
];

const PROJECT_FRAME_RATE_OPTIONS = ["24", "25", "30", "60"] as const;
const PROJECT_FRAME_RATE_LABELS: Record<string, string> = { "24": "24 fps", "25": "25 fps", "30": "30 fps", "60": "60 fps" };

// The project's canvas size AND frame rate live together in this single top-right
// control (owner ask: the project inspector no longer carries a Canvas section).
// Presets stand in for aspect ratio; Custom exposes W/H; frame rate is folded in
// as its own row so the whole "Canvas" concern is authored from one dropdown.
function ProjectCanvasSizeControl({
  width,
  height,
  frameRate,
  onChange,
  onCustomRequest,
  onFrameRateChange,
}: {
  width: number;
  height: number;
  frameRate?: ProjectFrameRate;
  onChange?: (size: ProjectCanvasSize) => void;
  onCustomRequest?: () => void;
  onFrameRateChange?: (value: ProjectFrameRate) => void;
}) {
  const currentPreset = PROJECT_CANVAS_PRESETS.find(preset => preset.width === width && preset.height === height);
  const currentLabel = currentPreset?.label ?? `${formatNumericDisplay(width)} × ${formatNumericDisplay(height)}`;
  const [customEditing, setCustomEditing] = useState(false);
  const [customWidth, setCustomWidth] = useState(width);
  const [customHeight, setCustomHeight] = useState(height);
  const [customFrameRate, setCustomFrameRate] = useState<ProjectFrameRate>(frameRate ?? 30);
  const showFrameRate = frameRate !== undefined;
  // Only the frame-rate control varies in width; a fixed minWidth keeps the menu
  // from jumping when the user drops into Custom editing (owner ask #4).
  const frameRateField = (
    <ChoiceDropdown
      ariaLabel="Frame rate"
      value={String(customEditing ? customFrameRate : frameRate ?? 30)}
      options={[...PROJECT_FRAME_RATE_OPTIONS]}
      labels={PROJECT_FRAME_RATE_LABELS}
      onChange={value => {
        const next = Number(value) as ProjectFrameRate;
        if (customEditing) setCustomFrameRate(next);
        onFrameRateChange?.(next);
      }}
    />
  );
  return (
    <PopoverMenu
      align="right"
      directTrigger
      trigger={<Dropdown
        ariaLabel={`Project canvas size: ${currentLabel}`}
        value={currentLabel}
        stroke={false}
        disabled={!onChange && !onCustomRequest && !onFrameRateChange}
      />}
    >
      {/* The ONE menu that keeps a floor above the DS default (Composa#627): this
          menu swaps its content IN PLACE — the preset rows give way to the Custom
          W/H/frame-rate editor while it stays open — so without a stable floor it
          visibly jumps width mid-interaction (owner ask #4). 190 ≈ its widest
          natural state ("HD 16:9 (1920 × 1080)" ≈ 184px), so the floor costs ~6px. */}
      {close => <Menu minWidth={PROJECT_CANVAS_MENU_MIN_WIDTH}>
        {!currentPreset && <MenuRow type="checkmark" label={`Current (${currentLabel})`} checked disabled />}
        {PROJECT_CANVAS_PRESETS.map(preset => (
          <MenuRow
            key={`${preset.width}x${preset.height}`}
            type="checkmark"
            label={`${preset.label} (${preset.width} × ${preset.height})`}
            checked={currentPreset === preset}
            disabled={!onChange}
            onClick={onChange ? () => { onChange({ width: preset.width, height: preset.height }); close(); } : undefined}
          />
        ))}
        <MenuRow type="divider" />
        {!customEditing ? (
          <MenuRow
            type="simple"
            label="Custom project canvas size…"
            disabled={!onChange && !onCustomRequest}
            onClick={() => {
              if (onCustomRequest) {
                onCustomRequest();
                close();
              } else {
                setCustomWidth(width);
                setCustomHeight(height);
                setCustomFrameRate(frameRate ?? 30);
                setCustomEditing(true);
              }
            }}
          />
        ) : (
          // Vertical stack (owner ask #4): W, then H, then Frame rate — each a
          // full-width field — so the menu keeps its width instead of widening.
          <div className="flex flex-col gap-[8px] px-[8px] py-[6px]" aria-label="Custom project canvas size">
            <NumericInput
              ariaLabel="Custom canvas width"
              iconLead={<span className={FONT}>W</span>}
              value={customWidth}
              min={1}
              onChange={setCustomWidth}
            />
            <NumericInput
              ariaLabel="Custom canvas height"
              iconLead={<span className={FONT}>H</span>}
              value={customHeight}
              min={1}
              onChange={setCustomHeight}
            />
            {showFrameRate && frameRateField}
            <div className="flex justify-end gap-[4px]">
              <Button variant="Ghost" size="small" label="Cancel" onClick={() => setCustomEditing(false)} />
              <Button
                variant="Primary"
                size="small"
                label="Apply"
                onClick={() => {
                  onChange?.({ width: Math.max(1, customWidth), height: Math.max(1, customHeight) });
                  onFrameRateChange?.(customFrameRate);
                  setCustomEditing(false);
                  close();
                }}
              />
            </div>
          </div>
        )}
        {!customEditing && showFrameRate && [
          <MenuRow key="frame-rate-divider" type="divider" />,
          <div key="frame-rate-field" className="flex flex-col gap-[4px] px-[8px] py-[6px]" aria-label="Project frame rate">
            <div className={SUBLABEL}>Frame rate</div>
            {frameRateField}
          </div>,
        ]}
      </Menu>}
    </PopoverMenu>
  );
}

function InspectorTabs({
  value,
  onChange,
  panelPrefix,
  projectWidth,
  projectHeight,
  projectFrameRate,
  onProjectCanvasSizeChange,
  onCustomProjectCanvasSizeRequest,
  onProjectFrameRateChange,
}: {
  value: string;
  onChange: (value: string) => void;
  panelPrefix: "slide" | "element";
  projectWidth: number;
  projectHeight: number;
  projectFrameRate?: ProjectFrameRate;
  onProjectCanvasSizeChange?: (size: ProjectCanvasSize) => void;
  onCustomProjectCanvasSizeRequest?: () => void;
  onProjectFrameRateChange?: (value: ProjectFrameRate) => void;
}) {
  return (
    <div className="flex items-center gap-[4px]">
      <Tabs
        value={value}
        onChange={onChange}
        className="min-w-0 flex-1"
        tabs={[
          { value: "design", label: "Design", panelId: `${panelPrefix}-design-panel` },
          { value: "animate", label: "Animate", panelId: `${panelPrefix}-animate-panel` },
        ]}
      />
      <ProjectCanvasSizeControl
        width={projectWidth}
        height={projectHeight}
        frameRate={projectFrameRate}
        onChange={onProjectCanvasSizeChange}
        onCustomRequest={onCustomProjectCanvasSizeRequest}
        onFrameRateChange={onProjectFrameRateChange}
      />
    </div>
  );
}

// ─── Play control — split button + menu (#482 / #575) ─────────────────────────
// Present/Preview is a SPLIT BUTTON that opens a menu — the same pattern the
// creation toolbar's tool groups use (see CreationToolbar.tsx › ToolGroupButton,
// built on SplitButton.tsx):
//   • primary segment — Present: the headline action (Play icon, or Pause + a
//     brand-selected state while presenting). Clicking it presents/plays.
//   • chevron segment — opens a Menu with two rows, Present and Preview, so the
//     floating Preview surface is reachable without a second visible button.
//
// Present stays capability-gated (the primary segment is disabled when no host
// present action is wired); Preview stays gated too — its menu row is a visibly
// disabled row with a "Preview unavailable" reason until the floating-preview
// surface exists end-to-end (#440), never an inert control.
//
// The menu is an inline, state-driven Menu (like ToolGroupButton) rather than a
// portal, so it stays testable and self-contained. It opens DOWNWARD because the
// MultiplayerBar sits at the top of the (overflow-hidden) inspector column — an
// upward menu would clip against the panel top.
function PlayControl({
  playing,
  onPresent,
  onPreviewOpen,
  previewAvailable,
}: {
  playing: boolean;
  onPresent?: () => void;
  onPreviewOpen?: () => void;
  previewAvailable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const canPresent = Boolean(onPresent);
  const canPreview = previewAvailable && Boolean(onPreviewOpen);
  const presentLabel = playing ? "Pause presentation" : "Present";
  const close = () => setOpen(false);

  return (
    <div
      className="relative shrink-0"
      onBlur={event => {
        if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDownCapture={event => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <SplitButton
        size="large"
        disabled={!canPresent}
        icon={playing ? <Pause size={16} strokeWidth={1.5} /> : <Play size={16} strokeWidth={1.5} />}
        actionLabel={presentLabel}
        menuLabel="Present and preview options"
        menuOpen={open}
        onIconClick={canPresent ? onPresent : undefined}
        onChevronClick={() => setOpen(v => !v)}
      />

      {open && (
        <>
          {/* Click-away backdrop — dismiss the menu on any outside pointer. */}
          <div className="fixed inset-0 z-40" onClick={close} />
          {/* Downward menu, right-aligned to the split button so it stays inside
              the 240px inspector column. */}
          <div className="absolute top-[calc(100%+6px)] right-0 z-50">
            <Menu>
              <MenuRow
                type="simple"
                label="Present"
                leading={<Play size={16} strokeWidth={1.5} />}
                disabled={!canPresent}
                onClick={canPresent ? () => { onPresent?.(); close(); } : undefined}
              />
              <MenuRow
                type="simple"
                label="Preview"
                leading={<MonitorPlay size={16} strokeWidth={1.5} />}
                disabled={!canPreview}
                disabledReason={canPreview ? undefined : "Preview unavailable"}
                onClick={canPreview ? () => { onPreviewOpen?.(); close(); } : undefined}
              />
            </Menu>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Multiplayer bar ──────────────────────────────────────────────────────────
// Sits above the tab strip. Durable Share and live presence are deliberately
// separate capabilities: neither renders as inert chrome.
function MultiplayerBar({
  previewPlaying = false,
  onPreviewToggle,
  onPreviewOpen,
  previewAvailable = false,
  onShare,
  onAccountMenu,
  onPresenceMenu,
  presenceControlsEnabled = false,
  accountInitial = "S",
  accountColor = "purple",
  accountPhotoUrl,
}: {
  previewPlaying?: boolean;
  onPreviewToggle?: () => void;
  onPreviewOpen?: () => void;
  previewAvailable?: boolean;
  onShare?: () => void;
  onAccountMenu?: () => void;
  onPresenceMenu?: () => void;
  presenceControlsEnabled?: boolean;
  accountInitial?: string;
  accountColor?: AvatarColor;
  accountPhotoUrl?: string;
}) {
  const accountAvatar = <Avatar initial={accountInitial} src={accountPhotoUrl} size="default" color={accountColor} />;
  return (
    // #575: w-full + min-w-0 keep the cluster inside the fixed 240px inspector
    // column; the flex-1 spacer collapses first so the compact Present split
    // button and the separate Share button beside it stay fully visible rather
    // than overflowing. Share is deliberately its OWN button, not folded into the
    // split group.
    <div className="flex w-full min-w-0 items-center gap-[8px] px-[8px] py-[6px]">
      {presenceControlsEnabled && onAccountMenu && onPresenceMenu ? (
        <SplitButton
          size="large"
          icon={accountAvatar}
          actionLabel="Account"
          menuLabel="Presence and spotlight"
          onIconClick={onAccountMenu}
          onChevronClick={onPresenceMenu}
        />
      ) : onAccountMenu ? (
        <button
          type="button"
          aria-label="Account menu"
          onClick={onAccountMenu}
          className="flex h-[32px] items-center rounded-c-md px-[4px] hover:bg-c-bg-hover"
        >
          {accountAvatar}
        </button>
      ) : presenceControlsEnabled && onPresenceMenu ? (
        <button
          type="button"
          aria-label="Presence and spotlight"
          onClick={onPresenceMenu}
          className="flex h-[32px] items-center rounded-c-md px-[4px] hover:bg-c-bg-hover"
        >
          {accountAvatar}
        </button>
      ) : (
        <div aria-label="Account" className="h-[32px] flex items-center px-[4px]">{accountAvatar}</div>
      )}
      <div className="flex-1" />
      <PlayControl
        playing={previewPlaying}
        onPresent={onPreviewToggle}
        onPreviewOpen={onPreviewOpen}
        previewAvailable={previewAvailable}
      />
      {onShare && <Button label="Share" variant="Primary" size="large" onClick={onShare} />}
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
  xMixed = false, yMixed = false, rotationMixed = false,
  opacityMixed = false, cornerRadiusMixed = false,
  scaleX = 100, scaleY = 100,
  onXChange, onYChange, onRotationChange, onRotate90Clockwise, onFlipHorizontal, onFlipVertical, onScaleXChange, onScaleYChange, onAlignmentAction,
  scaleApplicable = false, keyframeControls,
  onNumericEditStart, onNumericEditCommit, onNumericEditCancel,
  easing, easingContext = "keyframe", easingApplyScope, easingApplyToLabel, onEasingChange, onEasingApplyScopeChange,
  onEasingCurveEditStart, onEasingCurveEditCommit, onEasingCurveEditCancel,
  width = 1200, height = 115,
  onWidthChange, onHeightChange,
  opacity = 100,
  onOpacityChange,
  blendMode = "Pass through",
  supportedBlendModes,
  cornerRadius = 0, onBlendModeChange, onCornerRadiusChange,
  layout, onLayoutChange, onAutoLayoutEnable, onAddGridTrack, onSizingChange, onSizingConstraintChange, onApplySizingVariable,
  textSizingMode, availableTextSizingModes, textSizingModeDisabled = false, onTextSizingModeChange,
  positionPresentation = "separate", onPositionPresentationChange,
  onAutoLayoutSettingsRequest, typography, onTypographyChange, fonts, fontSizes, fontWeights,
  fills, fillImageAdjustmentsReadOnly = false, onAddFill, onUpdateFill, onToggleFill, onReorderFill, onRemoveFill,
  strokes, strokeReadOnly = false, onAddStroke, onUpdateStroke, onToggleStroke, onReorderStroke, onRemoveStroke,
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
  onProjectCanvasSizeChange,
  onCustomProjectCanvasSizeRequest,
  onProjectFrameRateChange,
  onProjectDurationChange,
  onProjectPlayheadChange,
  projectVideoFormat = "MP4",
  projectVideoExporting = false,
  onExportProject,
  previewPlaying = false,
  onPreviewToggle,
  onPreviewOpen,
  previewAvailable = false,
  onShare,
  onAccountMenu,
  onPresenceMenu,
  presenceControlsEnabled = false,
  accountInitial,
  accountColor,
  accountPhotoUrl,
  exportSettings,
  exportMode = "static",
  exportTargetName,
  onExportModeChange,
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
  slideDurationMode,
  onSlideDurationModeChange,
  slideSkipped = false,
  onSlideSkippedChange,
  slideBackgroundType,
  slideBackgroundColor,
  slideBackgroundOpacity,
  slideBackgroundGradientPreview,
  slideBackgroundGradientType,
  slideBackgroundGradientStops,
  slideBackgroundImageSourceLabel,
  slideBackgroundImagePreviewUrl,
  slideBackgroundVideoSourceLabel,
  slideBackgroundVideoPreviewUrl,
  slideBackgroundMediaFit,
  slideBackgroundMediaTileScale,
  slideBackgroundDropZoneSources,
  slideBackgroundDropZoneSourceId,
  slideBackgroundSwatches,
  onSlideBackgroundTypeChange,
  onSlideBackgroundColorChange,
  onSlideBackgroundOpacityChange,
  onSlideBackgroundGradientTypeChange,
  onSlideBackgroundGradientStopsChange,
  onChooseSlideBackgroundImage,
  onChooseSlideBackgroundVideo,
  onSlideBackgroundMediaFitChange,
  onSlideBackgroundMediaTileScaleChange,
  onEditSlideBackgroundCrop,
  onSelectSlideBackgroundDropZoneSource,
  onSlideBackgroundEyedropperActivate,
  slideBackgroundEyedropperActive,
  onSlideBackgroundFillDialogChange,
  slideTransitionType,
  slideTransitionDirection,
  slideTransitionDuration,
  slideTransitionEasing,
  onSlideTransitionTypeChange,
  onSlideTransitionDirectionChange,
  onSlideTransitionDurationChange,
  onSlideTransitionEasingChange,
  onCustomSlideTransitionEasingRequest,
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
  clipBlendMode = "Normal",
  onClipBlendModeChange,
  clipAdjustments,
  onClipAdjustmentChange,
  audioClipName = "voiceover",
  onAudioClipNameChange,
  audioVolume = 100,
  onAudioVolumeChange,
  onReplaceAudio,
  onDeleteAudioClip,
  className,
  } = props;
  const capabilities: Required<InspectorCapabilities> = {
    templates: capabilityOverrides?.templates ?? true,
    styles: capabilityOverrides?.styles ?? true,
    variables: capabilityOverrides?.variables ?? true,
    libraries: capabilityOverrides?.libraries ?? true,
    videoFill: capabilityOverrides?.videoFill ?? false,
    dropZone: capabilityOverrides?.dropZone ?? false,
    // #222: animation "starts automatically" + delay authoring — default OFF (unlike the
    // other capabilities) so the delay is removed from the default path until re-enabled.
    animationDelay: capabilityOverrides?.animationDelay ?? false,
    // Fidelity authoring tools such as guides and future slide rulers stay out
    // of the default product until their canvas behavior reaches release fidelity.
    layoutFidelityTools: capabilityOverrides?.layoutFidelityTools ?? false,
  };
  const [uncontrolledTab, setUncontrolledTab] = useState<"design" | "animate" | "prototype">("design");
  const [activeStackDialog, setActiveStackDialog] = useState<string | null>(null);
  const activeFillDialogChangeRef = useRef(props.onActiveFillDialogChange);
  activeFillDialogChangeRef.current = props.onActiveFillDialogChange;
  const activeFillDialogId = activeGradientFillDialogId(activeStackDialog, fills);
  useEffect(() => {
    activeFillDialogChangeRef.current?.(activeFillDialogId);
  }, [activeFillDialogId]);
  const tab = props.activeTab ?? uncontrolledTab;
  const setTab = (next: string) => {
    if (next !== "design" && next !== "animate" && next !== "prototype") return;
    const value = next;
    if (props.activeTab === undefined) setUncontrolledTab(value);
    if (value !== "prototype") props.onActiveTabChange?.(value);
  };
  const changeProjectCanvasSize = onProjectCanvasSizeChange
    ?? ((onProjectWidthChange || onProjectHeightChange)
      ? ({ width, height }: ProjectCanvasSize) => {
          onProjectWidthChange?.(width);
          onProjectHeightChange?.(height);
        }
      : undefined);
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
  const isFrameLike = elementType === "frame" || elementType === "frame-auto" || elementType === "frame-grid";
  const [autoLayoutOn, setAutoLayoutOn] = useState(elementType === "frame-auto");
  const controlledAutoLayout = layout ? layout.mode !== "none" : undefined;
  useEffect(() => setAutoLayoutOn(elementType === "frame-auto"), [elementType]);
  const resolvedAutoLayout = controlledAutoLayout ?? autoLayoutOn;
  // Grid is a persisted layout mode but shares the Auto-layout Inspector section.
  const isGrid = isFrameLike && (layout ? layout.mode === "grid" : elementType === "frame-grid");
  const isFrame = isFrameLike && !resolvedAutoLayout && !isGrid;
  const isAutoLayout = isFrameLike && (resolvedAutoLayout || isGrid);

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
    widthValueMixed: layout?.widthValueMixed,
    heightValueMixed: layout?.heightValueMixed,
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
    constraintKeyframes: keyframeControls,
  };

  const elementLabel: Record<ElementType, string> = {
    text: "Text",
    frame: "Frame",
    "frame-auto": "Frame",
    "frame-grid": "Frame",
    shape: "Rectangle",
    component: "Component",
    group: "Group",
  };

  return (
    <NumericEditSessionProvider onEditStart={onNumericEditStart} onEditCommit={onNumericEditCommit} onEditCancel={onNumericEditCancel}>
    {/* Right-column inspector: flush full-height column mirroring the left-column
        panels (CompositionPanel / AssetsPanel), flipped to a left border since it
        sits to the right of the canvas. No inset ring on top/right/bottom — a single
        border-l against the canvas (Composa#250, analogous to #33). */}
    {/* Width comes from PANEL_W, the one right-slot width (RP-5). It used to be a
        hand-written w-[290px] here and another in SlideInspector, which is how
        the right-hand panels drifted apart the last time the rail was widened.
        Hosts that own a resizable rail still override it — a `!w-full` class
        beats this inline width, same as it beat the utility class before. */}
    <div data-composa-inspector-surface style={{ width: PANEL_W }} className={clsx(
      COMPOSA_NON_SELECTABLE_CHROME_CLASS,
      "relative shrink-0 h-full flex flex-col bg-c-bg border-l border-c-border overflow-hidden",
      className,
    )}>
      {/* Multiplayer tools — above the tabs; shared across all modes */}
      <MultiplayerBar
        previewPlaying={previewPlaying}
        onPreviewToggle={onPreviewToggle}
        onPreviewOpen={onPreviewOpen}
        previewAvailable={previewAvailable}
        onShare={onShare}
        onAccountMenu={onAccountMenu}
        onPresenceMenu={onPresenceMenu}
        presenceControlsEnabled={presenceControlsEnabled}
        accountInitial={accountInitial}
        accountColor={accountColor}
        accountPhotoUrl={accountPhotoUrl}
      />

      {/* ── PROJECT mode (inspector-project-mode.md) ─────────────────────────
          Active when nothing is selected. Static "Project" header, no tabs. */}
      {mode === "project" && (
        <ScrollArea>
          {/* Panel header — static "Project" label + the canvas-size/frame-rate
              control on the right. The Canvas section no longer lives in the
              project inspector body: its aspect (presets), dimensions (Custom
              W/H) and frame rate are all authored from this one dropdown. */}
          <div className="h-[40px] flex items-center gap-[8px] px-[16px] border-b border-c-border">
            <span className={clsx(FONT, "text-[11px] font-[550] text-c-text flex-1 min-w-0")}>{projectName}</span>
            <ProjectCanvasSizeControl
              width={projectWidth}
              height={projectHeight}
              frameRate={projectFrameRate}
              onChange={changeProjectCanvasSize}
              onCustomRequest={onCustomProjectCanvasSizeRequest}
              onFrameRateChange={onProjectFrameRateChange}
            />
          </div>

          <MasterTimelineSection totalDuration={projectDuration} playhead={projectPlayhead}
            durationControlled={props.projectDuration !== undefined} playheadControlled={props.projectPlayhead !== undefined}
            onTotalDurationChange={onProjectDurationChange} onPlayheadChange={onProjectPlayheadChange} />
          <ProjectExportSection format={projectVideoFormat} exporting={projectVideoExporting} onExport={onExportProject} />
        </ScrollArea>
      )}

      {/* ── SLIDE mode (inspector-slide-mode.md) ─────────────────────────────
          Active when a slide is selected. Design owns structural slide settings;
          Animate owns transitions and object-animation sequencing. */}
      {mode === "slide" && (
        <>
          <div className="border-b border-c-border px-[8px] pt-[6px] pb-[6px]">
            <InspectorTabs
              value={tab}
              onChange={setTab}
              panelPrefix="slide"
              projectWidth={projectWidth}
              projectHeight={projectHeight}
              projectFrameRate={projectFrameRate}
              onProjectCanvasSizeChange={changeProjectCanvasSize}
              onCustomProjectCanvasSizeRequest={onCustomProjectCanvasSizeRequest}
              onProjectFrameRateChange={onProjectFrameRateChange}
            />
          </div>

          {tab === "design" && <div role="tabpanel" id="slide-design-panel" aria-labelledby="slide-design-panel-tab" className="contents"><ScrollArea>
          {easing && easingContext === "segment" ? (
            <EasingInspectorSection key={easing.interactionKey} value={easing} applyScope={easingApplyScope} applyToLabel={easingApplyToLabel}
              onChange={onEasingChange} onApplyScopeChange={onEasingApplyScopeChange}
              onCurveEditStart={onEasingCurveEditStart} onCurveEditCommit={onEasingCurveEditCommit} onCurveEditCancel={onEasingCurveEditCancel} />
          ) : <>
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
                <Menu>
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
            reserveTrailingSlot
            start={slideStart}
            end={slideStart + slideDuration}
            controlled={props.slideStart !== undefined || props.slideDuration !== undefined}
            onStartChange={onSlideStartChange}
            onEndChange={value => onSlideDurationChange?.(Math.max(0, value - slideStart))}
            onDurationChange={onSlideDurationChange}
            durationMode={slideDurationMode}
            onDurationModeChange={onSlideDurationModeChange}
          />
          <SlideBackgroundSection
            capabilities={capabilities}
            type={slideBackgroundType}
            color={slideBackgroundColor}
            opacity={slideBackgroundOpacity}
            gradientPreview={slideBackgroundGradientPreview}
            gradientType={slideBackgroundGradientType}
            gradientStops={slideBackgroundGradientStops}
            imageSourceLabel={slideBackgroundImageSourceLabel}
            imagePreviewUrl={slideBackgroundImagePreviewUrl}
            videoSourceLabel={slideBackgroundVideoSourceLabel}
            videoPreviewUrl={slideBackgroundVideoPreviewUrl}
            mediaFit={slideBackgroundMediaFit}
            mediaTileScale={slideBackgroundMediaTileScale}
            dropZoneSources={slideBackgroundDropZoneSources}
            dropZoneSourceId={slideBackgroundDropZoneSourceId}
            swatches={slideBackgroundSwatches ?? props.pageSwatches}
            onTypeChange={onSlideBackgroundTypeChange}
            onColorChange={onSlideBackgroundColorChange}
            onOpacityChange={onSlideBackgroundOpacityChange}
            onGradientTypeChange={onSlideBackgroundGradientTypeChange}
            onGradientStopsChange={onSlideBackgroundGradientStopsChange}
            onFlipGradient={props.onFlipSlideBackgroundGradient}
            onRotateGradient={props.onRotateSlideBackgroundGradient}
            onChooseImage={onChooseSlideBackgroundImage}
            onChooseVideo={onChooseSlideBackgroundVideo}
            onMediaFitChange={onSlideBackgroundMediaFitChange}
            onMediaTileScaleChange={onSlideBackgroundMediaTileScaleChange}
            onEditCrop={onEditSlideBackgroundCrop}
            onSelectDropZoneSource={onSelectSlideBackgroundDropZoneSource}
            onEyedropperActivate={onSlideBackgroundEyedropperActivate}
            eyedropperActive={slideBackgroundEyedropperActive}
            onDialogOpenChange={onSlideBackgroundFillDialogChange}
            onRotateMedia={props.onRotateSlideBackgroundMedia}
          />
          {capabilities.layoutFidelityTools && <LayoutGuideSection entries={layoutGuides} onAdd={onAddLayoutGuide} onUpdate={onUpdateLayoutGuide} onRemove={onRemoveLayoutGuide} />}
          {/* Selection colors — reuse the existing element-mode section */}
          <SelectionColorsSection colors={selectionColors} onUpdate={onUpdateSelectionColor} onSelectAll={onSelectAllUsingColor}
            onEyedropperActivate={props.onSelectionColorEyedropperActivate} activeEyedropperId={props.activeSelectionColorEyedropperId}
            swatches={props.pageSwatches} capabilities={capabilities} />
          <ExportSection animatedFormats={props.animatedExportFormats} exporting={props.exportInProgress} settings={exportSettings} mode={exportMode} animatedAvailable={props.animatedExportAvailable} frameRate={projectFrameRate} onModeChange={onExportModeChange} onFrameRateChange={onProjectFrameRateChange} targetName={exportTargetName ?? renderedSlideName}
            onAdd={onAddExportSetting} onRemove={onRemoveExportSetting} onUpdate={onUpdateExportSetting} onExport={onExport} />
          </>}
          </ScrollArea></div>}

          {tab === "animate" && <div role="tabpanel" id="slide-animate-panel" aria-labelledby="slide-animate-panel-tab" className="contents"><AnimatePanel anims={objectAnimations}
            contextKey={slideId}
            selectionType="slide"
            animationDelay={capabilities.animationDelay}
            objectAnimationCallbacks={objectAnimationCallbacks} objectAnimationSettings={objectAnimationSettings} addablePhases={addableAnimationPhases}
            compTransition={{ style: renderedTransitionType, direction: renderedTransitionDirection, durationMs: renderedTransitionDuration, easing: renderedTransitionEasing }}
            compTransitionCallbacks={{
              onStyleChange: value => { if (slideTransitionType === undefined) setDemoTransitionType(value); onSlideTransitionTypeChange?.(value); },
              onDirectionChange: value => { if (slideTransitionDirection === undefined) setDemoTransitionDirection(value); onSlideTransitionDirectionChange?.(value); },
              onDurationChange: value => { if (slideTransitionDuration === undefined) setDemoTransitionDuration(value); onSlideTransitionDurationChange?.(value); },
              onEasingChange: value => { if (slideTransitionEasing === undefined) setDemoTransitionEasing(value); onSlideTransitionEasingChange?.(value); },
              onCustomEasingRequest: onCustomSlideTransitionEasingRequest,
              onApplyToAll: onApplySlideTransitionToAll,
            }} /></div>}
        </>
      )}

      {mode === "media-effects" && <MediaEffectsBody kind={props.mediaEffectsKind}
        sourceLabel={props.mediaEffectsSourceLabel} adjustments={props.mediaEffectsAdjustments}
        onAdjustmentChange={props.onMediaEffectsAdjustmentChange} onBack={props.onCloseMediaEffects}
        swatches={props.pageSwatches} />}

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
              {close => <Menu>
                <MenuRow type="simple" label="Replace video" onClick={() => { onReplaceClip?.(); close(); }} />
                <MenuRow type="simple" label="Delete clip" destructive onClick={() => { onDeleteClip?.(); close(); }} />
              </Menu>}
            </PopoverMenu>
          </div>

          <ClipSourceSection file={clipSourceFile} resolution={clipSourceResolution} sourceDuration={clipSourceDuration} />
          {/* Demo data kept consistent per spec: Clipped duration (trimOut −
              trimIn = 8s) equals the Timeline duration (end − start = 8s). */}
          <SlideTimingSection title="Timeline" landmark reserveTrailingSlot start={clipStart} end={clipStart + clipDuration}
            controlled={props.clipStart !== undefined || props.clipDuration !== undefined}
            onStartChange={onClipStartChange}
            onEndChange={value => onClipDurationChange?.(Math.max(0, value - clipStart))}
            onDurationChange={onClipDurationChange} />
          <ClipTrimSection trimIn={clipTrimIn} trimOut={clipTrimOut} controlled={props.clipTrimIn !== undefined || props.clipTrimOut !== undefined} onTrimInChange={onClipTrimInChange} onTrimOutChange={onClipTrimOutChange} />
          <ClipPlaybackSection speed={clipSpeed} controlled={props.clipSpeed !== undefined} onSpeedChange={onClipSpeedChange} />
          {/* Appearance is modeled today. Color grading and Chroma key are now
              surfaced ahead of the engine effect-stack — cosmetic/not-yet-persisted
              for the dev showcase (owner call) until the engine can persist and
              render them truthfully. */}
          <ClipBlendSection mode={clipBlendMode} controlled={props.clipBlendMode !== undefined} onModeChange={onClipBlendModeChange} />
          <PanelSection title="Color" landmark><ClipColorBody adjustments={clipAdjustments} onAdjustmentChange={onClipAdjustmentChange} /></PanelSection>
          <PanelSection title="Chroma key" landmark><ChromaKeyBody /></PanelSection>
        </ScrollArea>
      )}

      {/* ── AUDIO CLIP mode (effects-mental-model.md) ────────────────────────
          A distinct inspector state for a selected audio clip. Volume is the
          host-wired control; EQ / Denoise / De-hum / Reverb / Compressor /
          Loudness are structural (unwired) until the audio DSP pipeline lands. */}
      {mode === "audio-clip" && (
        <ScrollArea>
          <div className="h-[40px] flex items-center gap-[8px] px-[16px] border-b border-c-border">
            <div className="flex-1 min-w-0">
              <InputField value={audioClipName} onChange={value => onAudioClipNameChange?.(value)} placeholder="Audio clip name" />
            </div>
            <PopoverMenu align="right" trigger={<PanelActionBtn icon={<MoreHorizontal size={16} strokeWidth={1.5} />} label="Audio clip options" />}>
              {close => <Menu>
                <MenuRow type="simple" label="Replace audio" onClick={() => { onReplaceAudio?.(); close(); }} />
                <MenuRow type="simple" label="Delete clip" destructive onClick={() => { onDeleteAudioClip?.(); close(); }} />
              </Menu>}
            </PopoverMenu>
          </div>
          <AudioVolumeSection volume={audioVolume} controlled={props.audioVolume !== undefined} onVolumeChange={onAudioVolumeChange} />
          <AudioEqualizerSection />
          <AudioDenoiseSection />
          <AudioDeHumSection />
          <AudioReverbSection />
          <AudioCompressorSection />
          <AudioLoudnessSection />
        </ScrollArea>
      )}

      {/* ── ELEMENT mode (default) — tabs + selection inspector ──────────────── */}
      {mode === "element" && (
      <>
      {/* Tab strip */}
      <div className="border-b border-c-border px-[8px] pt-[6px] pb-[6px]">
        <InspectorTabs
          value={tab}
          onChange={setTab}
          panelPrefix="element"
          projectWidth={projectWidth}
          projectHeight={projectHeight}
          projectFrameRate={projectFrameRate}
          onProjectCanvasSizeChange={changeProjectCanvasSize}
          onCustomProjectCanvasSizeRequest={onCustomProjectCanvasSizeRequest}
          onProjectFrameRateChange={onProjectFrameRateChange}
        />
      </div>

      {/* Design tab content */}
      {tab === "design" && (
        <div role="tabpanel" id="element-design-panel" aria-labelledby="element-design-panel-tab" className="contents"><ScrollArea>
          {easing && easingContext === "segment" ? (
            <EasingInspectorSection key={easing.interactionKey} value={easing} applyScope={easingApplyScope} applyToLabel={easingApplyToLabel}
              onChange={onEasingChange} onApplyScopeChange={onEasingApplyScopeChange}
              onCurveEditStart={onEasingCurveEditStart} onCurveEditCommit={onEasingCurveEditCommit} onCurveEditCancel={onEasingCurveEditCancel} />
          ) : <>
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
            xMixed={xMixed} yMixed={yMixed} rotationMixed={rotationMixed}
            scaleX={scaleX} scaleY={scaleY}
            onXChange={onXChange} onYChange={onYChange} onRotationChange={onRotationChange}
            onRotate90Clockwise={onRotate90Clockwise} onFlipHorizontal={onFlipHorizontal} onFlipVertical={onFlipVertical}
            onScaleXChange={onScaleXChange} onScaleYChange={onScaleYChange}
            scaleApplicable={scaleApplicable}
            positioning={layout?.positioning}
            positioningApplicable={layout?.positioningApplicable}
            onPositioningChange={onLayoutChange ? positioning => onLayoutChange({ positioning }) : undefined}
            onAlignmentAction={onAlignmentAction}
            multiSelect={multiSelect}
            positionKeyframe={keyframeControls?.position}
            scaleKeyframe={keyframeControls?.scale}
            rotationKeyframe={keyframeControls?.rotation}
            positionPresentation={positionPresentation}
            onPositionPresentationChange={onPositionPresentationChange}
          />

          {/* Layout — polymorphic */}
          {(isFrame)       && <LayoutFrameSection width={width} height={height} sizing={sizingContract} spatialSelectionLayout={props.spatialSelectionLayout} clipContent={layout?.clipsContent} onWidthChange={onWidthChange} onHeightChange={onHeightChange} onClipContentChange={onLayoutChange ? value => onLayoutChange({ clipsContent: value }) : undefined} onResizeToFit={props.onResizeToFit} onEnableAutoLayout={mode => { setAutoLayoutOn(true); if (mode) onLayoutChange?.({ mode }); else if (onAutoLayoutEnable) onAutoLayoutEnable(); else onLayoutChange?.({ mode: "vertical" }); }} onEnableGrid={onLayoutChange ? () => onLayoutChange({ mode: "grid" }) : undefined} />}
          {(isAutoLayout)  && <LayoutAutoSection width={width} height={height}
            onEnableGrid={onLayoutChange ? () => onLayoutChange({ mode: "grid" }) : undefined}
            onDisableAutoLayout={() => { setAutoLayoutOn(false); onLayoutChange?.({ mode: "none" }); }}
            flowMode={layout?.mode}
            grid={layout?.grid}
            wrap={layout?.wrap} rowGap={layout?.rowGap}
            gap={layout?.gap} paddingTop={layout?.padding.top} paddingRight={layout?.padding.right} paddingBottom={layout?.padding.bottom} paddingLeft={layout?.padding.left}
            paddingTopMixed={layout?.paddingTopMixed} paddingRightMixed={layout?.paddingRightMixed}
            paddingBottomMixed={layout?.paddingBottomMixed} paddingLeftMixed={layout?.paddingLeftMixed}
            paddingDisabled={layout?.paddingDisabled}
            alignValue={layout?.align} clipContent={layout?.clipsContent}
            textBaseline={layout?.textBaseline} strokeSizing={layout?.strokeSizing} canvasStacking={layout?.canvasStacking}
            textBaselineMixed={layout?.textBaselineMixed} strokeSizingMixed={layout?.strokeSizingMixed} canvasStackingMixed={layout?.canvasStackingMixed}
            settingsBaselineApplicable={layout?.autoLayoutSettingsBaselineApplicable} settingsDisabled={layout?.autoLayoutSettingsDisabled}
            widthMode={layout?.widthMode} heightMode={layout?.heightMode}
            sizing={sizingContract}
            spatialSelectionLayout={props.spatialSelectionLayout}
            gapKeyframe={keyframeControls?.layoutGap}
            rowGapKeyframe={keyframeControls?.layoutCounterGap}
            gridColumnGapKeyframe={keyframeControls?.gridColumnGap}
            gridRowGapKeyframe={keyframeControls?.gridRowGap}
            gridTrackSizeKeyframes={keyframeControls?.gridTrackSizes}
            onAddGridTrack={onAddGridTrack}
            onGridAutomaticPositioningChange={props.onGridAutomaticPositioningChange}
            paddingTopKeyframe={keyframeControls?.paddingTop}
            paddingRightKeyframe={keyframeControls?.paddingRight}
            paddingBottomKeyframe={keyframeControls?.paddingBottom}
            paddingLeftKeyframe={keyframeControls?.paddingLeft}
            onLayoutChange={onLayoutChange} onPaddingChange={props.onPaddingChange ?? (onLayoutChange ? padding => onLayoutChange({ padding }) : undefined)}
            onAlignChange={onLayoutChange ? align => onLayoutChange({ align }) : undefined} onClipContentChange={onLayoutChange ? clipsContent => onLayoutChange({ clipsContent }) : undefined}
            onAutoLayoutSettingsRequest={onAutoLayoutSettingsRequest} />}
          {(isShape || isText) && (
            <PanelSection title="Layout">
              {isText && <TextSizingModeField
                value={textSizingMode}
                availableModes={availableTextSizingModes}
                disabled={textSizingModeDisabled}
                onChange={onTextSizingModeChange}
              />}
              <DimensionSizingFields {...sizingContract} width={width} height={height} dimensionsKeyframe={keyframeControls?.dimensions} />
              <SpatialSelectionLayoutFields value={props.spatialSelectionLayout} />
              {/* Corner radius moved to Appearance */}
            </PanelSection>
          )}

          {props.scaleToolSection}

          {/* Appearance — always present */}
          <AppearanceSection opacity={opacity} blendMode={blendMode} supportedBlendModes={supportedBlendModes} cornerRadius={cornerRadius} opacityMixed={opacityMixed} cornerRadiusMixed={cornerRadiusMixed} blendControlled={props.blendMode !== undefined} cornerControlled={props.cornerRadius !== undefined} onOpacityChange={onOpacityChange} onBlendModeChange={onBlendModeChange} onCornerRadiusChange={onCornerRadiusChange} opacityKeyframe={keyframeControls?.opacity} cornerRadiusKeyframe={keyframeControls?.cornerRadius}
            cornerRadiusKeyframes={{ topLeft: keyframeControls?.cornerRadiusTopLeft, topRight: keyframeControls?.cornerRadiusTopRight, bottomRight: keyframeControls?.cornerRadiusBottomRight, bottomLeft: keyframeControls?.cornerRadiusBottomLeft }} />

          {/* Typography — text only */}
          {isText && <TypographySection value={typography} onChange={onTypographyChange} stylesAvailable={capabilities.styles} fonts={fonts} fontSizes={fontSizes} fontWeights={fontWeights} keyframes={keyframeControls} />}

          {/* Stackable sections */}
          <FillSection entries={fills} onAdd={onAddFill} onUpdate={onUpdateFill} onToggle={onToggleFill} onReorder={onReorderFill} onRemove={onRemoveFill}
            imageAdjustmentsReadOnly={fillImageAdjustmentsReadOnly}
            onFillTypeChange={props.onFillTypeChange} onGradientStopsChange={props.onFillGradientStopsChange}
            onFlipGradient={props.onFlipFillGradient} onRotateGradient={props.onRotateFillGradient}
            onRotateMedia={props.onRotateFillMedia}
            onChooseImage={props.onChooseFillImage} onChooseVideo={props.onChooseFillVideo}
            onOpenMediaEffects={props.onOpenFillMediaEffects}
            onImageAdjustmentChange={props.onFillImageAdjustmentChange}
            onVideoPlaybackChange={props.onFillVideoPlaybackChange}
            onApplyVideoPlaybackToAll={props.onApplyFillVideoPlaybackToAll}
            onMediaFitChange={props.onFillMediaFitChange}
            onMediaTileScaleChange={props.onFillMediaTileScaleChange}
            onEditCrop={props.onEditFillCrop}
            onEyedropperActivate={props.onFillEyedropperActivate} activeEyedropperId={props.activeFillEyedropperId}
            dropZoneSources={props.fillDropZoneSources} onSelectDropZoneSource={props.onSelectFillDropZoneSource}
            swatches={props.pageSwatches}
            capabilities={capabilities}
            activeStackDialog={activeStackDialog} onActiveStackDialogChange={setActiveStackDialog} />
          <StrokeSection entries={strokes} onAdd={onAddStroke} onUpdate={onUpdateStroke} onToggle={onToggleStroke} onReorder={onReorderStroke} onRemove={onRemoveStroke} swatches={props.pageSwatches} capabilities={capabilities}
            onEyedropperActivate={props.onStrokeEyedropperActivate} activeEyedropperId={props.activeStrokeEyedropperId}
            readOnly={strokeReadOnly} activeStackDialog={activeStackDialog} onActiveStackDialogChange={setActiveStackDialog} />
          <EffectsSection entries={effects} onAdd={onAddEffect} onUpdate={onUpdateEffect} onToggle={onToggleEffect} onReorder={onReorderEffect} onRemove={onRemoveEffect} capabilities={capabilities}
            onEyedropperActivate={props.onEffectEyedropperActivate} activeEyedropperId={props.activeEffectEyedropperId}
            activeStackDialog={activeStackDialog} onActiveStackDialogChange={setActiveStackDialog} />

          {/* Selection Colors — multi-select only (§5.8), positioned right after Effects */}
          {multiSelect && <SelectionColorsSection colors={selectionColors} onUpdate={onUpdateSelectionColor} onSelectAll={onSelectAllUsingColor}
            onEyedropperActivate={props.onSelectionColorEyedropperActivate} activeEyedropperId={props.activeSelectionColorEyedropperId}
            swatches={props.pageSwatches} capabilities={capabilities} />}

          <ExportSection animatedFormats={props.animatedExportFormats} exporting={props.exportInProgress} settings={exportSettings} mode={exportMode} animatedAvailable={props.animatedExportAvailable} frameRate={projectFrameRate} onModeChange={onExportModeChange} onFrameRateChange={onProjectFrameRateChange} targetName={exportTargetName ?? elementLabel[elementType]}
            onAdd={onAddExportSetting} onRemove={onRemoveExportSetting} onUpdate={onUpdateExportSetting} onExport={onExport} />
          {easing && <EasingInspectorSection key={easing.interactionKey} value={easing} applyScope={easingApplyScope} applyToLabel={easingApplyToLabel}
            onChange={onEasingChange} onApplyScopeChange={onEasingApplyScopeChange}
            onCurveEditStart={onEasingCurveEditStart} onCurveEditCommit={onEasingCurveEditCommit} onCurveEditCancel={onEasingCurveEditCancel} />}
          </>}
        </ScrollArea></div>
      )}

      {/* Animate tab — the animation panel.
          Comp transition is slide-scoped, so an element selection still forwards the
          slide's REAL transition (None when none) — never the internal demo 'Fade'.
          selectionType drives default card expansion: the element's Object animation
          card is the focus here, not Comp transition. */}
      {tab === "animate" && <div role="tabpanel" id="element-animate-panel" aria-labelledby="element-animate-panel-tab" className="contents"><AnimatePanel anims={objectAnimations}
        contextKey={slideId}
        selectionType="element"
        animationDelay={capabilities.animationDelay}
        objectAnimationCallbacks={objectAnimationCallbacks} objectAnimationSettings={objectAnimationSettings} addablePhases={addableAnimationPhases}
        compTransition={{ style: renderedTransitionType, direction: renderedTransitionDirection, durationMs: renderedTransitionDuration, easing: renderedTransitionEasing }}
        compTransitionCallbacks={{
          onStyleChange: value => { if (slideTransitionType === undefined) setDemoTransitionType(value); onSlideTransitionTypeChange?.(value); },
          onDirectionChange: value => { if (slideTransitionDirection === undefined) setDemoTransitionDirection(value); onSlideTransitionDirectionChange?.(value); },
          onDurationChange: value => { if (slideTransitionDuration === undefined) setDemoTransitionDuration(value); onSlideTransitionDurationChange?.(value); },
          onEasingChange: value => { if (slideTransitionEasing === undefined) setDemoTransitionEasing(value); onSlideTransitionEasingChange?.(value); },
          onCustomEasingRequest: onCustomSlideTransitionEasingRequest,
          onApplyToAll: onApplySlideTransitionToAll,
        }} /></div>}

      {/* Prototype placeholder */}
      {tab === "prototype" && (
        <div className="flex-1 flex items-center justify-center">
          <span className={clsx(FONT, "text-[11px] text-c-text-tertiary")}>Prototype settings</span>
        </div>
      )}
      </>
      )}
    </div>
    </NumericEditSessionProvider>
  );
}
