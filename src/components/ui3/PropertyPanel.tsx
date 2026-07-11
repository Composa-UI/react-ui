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
  Image as ImageIcon, Video, Clock,
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

export type PanelMode = "project" | "slide" | "element" | "video-clip";

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

// ─── 9×9 icon groups ──────────────────────────────────────────────────────────
// Alignment picker for auto-layout child alignment — a 3×3 DOT matrix (not icon
// glyphs), ported from the older DS's `AlignmentPicker`/`.composa-alignment-*`:
// an 88px-ish track with a subtle 2px dot per cell; the selected cell's dot grows
// into a 10px accent-colored bar. This is the anchor-point convention, distinct
// from Position's directional-icon alignment (AlignLeft/Center/Right).

function AlignmentGrid({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (v: string) => void;
}) {
  const cells = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];
  const labels: Record<string, string> = {
    tl: "Top left", tc: "Top center", tr: "Top right",
    ml: "Middle left", mc: "Middle center", mr: "Middle right",
    bl: "Bottom left", bc: "Bottom center", br: "Bottom right",
  };

  return (
    <div
      role="radiogroup"
      aria-label="Alignment"
      className="shrink-0 grid grid-cols-3 grid-rows-3 place-items-center w-[88px] h-[56px] py-[4px] rounded-c-md bg-c-bg-secondary box-border"
    >
      {cells.map(cell => {
        const selected = value === cell;
        return (
          <button
            key={cell}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={labels[cell]}
            onClick={() => onChange?.(cell)}
            className="w-[16px] h-[12px] grid place-items-center rounded-c-sm bg-transparent hover:bg-c-bg-hover"
          >
            <span
              className={clsx(
                "h-[2px] rounded-[2px] transition-[width]",
                selected ? "w-[10px] bg-c-border-selected" : "w-[2px] bg-c-icon-tertiary",
              )}
            />
          </button>
        );
      })}
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
  /** Auto-layout is reached from here two ways: the "+" button, or moving Flow
   * off its first ("Freeform") option. Both call this. */
  onEnableAutoLayout?: () => void;
}

