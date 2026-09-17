import { X } from "lucide-react";
import { type ReactElement, type ReactNode, useEffect, useRef, useState } from "react";
import { Slider } from "./Slider";
import { NumericInput } from "./Input";
import { SegmentedControl } from "./SegmentedControl";
import { Tabs } from "./Tabs";
import { ColorWheel } from "./ColorWheel";
import { COMPOSA_INSPECTOR_SURFACE_SELECTOR } from "./AnchoredInspectorOverlay";
import {
  COMPACT_INSPECTOR_DIALOG_WIDTH,
  InspectorDialog,
} from "./InspectorDialog";

// ─── Color Adjustments dialogs ────────────────────────────────────────────────
// effects-mental-model.md §4 "basic inline, custom → dedicated surface": the
// video Color section shows the LUT/toggle controls inline, and each deep
// adjustment group (Light, Color, Color Wheels, Creative) opens here as a
// dedicated anchored dialog mapped to the owner's Sequence reference. STRUCTURE
// ONLY — controls render at sensible defaults; the actual grade is a later WebGL
// colour pipeline, so nothing is wired to a document model or signal path.
//
// The dialog anchors to the inspector surface's left edge
// (COMPOSA_INSPECTOR_SURFACE_SELECTOR) so it clears the panel with zero overlap
// at any inspector width — the same no-overlap pattern the stroke/effects
// dialogs use.

export type ColorAdjustmentGroup = "light" | "color" | "wheels" | "creative";

interface SliderControl {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  bipolar?: boolean;
  /** CSS gradient for the track (Color adjustments use gradient-track sliders). */
  gradient?: string;
}

const GROUP_TITLES: Record<ColorAdjustmentGroup, string> = {
  light: "Light adjustments",
  color: "Color adjustments",
  wheels: "Color wheels",
  creative: "Creative adjustments",
};

// Light — plain neutral sliders (reference order).
const LIGHT_CONTROLS: SliderControl[] = [
  { key: "exposure", label: "Exposure", min: -100, max: 100, bipolar: true },
  { key: "brightness", label: "Brightness", min: -100, max: 100, bipolar: true },
  { key: "contrast", label: "Contrast", min: -100, max: 100, bipolar: true },
  { key: "highlights", label: "Highlights", min: -100, max: 100, bipolar: true },
  { key: "shadows", label: "Shadows", min: -100, max: 100, bipolar: true },
  { key: "whites", label: "Whites", min: -100, max: 100, bipolar: true },
  { key: "blacks", label: "Blacks", min: -100, max: 100, bipolar: true },
];

