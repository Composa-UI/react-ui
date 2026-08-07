import { useEffect, useState, useRef, type ReactElement } from "react";
import { clsx } from "clsx";
import { Image, ImagePlus, Pipette, Plus, Minus, RotateCcw, RotateCw, ArrowLeftRight, Disc, Diamond, Search, LayoutGrid, ChevronDown, X, SquarePlay, SquareDashedMousePointer, Crop } from "lucide-react";
import { ModalBody, ModalDivider } from "./Dialog";
import { InspectorDialog } from "./InspectorDialog";
import type { AnchoredInspectorOverlayAlign } from "./AnchoredInspectorOverlay";
import { hexToHsb, hsbToHex } from "../../lib/color";
import { SingleTab, Tabs } from "./Tabs";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { Slider, PickerHandle, GradientStopHandle } from "./Slider";
import { ColorInput, NumericInput } from "./Input";
import { Button } from "./Button";
import { Dropdown } from "./Dropdown";
import { Chit } from "./Chit";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FillType = "solid" | "linear" | "radial" | "angular" | "diamond" | "image" | "video" | "drop-zone";
export type FillMode = "solid" | "gradient" | "image" | "video" | "drop-zone";
export type MediaFillFit = "fill" | "fit" | "crop" | "tile";

export interface GradientStop {
  id: string;
  position: number;
  color: string;    // hex without #
  opacity: number;  // 0–100
}

export interface ColorDialogKeyframeControl { active: boolean; onToggle: () => void; }
export interface GradientStopKeyframeControls {
  position?: ColorDialogKeyframeControl;
  color?: ColorDialogKeyframeControl;
  opacity?: ColorDialogKeyframeControl;
}

export interface ColorDialogCapabilities { styles?: boolean; variables?: boolean; libraries?: boolean; videoFill?: boolean; dropZone?: boolean; }

/** The seven image adjustments, in the order they are listed in the dialog. */
export type ImageAdjustment =
  | "exposure" | "contrast" | "saturation" | "temperature" | "tint" | "highlights" | "shadows";

/** Controlled, persisted adjustment values for one media-fill instance. */
export type ImageAdjustments = Record<ImageAdjustment, number>;

export const COLOR_DIALOG_WIDTH = 240;
export const COLOR_DIALOG_INSPECTOR_SIDE_OFFSET = 24;
export const COLOR_DIALOG_NESTED_EFFECT_SIDE_OFFSET = 100;
/** Measured Editor-Study geometry for issue #206. Kept public so consumers and proof can share one contract. */
export const COLOR_DIALOG_REFERENCE_GEOMETRY = Object.freeze({
  width: 240,
  headerHeight: 40,
  toolbarHeight: 41,
  solid: { height: 489, bodyHeight: 408, pickerSize: 208, formatRowHeight: 40 },
  gradient: { height: 297, bodyHeight: 216, typeRowHeight: 48, barWidth: 208, barHeight: 32, stopRowHeight: 32 },
  image: { height: 577, bodyHeight: 496, fitRowHeight: 48, previewSize: 208, adjustmentRowHeight: 32, adjustmentSliderWidth: 120 },
});