function LayoutFrameSection({
  width = 0, height = 0, cornerRadius = 0,
  clipContent = false,
  onWidthChange, onHeightChange,
  onEnableAutoLayout,
}: LayoutFrameProps) {
  const [lockAspect, setLockAspect] = useState(false);
  // Plain frame defaults to Freeform (no auto-layout yet) — NOT "v", which would
  // already imply vertical auto-layout while this is the "no auto-layout" section.
  const [flow, setFlow] = useState("none");

  const flowBtns: IconBtn[] = [
    { icon: <AlignHorizontalJustifyCenter size={S} strokeWidth={1.5} />, label: "Freeform", value: "none" },
    { icon: <Columns size={S} strokeWidth={1.5} />, label: "Horizontal", value: "h" },
    { icon: <Rows2 size={S} strokeWidth={1.5} />, label: "Vertical", value: "v" },
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
        left={<SegmentedControl segments={flowBtns.map(b => ({ value: b.value!, icon: b.icon }))} value={flow} onChange={handleFlowChange} className="w-full" />}
      />

      {/* W / H — same ComboInput used by auto-layout's Dimensions row, so the
          control doesn't change shape when auto-layout is enabled */}
      <PanelFieldRow
        label="Dimensions"
        left={<ComboInput iconLead={<span className={FONT}>W</span>} value={String(width)} onInputChange={v => onWidthChange?.(Number(v))} className="w-full" />}
        right={<ComboInput iconLead={<span className={FONT}>H</span>} value={String(height)} onInputChange={v => onHeightChange?.(Number(v))} className="w-full" />}
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
  /** Flow's first (Freeform) option means "not auto-layout" — selecting it
   * reverts to the plain Layout section, symmetric with how Layout's Flow
   * reaches auto-layout by moving off its own first option. */
  onDisableAutoLayout?: () => void;
}

function LayoutAutoSection({
  width = 240, height = 0,
  widthMode = "hug", heightMode = "fill",
  gap = 0,
  paddingTop = 16, paddingRight = 0, paddingBottom = 8, paddingLeft = 0,
  alignValue = "mc",
  onDisableAutoLayout,
}: LayoutAutoProps) {
  const [lockAspect, setLockAspect] = useState(false);
  const [flow, setFlow] = useState("v");
  const [align, setAlign] = useState(alignValue);
  const [indivPadding, setIndivPadding] = useState(false);
  const subLabel = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary mb-[3px]");

  // Freeform first, matching the regular Layout section's Flow order.
  const flowBtns: IconBtn[] = [
    { icon: <AlignHorizontalJustifyCenter size={S} strokeWidth={1.5} />, label: "Freeform", value: "none" },
    { icon: <Columns  size={S} strokeWidth={1.5} />, label: "Horizontal",  value: "h" },
    { icon: <Rows2    size={S} strokeWidth={1.5} />, label: "Vertical",    value: "v" },
    { icon: <WrapText size={S} strokeWidth={1.5} />, label: "Wrap",        value: "wrap" },
  ];

  const handleFlowChange = (v: string) => {
    setFlow(v);
    if (v === "none") onDisableAutoLayout?.();
  };

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
        left={<SegmentedControl segments={flowBtns.map(b => ({ value: b.value!, icon: b.icon }))} value={flow} onChange={handleFlowChange} className="w-full" />}
      />

      {/* W / H — same ComboInput as the regular (non-auto) Layout section, so the
          control doesn't change shape between the two Layout variants */}
      <PanelFieldRow
        label="Dimensions"
        left={<ComboInput iconLead={<span className={FONT}>W</span>} value={String(width)} className="w-full" />}
        right={<ComboInput iconLead={<span className={FONT}>H</span>} value={String(height)} className="w-full" />}
        rightAction={
          <PanelActionBtn
            icon={lockAspect ? <Link2 size={16} strokeWidth={1.5} /> : <Link2Off size={16} strokeWidth={1.5} />}
            label="Lock aspect ratio"
            active={lockAspect}
            onClick={() => setLockAspect(v => !v)}
          />
        }
      />

      {/* Alignment + Gap — Alignment is a fixed 88px matrix (not fluid like a
          typical dual-field row); Gap fills the remainder; the settings icon
          sits in the standard reserved 24px right-action slot. Gap's "Auto" is
          the gap MODE (Fixed px vs Auto/space-between distribution). */}
      <div className="pl-[16px] pr-[16px] py-[8px]">
        <div className="flex items-start gap-[8px]">
          <div className="shrink-0">
            <div className={subLabel}>Alignment</div>
            <AlignmentGrid value={align} onChange={setAlign} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={subLabel}>Gap</div>
            <div className="flex flex-col gap-[4px]">
              <NumericInput
                iconLead={<span className={FONT}>{"]·["}</span>}
                defaultValue={gap} min={0} suffix="px"
              />
              <Dropdown value="Auto" fullWidth />
            </div>
          </div>
          {/* mt matches the sub-label's box (14px leading + 3px margin) so this
              aligns with the Gap input row, not the "Gap" label above it */}
          <div className="shrink-0 flex items-start min-w-[24px] justify-end mt-[17px]">
            <PanelActionBtn icon={<Settings2 size={16} strokeWidth={1.5} />} label="Gap settings" />
          </div>
        </div>
      </div>

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
              <NumericInput iconLead={<span className={FONT}>↑</span>} defaultValue={paddingTop}    min={0} />
              <NumericInput iconLead={<span className={FONT}>→</span>} defaultValue={paddingRight}  min={0} />
              <NumericInput iconLead={<span className={FONT}>↓</span>} defaultValue={paddingBottom} min={0} />
              <NumericInput iconLead={<span className={FONT}>←</span>} defaultValue={paddingLeft}   min={0} />
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
              <NumericInput iconLead={<span className={FONT}>↕</span>} defaultValue={paddingTop} min={0} />
            </div>
            <div className="flex-1 min-w-0">
              <NumericInput iconLead={<span className={FONT}>↔</span>} defaultValue={paddingLeft} min={0} />
            </div>
            <PanelActionBtn
              icon={<Maximize size={16} strokeWidth={1.5} />}
              label="Independent padding"
              onClick={() => setIndivPadding(true)}
            />
          </div>
        )}
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

// ─── Project mode sections (inspector-project-mode.md) ───────────────────────
// Active when nothing is selected. Header label "Project"; body = Canvas,
// Master timeline, Export (stub).

// Canvas §Canvas — Aspect ratio (segmented, Custom trailing), Dimensions W|H (px),
// Frame rate (dropdown). Presets are presentational here; Custom just unlocks the
// segmented state visually.
function CanvasSection({
  width = 1920,
  height = 1080,
}: {
  width?: number;
  height?: number;
}) {
  const [aspect, setAspect] = useState("16:9");
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
            defaultValue={width}
            min={1}
            suffix="px"
          />
        }
        right={
          <NumericInput
            iconLead={<span className={FONT}>H</span>}
            defaultValue={height}
            min={1}
            suffix="px"
          />
        }
      />

      {/* Frame rate — dropdown (full width) */}
      <PanelFieldRow
        label="Frame rate"
        reserveRightSlot={false}
        left={<Dropdown value="30 fps" fullWidth />}
      />
    </PanelSection>
  );
}