// Color — gradient-track sliders (reference).
const COLOR_CONTROLS: SliderControl[] = [
  { key: "temperature", label: "Temperature", min: -100, max: 100, bipolar: true, gradient: "linear-gradient(to right,#3b82f6,#ffffff,#f59e0b)" },
  { key: "tint", label: "Tint", min: -100, max: 100, bipolar: true, gradient: "linear-gradient(to right,#22c55e,#ffffff,#d946ef)" },
  { key: "saturation", label: "Saturation", min: 0, max: 200, suffix: "%", gradient: "linear-gradient(to right,#9ca3af,#ef4444)" },
  { key: "vibrance", label: "Vibrance", min: -100, max: 100, bipolar: true, gradient: "linear-gradient(to right,#9ca3af,#8b5cf6)" },
  { key: "hue", label: "Hue", min: -180, max: 180, suffix: "°", bipolar: true, gradient: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" },
];

// Creative — sliders + a Noise-type segmented control (reference).
const CREATIVE_TOP: SliderControl[] = [
  { key: "vignette", label: "Vignette", min: -100, max: 100, bipolar: true },
  { key: "radius", label: "Radius", min: 0, max: 100, suffix: "%" },
  { key: "roundness", label: "Roundness", min: 0, max: 100, suffix: "%" },
  { key: "softness", label: "Softness", min: 0, max: 100, suffix: "%" },
];
const CREATIVE_BOTTOM: SliderControl[] = [
  { key: "amount", label: "Amount", min: 0, max: 100, suffix: "%" },
  { key: "strength", label: "Strength", min: 0, max: 100, suffix: "%" },
];
const NOISE_TYPES = [
  { value: "off", label: "Off" },
  { value: "luma", label: "Luma" },
  { value: "rgb", label: "RGB" },
];

const WHEEL_TABS = [
  { value: "shadows", label: "Shadows" },
  { value: "midtones", label: "Midtones" },
  { value: "highlights", label: "Highlights" },
];
const WHEEL_SLIDERS: SliderControl[] = [
  { key: "range", label: "Range", min: 0, max: 100, suffix: "%" },
  { key: "saturation", label: "Saturation", min: 0, max: 200, suffix: "%" },
  { key: "brightness", label: "Brightness", min: -100, max: 100, bipolar: true },
];

const ROW_LABEL = "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary";

const controlDefault = (control: SliderControl) => (control.bipolar ? 0 : control.min);

// The sliders that make up each group's "modified" signal. The parent surfaces a
// compact indicator on the collapsed inspector row from these values, so the
// dialog's value state lives on the always-mounted wrapper (the anchored body
// unmounts on close), not inside the body components.
const GROUP_SLIDER_CONTROLS: Record<ColorAdjustmentGroup, SliderControl[]> = {
  light: LIGHT_CONTROLS,
  color: COLOR_CONTROLS,
  wheels: WHEEL_SLIDERS,
  creative: [...CREATIVE_TOP, ...CREATIVE_BOTTOM],
};

/** True when any of a group's controls deviates from its neutral default. */
export function colorAdjustmentGroupModified(
  group: ColorAdjustmentGroup,
  values: Record<string, number>,
  noise?: string,
): boolean {
  if (GROUP_SLIDER_CONTROLS[group].some(c => values[c.key] !== undefined && values[c.key] !== controlDefault(c))) return true;
  if (group === "creative" && noise !== undefined && noise !== "off") return true;
  return false;
}

// One slider row with the Design-tab layout: label, then the slider with a
// trailing value-field slot (space reserved for one trailing element).
// Controlled by the dialog so the collapsed row can reflect real values.
function SliderRow({ control, disabled, value, onChange }: {
  control: SliderControl; disabled: boolean; value?: number; onChange?: (v: number) => void;
}) {
  const defaultValue = controlDefault(control);
  const [internal, setInternal] = useState(defaultValue);
  const v = value ?? internal;
  const set = (n: number) => { if (value === undefined) setInternal(n); onChange?.(n); };
  return (
    <div className="flex flex-col gap-[3px] py-[4px]">
      <span className={ROW_LABEL}>{control.label}</span>
      <div className="flex items-center gap-[8px]">
        <div className="min-w-0 flex-1">
          <Slider
            value={v}
            min={control.min}
            max={control.max}
            step={control.step ?? 1}
            disabled={disabled}
            showDelta={control.bipolar}
            handleVariant={control.bipolar ? "stroke" : "fill"}
            trackVariant={control.gradient ? "gradient" : "default"}
            trackGradient={control.gradient}
            onChange={set}
          />
        </div>
        <div className="w-[52px] shrink-0">
          <NumericInput ariaLabel={`${control.label} value`} value={v}
            min={control.min} max={control.max} step={control.step ?? 1} suffix={control.suffix}
            size="small" disabled={disabled} onChange={set} scrub />
        </div>
      </div>
    </div>
  );
}

export interface ColorAdjustmentsDialogProps {
  group: ColorAdjustmentGroup;
  open: boolean;
  trigger: ReactElement;
  onClose: () => void;
  /** When false the controls render disabled (Color section not added). */
  enabled?: boolean;
  /**
   * Controlled values for the engine-backed slider keys, keyed by control key
   * (e.g. `{ exposure: 20 }`). Seeds those sliders and takes precedence over the
   * dialog's internal state. Keys NOT listed in `controlledKeys` stay
   * uncontrolled/cosmetic even if present here.
   */
  values?: Record<string, number>;
  /**
   * The slider keys that are controlled. Edits to these keys are emitted via
   * `onValueChange` (never stored internally); every other key keeps its own
   * internal state. Omit for a fully uncontrolled dialog.
   */
  controlledKeys?: readonly string[];
  /** Fires when a controlled key (one listed in `controlledKeys`) is edited. */
  onValueChange?: (key: string, value: number) => void;
  /**
   * Reports whether the group deviates from its neutral defaults, so the
   * collapsed inspector row can show a real "Modified" state instead of a
   * constant "Default". Fires on every change to the group's controls.
   */
  onModifiedChange?: (modified: boolean) => void;
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex h-[40px] items-center border-b border-c-border pl-[16px] pr-[8px]">
      <span className="flex-1 text-[11px] font-[550] text-c-text">{title}</span>
      <button type="button" aria-label="Close" onClick={onClose}
        className="flex size-[24px] items-center justify-center rounded-c-md text-c-icon-secondary hover:bg-c-bg-hover">
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

interface BodyProps {
  disabled: boolean;
  values: Record<string, number>;
  onValueChange: (key: string, value: number) => void;
}

function WheelsBody({ disabled, values, onValueChange }: BodyProps) {
  const [tab, setTab] = useState("midtones");
  return (
    <div className="flex flex-col gap-[8px] p-[12px]">
      <Tabs tabs={WHEEL_TABS} value={tab} onChange={setTab} />
      <div className="flex justify-center py-[4px]">
        <ColorWheel ariaLabel={`${tab} color wheel`} size={140} disabled={disabled} />
      </div>
      <div className="flex flex-col gap-[2px]">
        {WHEEL_SLIDERS.map(control => <SliderRow key={control.key} control={control} disabled={disabled}
          value={values[control.key]} onChange={v => onValueChange(control.key, v)} />)}
      </div>
    </div>
  );
}

function CreativeBody({ disabled, values, onValueChange, noise, onNoiseChange }: BodyProps & {
  noise: string; onNoiseChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-[2px] p-[12px]">
      {CREATIVE_TOP.map(control => <SliderRow key={control.key} control={control} disabled={disabled}
        value={values[control.key]} onChange={v => onValueChange(control.key, v)} />)}
      <div className="flex flex-col gap-[3px] py-[4px]">
        <span className={ROW_LABEL}>Noise type</span>
        <SegmentedControl ariaLabel="Noise type" segments={NOISE_TYPES} value={noise} onChange={onNoiseChange} disabled={disabled} />
      </div>
      {CREATIVE_BOTTOM.map(control => <SliderRow key={control.key} control={control} disabled={disabled}
        value={values[control.key]} onChange={v => onValueChange(control.key, v)} />)}
    </div>
  );
}

function ListBody({ controls, disabled, values, onValueChange }: BodyProps & { controls: SliderControl[] }) {
  return (
    <div className="flex flex-col gap-[2px] p-[12px]">
      {controls.map(control => <SliderRow key={control.key} control={control} disabled={disabled}
        value={values[control.key]} onChange={v => onValueChange(control.key, v)} />)}
    </div>
  );
}

export function ColorAdjustmentsDialog({
  group,
  open,
  trigger,
  onClose,
  enabled = true,
  values: controlledValues,
  controlledKeys,
  onValueChange,
  onModifiedChange,
}: ColorAdjustmentsDialogProps) {
  const disabled = !enabled;
  const title = GROUP_TITLES[group];

  // Internal value state for the UNCONTROLLED (cosmetic) keys — the wrapper is
  // always mounted (the anchored body is not), so the collapsed inspector row
  // reflects real edits across open/close. Controlled keys are overlaid from
  // props and never stored here.
  const [internalValues, setInternalValues] = useState<Record<string, number>>({});
  const [noise, setNoise] = useState("off");
  const controlled = controlledKeys ? new Set(controlledKeys) : null;
  const values = { ...internalValues, ...(controlledValues ?? {}) };
  const setValue = (key: string, value: number) => {
    if (controlled?.has(key)) { onValueChange?.(key, value); return; }
    setInternalValues(state => ({ ...state, [key]: value }));
  };

  const modified = colorAdjustmentGroupModified(group, values, noise);
  const onModifiedChangeRef = useRef(onModifiedChange);
  onModifiedChangeRef.current = onModifiedChange;
  useEffect(() => { onModifiedChangeRef.current?.(modified); }, [modified]);

  let body: ReactNode;
  if (group === "wheels") body = <WheelsBody disabled={disabled} values={values} onValueChange={setValue} />;
  else if (group === "creative") body = <CreativeBody disabled={disabled} values={values} onValueChange={setValue} noise={noise} onNoiseChange={setNoise} />;
  else body = <ListBody controls={group === "light" ? LIGHT_CONTROLS : COLOR_CONTROLS} disabled={disabled} values={values} onValueChange={setValue} />;

  return (
    <InspectorDialog
      open={open}
      onClose={onClose}
      trigger={trigger}
      ariaLabel={title}
      width={COMPACT_INSPECTOR_DIALOG_WIDTH}
      elevation={400}
      triggerClassName="block w-full"
      anchorSurfaceSelector={COMPOSA_INSPECTOR_SURFACE_SELECTOR}
    >
      <Header title={title} onClose={onClose} />
      {body}
    </InspectorDialog>
  );
}