export interface ColorDialogProps {
  open: boolean;
  onClose: () => void;
  /** The control whose captured launch rectangle owns placement and focus return. */
  trigger: ReactElement;
  /** Compensates for the trigger's inset so the surface clears its owner by 8px. */
  sideOffset?: number;
  align?: AnchoredInspectorOverlayAlign;
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
  /** Host-backed reference toolbar actions. Omitted callbacks render no inert action. */
  onFlipGradient?: () => void;
  onRotateGradient?: () => void;
  /** Stable stop-id keyed motion bindings. Omitted controls render no diamond. */
  gradientStopKeyframes?: Record<string, GradientStopKeyframeControls>;
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
  /** Context-owned top-level modes. Gradient subtypes remain inside Gradient. */
  allowedFillModes?: readonly FillMode[];
  /** Selects which controlled representation seeds the picker model on each open session. */
  pickerSource?: "hex" | "hsb";
  /** "On this page" swatch hexes (with #). Defaults to demo swatches. */
  swatches?: string[];
  /** Host-owned composition sampler. Omitted means no inert pipette is rendered. */
  onEyedropperActivate?: (gradientStopId?: string) => void;
  /** True while the host's composition sampling mode is active. */
  eyedropperActive?: boolean;
  imageExposure?: number;
  imageContrast?: number;
  imageSaturation?: number;
  imageTemperature?: number;
  imageTint?: number;
  imageHighlights?: number;
  imageShadows?: number;
  /** Stable fill-scoped motion controls for the seven persisted adjustments. */
  imageAdjustmentKeyframes?: Partial<Record<ImageAdjustment, { active: boolean; onToggle: () => void }>>;
  /** Locked selections remain readable while sliders, numeric entry, and diamonds stay inert. */
  imageAdjustmentsReadOnly?: boolean;
  /**
   * Host-backed image picker, the same shape as `onChooseVideo`. Without it the
   * upload control is not rendered at all: it previously shipped with no handler
   * whatsoever, so the dialog advertised an upload it could never perform.
   */
  onChooseImage?: () => void;
  /** Label for the chosen image fill source, shown in place of the empty state. */
  imageSourceLabel?: string;
  /** Host-resolved object URL for the chosen image. The kit never loads assets itself. */
  imagePreviewUrl?: string;
  /**
   * Commits one image adjustment. Without it the seven sliders are not rendered:
   * they were passed a value and no `onChange`, so every drag was discarded.
   */
  onImageAdjustmentChange?: (adjustment: ImageAdjustment, value: number) => void;
  /**
   * Creates a style or variable from the current color. Without it the header's
   * "+" is not rendered — it had no handler and did nothing when pressed.
   */
  onCreateStyleOrVariable?: () => void;
  /** Label for the currently selected video fill source. */
  videoSourceLabel?: string;
  /** Host-resolved object URL for the chosen video. The kit never loads assets itself. */
  videoPreviewUrl?: string;
  /** Host-backed media picker. When absent, Video is not offered. */
  onChooseVideo?: () => void;
  /** Persisted renderer-backed fit mode for Image and Video fills. */
  mediaFit?: MediaFillFit;
  /** Host mutation for the selected media fill's fit mode. */
  onMediaFitChange?: (fit: MediaFillFit) => void;
  /** Persisted image-tile scale in percent. Figma seeds Tile at 50%. */
  mediaTileScale?: number;
  /** Motion binding for the numeric Tile scale field. */
  mediaTileScaleKeyframe?: ColorDialogKeyframeControl;
  /** Host mutation for the selected image fill's Tile scale. */
  onMediaTileScaleChange?: (scale: number) => void;
  /** Rotates the bound media fill by 90 degrees in the host document. */
  onRotateMedia?: () => void;
  /** Enters the host-owned canvas crop workflow for a bound media fill. */
  onEditCrop?: () => void;
  /**
   * Timeline TRACKS the drop zone can show. Deliberately tracks, not clips: a
   * composition need not line up with any one clip's span, so binding a drop
   * zone to a clip would break the moment the playhead left it.
   */
  dropZoneSources?: { id: string; label: string }[];
  /** The bound track, if any. Absent ⇒ the zone is empty and shows its picker. */
  dropZoneSourceId?: string;
  onSelectDropZoneSource?: (id: string) => void;
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
  if (type === "video")   return <SquarePlay size={12} strokeWidth={1.5} />;
  if (type === "drop-zone") return <SquareDashedMousePointer size={12} strokeWidth={1.5} />;
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

// `onChange` is required: the row previously took an optional handler and every
// caller omitted it, which is how seven sliders shipped as decoration.
function AdjustRow({ label, value, onChange, keyframe, disabled = false }: {
  label: string; value: number; onChange: (v: number) => void;
  keyframe?: { active: boolean; onToggle: () => void };
  disabled?: boolean;
}) {
  return (
    <div data-composa-image-adjustment-row={label.toLowerCase()} className="flex h-[32px] items-center px-[16px]">
      <span className={clsx(FONT, "w-[64px] shrink-0 truncate text-[11px] font-[450] text-c-text-secondary")}>
        {label}
      </span>
      <div data-composa-separated-field-actions className="ml-[24px] flex w-[120px] shrink-0 items-center">
        <div className={keyframe ? "w-[88px]" : "w-[120px]"}>
        <Slider ariaLabel={`${label} value`} value={value} onChange={disabled ? undefined : onChange}
          min={-100} max={100} defaultValue={0} disabled={disabled} />
        </div>
        {keyframe && <button
          type="button"
          data-composa-field-action
          aria-label={`${label} value keyframe`}
          aria-pressed={keyframe.active}
          disabled={disabled}
          onClick={() => { if (!disabled) keyframe.onToggle(); }}
          className={clsx(
            "ml-[8px] flex size-[24px] shrink-0 items-center justify-center rounded-c-sm text-c-icon-secondary hover:bg-c-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring",
            keyframe.active && "bg-c-bg-selected text-c-text-brand",
            disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
          )}
        >
          <Diamond size={11} strokeWidth={1.5} className={clsx(keyframe.active && "fill-current")} />
        </button>}
      </div>
    </div>
  );
}

const MEDIA_FIT_LABELS: Record<MediaFillFit, string> = { fill: "Fill", fit: "Fit", crop: "Crop", tile: "Tile" };

function MediaFitControl({ kind, value, onChange, tileScale, tileScaleKeyframe, onTileScaleChange, onEditCrop, onRotate, selected, onChoose }: {
  kind: "image" | "video";
  value: MediaFillFit;
  onChange?: (fit: MediaFillFit) => void;
  tileScale: number;
  tileScaleKeyframe?: ColorDialogKeyframeControl;
  onTileScaleChange?: (scale: number) => void;
  onEditCrop?: () => void;
  onRotate?: () => void;
  selected: boolean;
  onChoose?: () => void;
}) {
  if (!onChange && !onChoose && !onEditCrop && !onRotate) return null;
  const options: MediaFillFit[] = kind === "image" ? ["fill", "fit", "crop", "tile"] : ["fill", "fit", "crop"];
  return <div data-composa-media-fit-row={kind} className="flex h-[48px] items-center gap-[4px] pl-[16px] pr-[8px]">
    {onChange && <PopoverMenu
      align="left"
      className={clsx("shrink-0", kind === "image" && value === "tile" ? "w-[72px]" : "w-[96px]")}
      trigger={<Dropdown ariaLabel={`${kind === "image" ? "Image" : "Video"} fit`} value={MEDIA_FIT_LABELS[value]} fullWidth />}
    >
      {close => <Menu>
        {options.map(option => <MenuRow
          key={option}
          label={MEDIA_FIT_LABELS[option]}
          checked={option === value}
          selectionRole="radio"
          onClick={() => { onChange(option); close(); }}
        />)}
      </Menu>}
    </PopoverMenu>}
    {kind === "image" && value === "tile" && <NumericInput
      ariaLabel="Tile scale"
      value={tileScale}
      min={1}
      max={1000}
      suffix="%"
      scrub
      keyframe={tileScaleKeyframe}
      disabled={!onTileScaleChange}
      onChange={onTileScaleChange}
      className="w-[76px] shrink-0"
    />}
    <div className="ml-auto flex items-center gap-[4px]">
      {onChoose && <Btn label={`${selected ? "Replace" : "Select"} ${kind}`} onClick={onChoose}>
        <ImagePlus size={14} strokeWidth={1.5} />
      </Btn>}
      {value === "crop" && onEditCrop && <Btn label="Edit crop" onClick={onEditCrop}>
        <Crop size={14} strokeWidth={1.5} />
      </Btn>}
      {onRotate && <Btn label={`Rotate ${kind} 90 degrees`} onClick={onRotate}>
        <RotateCw size={14} strokeWidth={1.5} />
      </Btn>}
    </div>
  </div>;
}

function MediaFillPreview({ kind, sourceLabel, previewUrl, fit, tileScale }: {
  kind: "image" | "video";
  sourceLabel?: string;
  previewUrl?: string;
  fit: MediaFillFit;
  tileScale: number;
}) {
  const selected = !!sourceLabel;
  return <>
    <div
      data-composa-media-fill-preview={kind}
      data-state={previewUrl ? "bound" : "empty"}
      data-fit={fit}
      aria-label={selected ? `${kind} preview: ${sourceLabel}` : `${kind} preview: empty`}
      className="relative mx-[16px] size-[208px] shrink-0 overflow-hidden rounded-c-md bg-c-bg-secondary ring-1 ring-inset ring-c-border"
      style={!previewUrl ? {
        backgroundImage: "repeating-conic-gradient(var(--color-bg-secondary) 0% 25%, var(--color-bg) 0% 50%)",
        backgroundSize: "16px 16px",
      } : undefined}
    >
      {previewUrl && kind === "image" && fit === "tile" && <div aria-hidden className="absolute inset-0" style={{ backgroundImage: `url(${JSON.stringify(previewUrl)})`, backgroundRepeat: "repeat", backgroundSize: `${tileScale}% auto` }} />}
      {previewUrl && kind === "image" && fit !== "tile" && <img src={previewUrl} alt="" className={clsx("absolute inset-0 size-full", fit === "fit" ? "object-contain" : fit === "fill" ? "object-fill" : "object-cover")} />}
      {previewUrl && kind === "video" && <video src={previewUrl} aria-hidden muted playsInline preload="metadata" className={clsx("absolute inset-0 size-full", fit === "fit" ? "object-contain" : fit === "fill" ? "object-fill" : "object-cover")} />}
      {!previewUrl && <div className="absolute inset-0 flex items-center justify-center text-c-icon-secondary">
        {kind === "image" ? <Image size={24} strokeWidth={1.5} /> : <SquarePlay size={24} strokeWidth={1.5} />}
      </div>}
    </div>
  </>;
}

// ─── Gradient stop row ────────────────────────────────────────────────────────

/**
 * The a11y name of a stop's hex field. `ColorInput` derives its inputs' labels
 * from `ariaLabel`, and the on-bar handle focuses the field by this name when
 * the stop is tapped — so the two have to agree.
 */
const stopHexLabel = (index: number) => `Stop ${index + 1} hex`;

function StopRow({
  stop, index, keyframes, onPosition, onOpacity, onColor, onRemove, onFocusHex,
}: {
  stop: GradientStop;
  index: number;
  keyframes?: GradientStopKeyframeControls;
  onPosition: (id: string, v: number) => void;
  onOpacity: (id: string, v: number) => void;
  onColor: (id: string, hex: string) => void;
  onRemove: (id: string) => void;
  onFocusHex: (id: string) => void;
}) {
  return (
    <div data-composa-gradient-stop-row={index + 1} className="flex h-[32px] items-center gap-[8px] pl-[16px] pr-[8px]">
      {/* position % */}
      <div className={keyframes?.position ? "w-[76px]" : "w-[48px]"}>
        <NumericInput
          ariaLabel={`Stop ${index + 1} position`}
          value={stop.position}
          min={0}
          max={100}
          suffix="%"
          keyframe={keyframes?.position}
          onChange={value => onPosition(stop.id, value)}
        />
      </div>
      {/* The stop color uses the same ColorInput as the panels. `onSwatchClick`
          is what keeps the browser's native colour picker out of it: without a
          handler the swatch falls through to <input type="color">. Pressing it
          sends the user to the hex field beside it instead. */}
      <div className="flex-1 min-w-0">
        <ColorInput
          fullWidth
          ariaLabel={`Stop ${index + 1}`}
          color={`#${stop.color}`}
          opacity={stop.opacity}
          colorKeyframe={keyframes?.color}
          opacityKeyframe={keyframes?.opacity}
          onSwatchClick={() => onFocusHex(stop.id)}
          onColorChange={v => onColor(stop.id, v)}
          onOpacityChange={v => onOpacity(stop.id, v)}
        />
      </div>
      <button
        type="button"
        aria-label={`Remove stop ${index + 1}`}
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
/** The four gradient types, in the order the menu lists them. */
const GRADIENT_TYPES: { value: FillType; label: string }[] = [
  { value: "linear",  label: "Linear" },
  { value: "radial",  label: "Radial" },
  { value: "angular", label: "Angular" },
  { value: "diamond", label: "Diamond" },
];
const COLOR_FORMATS = ["Hex", "RGB", "HSL", "HSB"] as const;
type ColorFormat = (typeof COLOR_FORMATS)[number];

const byte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
const percent = (value: number) => Math.max(0, Math.min(100, value));
const normalizedHue = (value: number) => ((value % 360) + 360) % 360;
const rgbForHex = (value: string) => {
  const clean = value.replace(/^#/, "").padEnd(6, "0").slice(0, 6);
  return [0, 2, 4].map(index => parseInt(clean.slice(index, index + 2), 16) || 0) as [number, number, number];
};
const hexForRgb = (values: readonly number[]) => values.map(value => byte(value).toString(16).padStart(2, "0")).join("").toUpperCase();
const hslForHex = (value: string): [number, number, number] => {
  const [r8, g8, b8] = rgbForHex(value), r = r8 / 255, g = g8 / 255, b = b8 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let nextHue = 0;
  if (delta !== 0) {
    if (max === r) nextHue = 60 * (((g - b) / delta) % 6);
    else if (max === g) nextHue = 60 * ((b - r) / delta + 2);
    else nextHue = 60 * ((r - g) / delta + 4);
  }
  return [Math.round(normalizedHue(nextHue)), Math.round(saturation * 100), Math.round(lightness * 100)];
};
const hexForHsl = (values: readonly number[]) => {
  const h = normalizedHue(values[0]), s = percent(values[1]) / 100, l = percent(values[2]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return hexForRgb([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
};

export function ColorDialog({
  open,
  onClose,
  trigger,
  sideOffset = COLOR_DIALOG_INSPECTOR_SIDE_OFFSET,
  align = "start",
  fillType: fillTypeProp,
  onFillTypeChange,
  hue: hueProp = 0,
  saturation: satProp = 0,
  brightness: briProp = 100,
  opacity: opacityProp = 100,
  hex: hexProp = "FFFFFF",
  onHueChange,
  onHexChange,
  gradientStops: stopsProp,
  onStopsChange,
  onFlipGradient,
  onRotateGradient,
  gradientStopKeyframes,
  libraries = MOCK_LIBRARY,
  onSelectLibraryColor,
  capabilities,
  solidOnly = false,
  allowedFillModes,
  pickerSource = "hsb",
  swatches = [],
  onEyedropperActivate,
  eyedropperActive = false,
  imageExposure = 0,
  imageContrast = 0,
  imageSaturation = 0,
  imageTemperature = 0,
  imageTint = 0,
  imageHighlights = 0,
  imageShadows = 0,
  imageAdjustmentKeyframes,
  imageAdjustmentsReadOnly = false,
  onChooseImage,
  imageSourceLabel,
  imagePreviewUrl,
  onImageAdjustmentChange,
  onCreateStyleOrVariable,
  videoSourceLabel,
  videoPreviewUrl,
  onChooseVideo,
  mediaFit = "fill",
  onMediaFitChange,
  mediaTileScale = 50,
  mediaTileScaleKeyframe,
  onMediaTileScaleChange,
  onRotateMedia,
  onEditCrop,
  dropZoneSources = [],
  dropZoneSourceId,
  onSelectDropZoneSource,
}: ColorDialogProps) {
  const [fillType, setFillType] = useState<FillType>(fillTypeProp ?? "solid");
  const [activeTab, setActiveTab] = useState("custom");
  const stylesAvailable = capabilities?.styles ?? true;
  const variablesAvailable = capabilities?.variables ?? true;
  const librariesAvailable = capabilities?.libraries ?? true;
  const videoAvailable = (capabilities?.videoFill ?? false) && !!onChooseVideo;
  // Same shape as videoAvailable: the tab appears only when the host can
  // actually service it, so the dialog never offers a control that does nothing.
  const dropZoneAvailable = (capabilities?.dropZone ?? false) && !!onSelectDropZoneSource;
  const configuredModes: readonly FillMode[] = solidOnly
    ? ["solid"]
    : allowedFillModes ?? ["solid", "gradient", "image", "video", "drop-zone"];
  const modeAvailable = (mode: FillMode) => configuredModes.includes(mode) &&
    (mode !== "video" || videoAvailable) && (mode !== "drop-zone" || dropZoneAvailable);
  const boundSource = dropZoneSources.find(source => source.id === dropZoneSourceId);
  useEffect(() => { if (!librariesAvailable && activeTab === "libraries") setActiveTab("custom"); }, [activeTab, librariesAvailable]);
  const [hue,     setHue]     = useState(hueProp);
  const [hex,     setHex]     = useState(hexProp);
  const [stops,   setStops]   = useState<GradientStop[]>(stopsProp ?? DEFAULT_STOPS);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      const nextType = solidOnly ? "solid" : fillTypeProp ?? "solid";
      const nextStops = stopsProp ?? DEFAULT_STOPS;
      const gradient = nextType === "linear" || nextType === "radial" || nextType === "angular" || nextType === "diamond";
      const initialStop = gradient ? nextStops[0] : undefined;
      const initialHex = initialStop?.color ?? hexProp;
      const picker = initialStop || pickerSource === "hex" ? hexToHsb(initialHex) : { hue: hueProp, saturation: satProp ?? 100, brightness: briProp ?? 100 };
      setFillType(nextType);
      setSelectedStopId(initialStop?.id ?? null);
      setHue(picker.hue); setHex(initialHex);
      setSat(picker.saturation); setBri(picker.brightness); setStops(nextStops);
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
    commitPickerHex(nextHex);
  };

  const [colorFormat, setColorFormat] = useState<ColorFormat>("Hex");
  const handleFillType = (t: FillType) => { setFillType(t); onFillTypeChange?.(t); };
  const handleHue      = (v: number)   => {
    setHue(v);
    onHueChange?.(v);
    const nextHex = hsbToHex(v, sat, bri);
    commitPickerHex(nextHex);
  };
  const handleHex      = (v: string)   => commitPickerHex(v);
  const colorComponents = colorFormat === "RGB" ? rgbForHex(hex)
    : colorFormat === "HSL" ? hslForHex(hex) : [hue, sat, bri] as [number, number, number];
  const handleColorComponent = (index: number, value: number) => {
    const next = colorComponents.map((component, componentIndex) => componentIndex === index ? value : component);
    const nextHex = colorFormat === "RGB" ? hexForRgb(next)
      : colorFormat === "HSL" ? hexForHsl(next) : hsbToHex(next[0], next[1], next[2]);
    const nextHsb = hexToHsb(nextHex);
    setHue(nextHsb.hue); setSat(nextHsb.saturation); setBri(nextHsb.brightness);
    handleHex(nextHex);
  };

  // Stops are kept sorted by position. A gradient's ORDER is its positions, so
  // dragging a stop past its neighbour has to re-arrange the list — and the
  // preview bar, which reads the first and last entries, was drawing itself
  // backwards whenever they were not.
  const commitStops = (next: GradientStop[]) => {
    const sorted = [...next].sort((a, b) => a.position - b.position);
    setStops(sorted);
    onStopsChange?.(sorted);
  };
  const handleStopPos  = (id: string, v: number) =>
    commitStops(stops.map(x => x.id === id ? { ...x, position: Math.min(100, Math.max(0, v)) } : x));
  const handleStopOp   = (id: string, v: number) =>
    commitStops(stops.map(x => x.id === id ? { ...x, opacity: Math.min(100, Math.max(0, v)) } : x));
  const handleStopColor = (id: string, hexValue: string) =>
    commitStops(stops.map(x => x.id === id ? { ...x, color: hexValue.replace(/^#/, "") } : x));
  const isGradient = fillType === "linear" || fillType === "radial" || fillType === "angular" || fillType === "diamond";
  const commitPickerHex = (value: string) => {
    setHex(value);
    if (!isGradient) {
      onHexChange?.(value);
      return;
    }
    const stopId = selectedStopId ?? stops[0]?.id;
    if (stopId) handleStopColor(stopId, value);
  };
  const selectGradientStop = (id: string) => {
    setSelectedStopId(id);
    const stop = stops.find(item => item.id === id);
    if (!stop) return;
    const next = hexToHsb(stop.color);
    setHex(stop.color); setHue(next.hue); setSat(next.saturation); setBri(next.brightness);
  };
  const handleStopRemove = (id: string) => commitStops(stops.filter(x => x.id !== id));
  const handleStopAdd    = () =>
    commitStops([...stops, { id: String(Date.now()), position: 50, color: "888888", opacity: 100 }]);

  // ── Gradient stop handles: drag along the bar, click to edit the hex ────────
  // The handles used to render with no pointer handlers at all, and the stop's
  // swatch fell through to the browser's native colour picker. Both are handled
  // here instead: the handle drags, and selecting one focuses its hex field.
  const stopTrackRef = useRef<HTMLDivElement>(null);
  const stopListRef = useRef<HTMLDivElement>(null);
  const stopDrag = useRef<{ pointerId: number; id: string; moved: boolean } | null>(null);

  /** Stop position (0–100) under a pointer, in the handle track's own space. */
  const stopPositionAt = (clientX: number): number | null => {
    const track = stopTrackRef.current;
    if (!track) return null;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return null;
    return Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 100);
  };

  /** Focuses a stop's hex field — the only way to set a stop colour by typing. */
  const focusStopHex = (id: string) => {
    const index = stops.findIndex(stop => stop.id === id);
    if (index < 0) return;
    stopListRef.current
      ?.querySelector<HTMLInputElement>(`[aria-label="${stopHexLabel(index)}"]`)
      ?.focus();
  };

  const beginStopDrag = (id: string) => (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    selectGradientStop(id);
    stopDrag.current = { pointerId: event.pointerId, id, moved: false };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* synthetic */ }
  };
  const moveStopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = stopDrag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const position = stopPositionAt(event.clientX);
    if (position === null) return;
    active.moved = true;
    handleStopPos(active.id, position);
  };
  const endStopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = stopDrag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    stopDrag.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
    // A press that never moved is a tap: send the user to the hex field rather
    // than to the native colour picker the swatch used to open.
    if (!active.moved) focusStopHex(active.id);
  };
  const stopKeyDown = (stop: GradientStop) => (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (step === 0) return;
    event.preventDefault();
    selectGradientStop(stop.id);
    handleStopPos(stop.id, stop.position + step * (event.shiftKey ? 10 : 1));
  };

  const hueColor = `hsl(${hue}, 100%, 50%)`;
  const pickerColor = `hsl(${hue}, ${sat}%, ${(bri * (100 - sat / 2) / 100)}%)`;
  // Canvas gradient: saturation (left→right) × brightness (top→bottom)
  const canvasBg = `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, ${hueColor})`;

  // CSS needs at least two colour stops, so a lone stop is repeated to render as
  // the flat colour it is rather than dropping the declaration entirely.
  const previewStops = stops.length === 0 ? DEFAULT_STOPS : stops.length === 1 ? [stops[0], stops[0]] : stops;
  const gradientPreview = `linear-gradient(to right, ${previewStops.map(stop => `#${stop.color} ${stop.position}%`).join(", ")})`;

  // ── Header: Custom / Libraries tabs only — fill type is in the toolbar ────

  const headerTabs = librariesAvailable ? (
    <Tabs
      value={activeTab}
      onChange={setActiveTab}
      tabs={[
        { value: "custom", label: "Custom" },
        { value: "libraries", label: "Libraries" },
      ]}
    />
  ) : <SingleTab label="Custom" />;

  return (
    <InspectorDialog
      open={open}
      onClose={onClose}
      trigger={trigger}
      ariaLabel="Color"
      width={COLOR_DIALOG_WIDTH}
      sideOffset={sideOffset}
      align={align}
      elevation={400}
      className="flex flex-col"
    >

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div data-composa-color-dialog-header
        data-composa-color-dialog-mode={fillType === "solid" ? "solid" : isGradient ? "gradient" : fillType}
        className="flex h-[40px] shrink-0 items-center gap-[4px] border-b border-c-border px-[8px]">
        <h2 className="sr-only">Color</h2>
        <div className="flex min-w-0 flex-1 items-center overflow-hidden">{headerTabs}</div>
        {(stylesAvailable || variablesAvailable) && onCreateStyleOrVariable && (
          <div className="flex shrink-0 items-center gap-[4px]">
            <Btn
              label={stylesAvailable && variablesAvailable ? "New style or variable" : stylesAvailable ? "New style" : "New variable"}
              onClick={onCreateStyleOrVariable}
            >
              <Plus size={14} strokeWidth={1.5} />
            </Btn>
          </div>
        )}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          // Primary icon colour, not the muted one: close is the row's only
          // remaining action and reading as de-emphasised made it look inactive.
          className="flex size-[24px] shrink-0 items-center justify-center rounded-c-sm text-c-icon hover:bg-c-bg-hover"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Custom tab: toolbar + body ───────────────────────────────────── */}
      {activeTab === "custom" && (
        <>
          {/* Toolbar: fill-type tabs. The trailing utility icons are gone — all
              three (Blend mode, contrast check, Swap gradient) rendered with no
              onClick, so the row promised three features it did not have. */}
          {configuredModes.length > 1 && <div data-composa-color-dialog-toolbar className="flex h-[41px] shrink-0 items-center border-b border-c-border px-[8px]">
            {/* Three fill-type tabs — gradient TYPE (linear/radial/…) lives in the dropdown, not here */}
            <div className="flex items-center gap-[2px]">
              {modeAvailable("solid") && <Btn label="Solid" active={fillType === "solid"} onClick={() => handleFillType("solid")}>
                <FillTypeIcon type="solid" />
              </Btn>}
              {modeAvailable("gradient") && <Btn label="Gradient" active={isGradient} onClick={() => handleFillType(isGradient ? fillType : "linear")}>
                <FillTypeIcon type="linear" />
              </Btn>}
              {modeAvailable("image") && <Btn label="Image" active={fillType === "image"} onClick={() => handleFillType("image")}>
                <FillTypeIcon type="image" />
              </Btn>}
              {modeAvailable("video") && (
                <Btn label="Video" active={fillType === "video"} onClick={() => handleFillType("video")}>
                  <FillTypeIcon type="video" />
                </Btn>
              )}
              {modeAvailable("drop-zone") && (
                <Btn label="Drop zone" active={fillType === "drop-zone"} onClick={() => handleFillType("drop-zone")}>
                  <FillTypeIcon type="drop-zone" />
                </Btn>
              )}
            </div>
          </div>}

          <ModalBody scrollable className={clsx(
            fillType === "solid" && "h-[408px]",
            isGradient && "h-[560px]",
            fillType === "image" && onImageAdjustmentChange && "h-[496px]",
          )}>

        {/* ── SOLID ──────────────────────────────────────────────────────── */}
        {fillType === "solid" && (
          <>
            {/* Color canvas — draggable saturation/brightness picker */}
            <div
              ref={canvasRef}
              data-composa-color-picker
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

            {/* Eyedropper + hue. Paint opacity has one source: the owning row. */}
            <div data-composa-solid-slider-row className="flex h-[60px] items-center gap-[12px] px-[16px]">
              {onEyedropperActivate && <Btn label={eyedropperActive ? "Cancel color sampling" : "Sample color"} active={eyedropperActive}
                onClick={() => onEyedropperActivate(isGradient ? selectedStopId ?? stops[0]?.id : undefined)}>
                <Pipette size={14} strokeWidth={1.5} />
              </Btn>}
              <div className="flex-1 min-w-0">
                <Slider
                  value={hue} onChange={handleHue} min={0} max={360}
                  trackVariant="gradient"
                  trackGradient="linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)"
                />
              </div>
            </div>

            {/* Format dropdown (its OWN control) + value using the proper input, not combined */}
            <div data-composa-solid-format-row className="flex h-[40px] items-center gap-[8px] px-[16px]">
              <PopoverMenu
                align="left"
                className="w-[64px] shrink-0"
                trigger={
                  <Dropdown
                    ariaLabel={`Color format: ${colorFormat}`}
                    value={colorFormat}
                    fullWidth
                  />
                }
              >
                {close => (
                  <Menu>
                    {COLOR_FORMATS.map(format => (
                      <MenuRow
                        key={format}
                        type="checkmark"
                        label={format}
                        checked={format === colorFormat}
                        selectionRole="radio"
                        onClick={() => { setColorFormat(format); close(); }}
                      />
                    ))}
                  </Menu>
                )}
              </PopoverMenu>
              {colorFormat === "Hex" ? (
                <div className="flex-1 min-w-0">
                  <ColorInput fullWidth color={`#${hex}`} onColorChange={handleHex} />
                </div>
              ) : (
                <div className="flex flex-1 min-w-0 gap-[2px]">
                  {colorComponents.map((value, index) => <NumericInput
                    key={index}
                    ariaLabel={`${colorFormat} ${index + 1}`}
                    value={value}
                    min={index === 0 && colorFormat !== "RGB" ? 0 : 0}
                    max={colorFormat === "RGB" ? 255 : index === 0 ? 360 : 100}
                    onChange={next => handleColorComponent(index, next)}
                    className="min-w-0 flex-1"
                  />)}
                </div>
              )}
            </div>

            <div className="h-[8px]" />

            <div data-composa-solid-swatches className="min-h-[76px] border-t border-c-border">
              <div className="h-[36px] px-[16px] pt-[12px]">
                <span className={clsx(FONT, "text-[11px] font-[550] text-c-text")}>On this page</span>
              </div>

              <div className="flex min-h-[40px] flex-wrap items-center gap-[8px] px-[16px] py-[8px]">
                {swatches.length === 0 && <span className="text-[11px] text-c-text-secondary">No colors on this page</span>}
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
            </div>
          </>
        )}

        {/* ── GRADIENT ──────────────────────────────────────────────────── */}
        {isGradient && (
          <>
            <div data-composa-gradient-type-row className="flex h-[48px] shrink-0 items-center pl-[16px] pr-[8px]">
              <PopoverMenu
                align="left"
                className="w-[96px] shrink-0"
                trigger={<Dropdown ariaLabel="Gradient type"
                  value={GRADIENT_TYPES.find(type => type.value === fillType)?.label}
                  size="default" fullWidth />}
              >
                {close => <Menu>{GRADIENT_TYPES.map(type => <MenuRow
                  key={type.value}
                  label={type.label}
                  checked={type.value === fillType}
                  selectionRole="radio"
                  onClick={() => { handleFillType(type.value); close(); }}
                />)}</Menu>}
              </PopoverMenu>
              <div className="ml-auto flex items-center gap-[4px]">
                {onFlipGradient && <Btn label="Flip gradient" onClick={onFlipGradient}>
                  <ArrowLeftRight size={14} strokeWidth={1.5} />
                </Btn>}
                {onRotateGradient && <Btn label="Rotate gradient" onClick={onRotateGradient}>
                  <RotateCw size={14} strokeWidth={1.5} />
                </Btn>}
              </div>
            </div>

            {/* The reference puts the 24px handles 16px above a 208x32 bar. */}
            <div className="relative h-[48px] px-[16px] pt-[16px]">
              <div ref={stopTrackRef} data-composa-gradient-preview className="relative h-[32px]">
                <div className="absolute inset-0 rounded-c-sm ring-1 ring-inset ring-[rgba(0,0,0,0.1)]"
                  style={{ background: gradientPreview }} />
                {stops.map((stop, index) => (
                  <GradientStopHandle
                    key={stop.id}
                    color={`#${stop.color}`}
                    ariaLabel={`Stop ${index + 1}`}
                    position={stop.position}
                    selected={stop.id === selectedStopId}
                    style={{ position: "absolute", left: `calc(${stop.position}% - 12px)`, top: -16 }}
                    onPointerDown={beginStopDrag(stop.id)}
                    onPointerMove={moveStopDrag}
                    onPointerUp={endStopDrag}
                    onPointerCancel={endStopDrag}
                    onKeyDown={stopKeyDown(stop)}
                  />
                ))}
              </div>
            </div>

            {/* Stops header */}
            <div data-composa-gradient-stops-header className="flex h-[40px] items-center justify-between pl-[16px] pr-[8px]">
              <span className={clsx(FONT, "text-[11px] font-[550] text-c-text")}>Stops</span>
              <div className="flex items-center gap-[4px]">
                <button
                  type="button"
                  aria-label="Add gradient stop"
                  onClick={handleStopAdd}
                  className="flex items-center justify-center size-[24px] rounded-c-sm text-c-icon hover:bg-c-bg-hover"
                >
                  <Plus size={12} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div ref={stopListRef} className="pt-[4px]">
              {stops.map((stop, index) => (
                <StopRow
                  key={stop.id}
                  stop={stop}
                  index={index}
                  keyframes={gradientStopKeyframes?.[stop.id]}
                  onPosition={handleStopPos}
                  onOpacity={handleStopOp}
                  onColor={handleStopColor}
                  onRemove={handleStopRemove}
                  onFocusHex={id => { selectGradientStop(id); focusStopHex(id); }}
                />
              ))}
            </div>

            {/* The active gradient stop uses the same color editor as Solid. */}
            <div
              ref={canvasRef}
              data-composa-gradient-color-picker
              className="relative mx-[16px] mt-[8px] cursor-crosshair touch-none select-none"
              style={{ height: 208, width: 208 }}
              onPointerDown={e => { setDragging(true); updatePicker(e); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic */ } }}
              onPointerMove={e => { if (dragging) updatePicker(e); }}
              onPointerUp={e => { setDragging(false); e.currentTarget.releasePointerCapture(e.pointerId); }}
            >
              <div className="absolute inset-0 rounded-c-md overflow-hidden pointer-events-none" style={{ background: canvasBg }} />
              <div className="absolute inset-0 rounded-c-md pointer-events-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" />
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                style={{ left: (sat / 100) * 208, top: (1 - bri / 100) * 208 }}>
                <PickerHandle color={pickerColor} />
              </div>
            </div>

            <div data-composa-gradient-slider-row className="flex h-[60px] items-center gap-[12px] px-[16px]">
              {onEyedropperActivate && <Btn label={eyedropperActive ? "Cancel color sampling" : "Sample color"} active={eyedropperActive}
                onClick={() => onEyedropperActivate(selectedStopId ?? stops[0]?.id)}>
                <Pipette size={14} strokeWidth={1.5} />
              </Btn>}
              <div className="flex-1 min-w-0"><Slider value={hue} onChange={handleHue} min={0} max={360}
                trackVariant="gradient" trackGradient="linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" /></div>
            </div>

            <div data-composa-gradient-format-row className="flex h-[40px] items-center gap-[8px] px-[16px]">
              <PopoverMenu align="left" className="w-[64px] shrink-0" trigger={<Dropdown ariaLabel={`Color format: ${colorFormat}`} value={colorFormat} fullWidth />}>
                {close => <Menu>{COLOR_FORMATS.map(format => <MenuRow key={format} label={format} checked={format === colorFormat}
                  selectionRole="radio" onClick={() => { setColorFormat(format); close(); }} />)}</Menu>}
              </PopoverMenu>
              {colorFormat === "Hex" ? <div className="flex-1 min-w-0"><ColorInput fullWidth color={`#${hex}`}
                onSwatchClick={() => { const id = selectedStopId ?? stops[0]?.id; if (id) focusStopHex(id); }}
                onColorChange={handleHex} /></div>
                : <div className="flex flex-1 min-w-0 gap-[2px]">{colorComponents.map((value, index) => <NumericInput key={index}
                  ariaLabel={`${colorFormat} ${index + 1}`} value={value} min={0}
                  max={colorFormat === "RGB" ? 255 : index === 0 ? 360 : 100}
                  onChange={next => handleColorComponent(index, next)} className="min-w-0 flex-1" />)}</div>}
            </div>

            <div data-composa-gradient-swatches className="min-h-[76px] border-t border-c-border">
              <div className="h-[36px] px-[16px] pt-[12px]"><span className={clsx(FONT, "text-[11px] font-[550] text-c-text")}>On this page</span></div>
              <div className="flex min-h-[40px] flex-wrap items-center gap-[8px] px-[16px] py-[8px]">
                {swatches.length === 0 && <span className="text-[11px] text-c-text-secondary">No colors on this page</span>}
                {swatches.map(color => <button key={color} type="button" className="rounded-[3px] size-[16px] ring-1 ring-inset ring-[rgba(0,0,0,0.1)]"
                  style={{ backgroundColor: color }} aria-label={color} onClick={() => handleHex(color.replace("#", ""))} />)}
              </div>
            </div>

            <div className="pb-[12px]" />
          </>
        )}

        {/* ── IMAGE ─────────────────────────────────────────────────────── */}
        {fillType === "image" && (
          <>
            <MediaFitControl kind="image" value={mediaFit} onChange={onMediaFitChange}
              tileScale={mediaTileScale} tileScaleKeyframe={mediaTileScaleKeyframe} onTileScaleChange={onMediaTileScaleChange}
              selected={!!imageSourceLabel} onChoose={onChooseImage}
              onRotate={onRotateMedia}
              onEditCrop={imageSourceLabel && onEditCrop ? () => { onEditCrop(); onClose(); } : undefined} />
            <MediaFillPreview kind="image" sourceLabel={imageSourceLabel} previewUrl={imagePreviewUrl} fit={mediaFit} tileScale={mediaTileScale} />

            {/* Image adjustments — same rule: every slider was handed a value
                and no onChange, so each drag was thrown away. Shown only when
                the host can receive the change. */}
            {onImageAdjustmentChange && (
              <>
                <div data-composa-image-adjustments className="flex h-[232px] flex-col pt-[8px]">
                  <AdjustRow label="Exposure"    value={imageExposure}    disabled={imageAdjustmentsReadOnly} keyframe={imageAdjustmentKeyframes?.exposure} onChange={v => onImageAdjustmentChange("exposure", v)} />
                  <AdjustRow label="Contrast"    value={imageContrast}    disabled={imageAdjustmentsReadOnly} keyframe={imageAdjustmentKeyframes?.contrast} onChange={v => onImageAdjustmentChange("contrast", v)} />
                  <AdjustRow label="Saturation"  value={imageSaturation}  disabled={imageAdjustmentsReadOnly} keyframe={imageAdjustmentKeyframes?.saturation} onChange={v => onImageAdjustmentChange("saturation", v)} />
                  <AdjustRow label="Temperature" value={imageTemperature} disabled={imageAdjustmentsReadOnly} keyframe={imageAdjustmentKeyframes?.temperature} onChange={v => onImageAdjustmentChange("temperature", v)} />
                  <AdjustRow label="Tint"        value={imageTint}        disabled={imageAdjustmentsReadOnly} keyframe={imageAdjustmentKeyframes?.tint} onChange={v => onImageAdjustmentChange("tint", v)} />
                  <AdjustRow label="Highlights"  value={imageHighlights}  disabled={imageAdjustmentsReadOnly} keyframe={imageAdjustmentKeyframes?.highlights} onChange={v => onImageAdjustmentChange("highlights", v)} />
                  <AdjustRow label="Shadows"     value={imageShadows}     disabled={imageAdjustmentsReadOnly} keyframe={imageAdjustmentKeyframes?.shadows} onChange={v => onImageAdjustmentChange("shadows", v)} />
                </div>
                <div aria-hidden className="h-[8px] shrink-0" />
              </>
            )}
          </>
        )}

        {fillType === "drop-zone" && dropZoneAvailable && (
          <div className="flex flex-col gap-[8px] p-[16px]">
            {/* A drop zone is a WINDOW onto a track, so its empty state is a
                source picker rather than an upload — nothing is being added to
                the project, only pointed at. Mirrors the image/video placeholder
                so the three fill types read as siblings. */}
            <div className="flex h-[136px] items-center justify-center rounded-c-md bg-c-bg-secondary">
              <PopoverMenu
                align="left"
                trigger={
                  <Button
                    variant="Secondary"
                    icon={<SquareDashedMousePointer size={14} strokeWidth={1.5} />}
                    label={boundSource ? boundSource.label : "Select source…"}
                  />
                }
              >
                {close => (
                  <Menu>
                    {dropZoneSources.length === 0 ? (
                      <MenuRow label="No tracks yet" disabled disabledReason="Add a video to the timeline first." />
                    ) : (
                      dropZoneSources.map(source => (
                        <MenuRow
                          key={source.id}
                          label={source.label}
                          checked={source.id === dropZoneSourceId}
                          selectionRole="radio"
                          onClick={() => { onSelectDropZoneSource?.(source.id); close(); }}
                        />
                      ))
                    )}
                  </Menu>
                )}
              </PopoverMenu>
            </div>
            <span className={clsx(FONT, "text-[11px] font-[450] leading-[16px] text-c-text-secondary")}>
              {boundSource
                ? "This layer shows the track, cropped to fill its shape."
                : "Pick a timeline track to show inside this layer."}
            </span>
          </div>
        )}

        {fillType === "video" && videoAvailable && (
          <>
            <MediaFitControl kind="video" value={mediaFit === "tile" ? "fill" : mediaFit} onChange={onMediaFitChange}
              tileScale={mediaTileScale}
              selected={!!videoSourceLabel} onChoose={onChooseVideo}
              onRotate={onRotateMedia}
              onEditCrop={videoSourceLabel && onEditCrop ? () => { onEditCrop(); onClose(); } : undefined} />
            <MediaFillPreview kind="video" sourceLabel={videoSourceLabel} previewUrl={videoPreviewUrl} fit={mediaFit === "tile" ? "fill" : mediaFit} tileScale={mediaTileScale} />
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
    </InspectorDialog>
  );
}