// Master timeline §Master timeline — Total duration (s), Playhead (s).
function MasterTimelineSection({
  totalDuration = 30,
  playhead = 0,
}: {
  totalDuration?: number;
  playhead?: number;
}) {
  return (
    <PanelSection title="Master timeline">
      <DualField
        leftLabel="Total duration"
        left={
          <NumericInput
            iconLead={<span className={FONT}>T</span>}
            defaultValue={totalDuration}
            min={0}
            suffix="s"
          />
        }
        rightLabel="Playhead"
        right={
          <NumericInput
            iconLead={<span className={FONT}>▸</span>}
            defaultValue={playhead}
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
        left={<Dropdown value="MP4" fullWidth disabled />}
      />
      <PanelFullRow height={40}>
        <Button label="Export project" variant="Secondary" size="wide" disabled />
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
  start = 0,
  end = 5,
}: {
  title?: string;
  start?: number;
  end?: number;
}) {
  return (
    <PanelSection title={title}>
      <PanelFieldRow
        label="Range"
        reserveRightSlot={false}
        left={
          <NumericInput
            iconLead={<span className={clsx(FONT, "text-[10px]")}>Start</span>}
            defaultValue={start}
            min={0}
            suffix="s"
          />
        }
        right={
          <NumericInput
            iconLead={<span className={clsx(FONT, "text-[10px]")}>End</span>}
            defaultValue={end}
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
            iconLead={<span className={FONT}>↔</span>}
            defaultValue={Math.max(0, end - start)}
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
function SlideBackgroundSection() {
  const [fillType, setFillType] = useState("solid");
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
            onChange={setFillType}
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
              color="#1e1e1e"
              opacity={100}
              onSwatchClick={() => setColorOpen(true)}
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

      <ColorDialog open={colorOpen} onClose={() => setColorOpen(false)} hex="1e1e1e" />
    </PanelSection>
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
    <PanelSection title="Source">
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
}: {
  trimIn?: number;
  trimOut?: number;
}) {
  return (
    <PanelSection title="Trim">
      <DualField
        leftLabel="Trim in"
        left={<NumericInput iconLead={<Crosshair size={16} strokeWidth={1.5} />} defaultValue={trimIn} min={0} suffix="s" />}
        rightLabel="Trim out"
        right={<NumericInput iconLead={<Crosshair size={16} strokeWidth={1.5} />} defaultValue={trimOut} min={0} suffix="s" />}
      />
      <PanelFullRow label="Clipped duration" height={24}>
        <span className={clsx(FONT, "text-[11px] text-c-text-secondary")}>{Math.max(0, trimOut - trimIn)}s</span>
      </PanelFullRow>
    </PanelSection>
  );
}

// Playback §Playback — Speed dropdown (default 1x); Volume deferred to V2
// (disabled row, "Audio coming soon" per spec).
function ClipPlaybackSection({ speed = "1x" }: { speed?: string }) {
  return (
    <PanelSection title="Playback">
      <DualField
        leftLabel="Speed"
        left={<Dropdown value={speed} fullWidth />}
        rightLabel="Volume"
        right={
          <div className="w-full" title="Audio coming soon">
            <Dropdown value="—" disabled fullWidth />
          </div>
        }
      />
    </PanelSection>
  );
}

// ─── PropertyPanel ────────────────────────────────────────────────────────────

export interface PropertyPanelProps {
  /** Inspector mode. Defaults to "element" — the current selection inspector. */
  mode?: PanelMode;
  elementType?: ElementType;
  multiSelect?: boolean;
  x?: number; y?: number; rotation?: number;
  onXChange?: (value: number) => void;
  onYChange?: (value: number) => void;
  onRotationChange?: (value: number) => void;
  width?: number; height?: number;
  onWidthChange?: (value: number) => void;
  onHeightChange?: (value: number) => void;
  opacity?: number;
  onOpacityChange?: (value: number) => void;
  blendMode?: BlendMode;
  /** Slide mode — initial slide name shown in the header text field. */
  slideName?: string;
  /** Video Clip mode — initial clip name shown in the header text field. */
  clipName?: string;
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
        icon={<Play size={18} strokeWidth={1.5} />}
        onIconClick={() => {}}
        onChevronClick={() => {}}
      />
      <Button label="Share" variant="Primary" size="large" />
    </div>
  );
}

export function PropertyPanel({
  mode = "element",
  elementType = "text",
  multiSelect = false,
  x = 0, y = 0, rotation = 0,
  onXChange, onYChange, onRotationChange,
  width = 1200, height = 115,
  onWidthChange, onHeightChange,
  opacity = 100,
  onOpacityChange,
  blendMode = "Pass through",
  slideName = "Slide 1",
  clipName = "hero-cover",
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
  const isShape    = elementType === "shape";
  const isInstance = elementType === "component";

  // Auto-layout is reachable from a plain frame two ways: the Layout header's "+"
  // button, or moving Flow off its first ("Freeform") option — both just flip this.
  const isFrameLike = elementType === "frame" || elementType === "frame-auto";
  const [autoLayoutOn, setAutoLayoutOn] = useState(elementType === "frame-auto");
  const isFrame = isFrameLike && !autoLayoutOn;
  const isAutoLayout = isFrameLike && autoLayoutOn;

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
      {/* Multiplayer tools — above the tabs; shared across all modes */}
      <MultiplayerBar />

      {/* ── PROJECT mode (inspector-project-mode.md) ─────────────────────────
          Active when nothing is selected. Static "Project" header, no tabs. */}
      {mode === "project" && (
        <ScrollArea>
          {/* Panel header — static "Project" label */}
          <div className="h-[40px] flex items-center px-[16px] border-b border-c-border">
            <span className={clsx(FONT, "text-[11px] font-[550] text-c-text")}>Project</span>
          </div>

          <CanvasSection width={width} height={height} />
          <MasterTimelineSection />
          <ProjectExportSection />
        </ScrollArea>
      )}

      {/* ── SLIDE mode (inspector-slide-mode.md) ─────────────────────────────
          Active when a slide is selected. Header = slide-name field + options,
          no tabs. */}
      {mode === "slide" && (
        <ScrollArea>
          {/* Panel header — inline-editable slide name + options IconButton */}
          <div className="h-[40px] flex items-center gap-[8px] px-[16px] border-b border-c-border">
            <div className="flex-1 min-w-0">
              <InputField defaultValue={slideName} placeholder="Slide name" />
            </div>
            <PopoverMenu
              align="right"
              trigger={<PanelActionBtn icon={<MoreHorizontal size={16} strokeWidth={1.5} />} label="Slide options" />}
            >
              {(close) => (
                <Menu minWidth={180}>
                  <MenuRow type="simple" label="Duplicate slide" onClick={close} />
                  <MenuRow type="simple" label="Delete slide" onClick={close} />
                </Menu>
              )}
            </PopoverMenu>
          </div>

          {/* Slide template first, ahead of Timing (user's preferred order). */}
          <TemplateStyleSection />
          <SlideTimingSection />
          <SlideBackgroundSection />
          {/* Selection colors — reuse the existing element-mode section */}
          <SelectionColorsSection />
        </ScrollArea>
      )}

      {/* ── VIDEO CLIP mode (video-clip-inspector-mode.md) ───────────────────
          Active exclusively when a base-video clip block is selected in the
          master timeline (not a slide — Slides/Layers panels don't update).
          Header = clip-name field only, per spec — NO options-menu affordance
          (Slide mode has one; the spec doesn't carry it over here, which reads
          as a possible spec gap rather than an intentional omission — flagging
          rather than silently adding one). No tabs, no dialogs. */}
      {mode === "video-clip" && (
        <ScrollArea>
          <div className="h-[40px] flex items-center gap-[8px] px-[16px] border-b border-c-border">
            <div className="flex-1 min-w-0">
              <InputField defaultValue={clipName} placeholder="Clip name" />
            </div>
          </div>

          <ClipSourceSection />
          {/* Demo data kept consistent per spec: Clipped duration (trimOut −
              trimIn = 8s) equals the Timeline duration (end − start = 8s). */}
          <SlideTimingSection title="Timeline" start={0} end={8} />
          <ClipTrimSection trimIn={10} trimOut={18} />
          <ClipPlaybackSection />
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
          <PositionSection
            x={x} y={y} rotation={rotation}
            onXChange={onXChange} onYChange={onYChange} onRotationChange={onRotationChange}
          />

          {/* Layout — polymorphic */}
          {(isFrame)       && <LayoutFrameSection width={width} height={height} onWidthChange={onWidthChange} onHeightChange={onHeightChange} onEnableAutoLayout={() => setAutoLayoutOn(true)} />}
          {(isAutoLayout)  && <LayoutAutoSection  width={width} height={height} onDisableAutoLayout={() => setAutoLayoutOn(false)} />}
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
                left={<ComboInput iconLead={<span className={FONT}>W</span>} value={String(width)} onInputChange={value => onWidthChange?.(Number(value) || 1)} className="w-full" />}
                right={<ComboInput iconLead={<span className={FONT}>H</span>} value={String(height)} onInputChange={value => onHeightChange?.(Number(value) || 1)} className="w-full" />}
                rightAction={
                  <PanelActionBtn icon={<Link2Off size={16} strokeWidth={1.5} />} label="Lock aspect ratio" />
                }
              />
              {/* Corner radius moved to Appearance */}
            </PanelSection>
          )}

          {/* Appearance — always present */}
          <AppearanceSection opacity={opacity} blendMode={blendMode} onOpacityChange={onOpacityChange} />

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
      </>
      )}
    </Panel>
  );
}
