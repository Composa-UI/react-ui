import { X } from "lucide-react";
import { type ReactElement } from "react";
import { Dial } from "./Dial";
import { Slider } from "./Slider";
import {
  COMPACT_INSPECTOR_DIALOG_WIDTH,
  InspectorDialog,
} from "./InspectorDialog";

// ─── Color Adjustments dialogs ────────────────────────────────────────────────
// effects-mental-model.md §4 "Basic inline, custom → dedicated surface": the
// video Color section shows the common LUT/toggle controls inline, and each deep
// adjustment group (Light, Color, Color Wheels, Creative) opens here as a
// dedicated anchored dialog. STRUCTURE ONLY — these controls render at sensible
// defaults; the actual grade is a later WebGL colour pipeline (see the render
// spike), so nothing here is wired to a document model or signal path yet.

export type ColorAdjustmentGroup = "light" | "color" | "wheels" | "creative";

export interface ColorAdjustmentControl {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  /** Bipolar controls centre at 0 and show a delta marker from default. */
  bipolar?: boolean;
}

interface GroupSpec {
  title: string;
  /** Slider rows (the "light" style adjustments). */
  sliders: ColorAdjustmentControl[];
  /** Dial rows, rendered in a wrapped grid (color wheels / creative knobs). */
  dials?: ColorAdjustmentControl[];
}

// The parameter sets mirror a standard grade panel. They exist so the shell reads
// as the real inspector; values are local/default until the colour engine lands.
export const COLOR_ADJUSTMENT_GROUPS: Record<ColorAdjustmentGroup, GroupSpec> = {
  light: {
    title: "Light adjustments",
    sliders: [
      { key: "exposure", label: "Exposure", min: -100, max: 100, bipolar: true },
      { key: "contrast", label: "Contrast", min: -100, max: 100, bipolar: true },
      { key: "highlights", label: "Highlights", min: -100, max: 100, bipolar: true },
      { key: "shadows", label: "Shadows", min: -100, max: 100, bipolar: true },
      { key: "whites", label: "Whites", min: -100, max: 100, bipolar: true },
      { key: "blacks", label: "Blacks", min: -100, max: 100, bipolar: true },
    ],
  },
  color: {
    title: "Color adjustments",
    sliders: [
      { key: "temperature", label: "Temperature", min: -100, max: 100, bipolar: true },
      { key: "tint", label: "Tint", min: -100, max: 100, bipolar: true },
      { key: "hue", label: "Hue", min: -180, max: 180, suffix: "°", bipolar: true },
      { key: "saturation", label: "Saturation", min: 0, max: 200, suffix: "%" },
      { key: "vibrance", label: "Vibrance", min: -100, max: 100, bipolar: true },
    ],
  },
  wheels: {
    title: "Color wheels",
    sliders: [],
    // Lift / Gamma / Gain luminance knobs. A true chroma puck per wheel is part of
    // the colour-engine effort; here each wheel exposes its master luminance dial.
    dials: [
      { key: "lift", label: "Lift", min: -100, max: 100, bipolar: true },
      { key: "gamma", label: "Gamma", min: -100, max: 100, bipolar: true },
      { key: "gain", label: "Gain", min: -100, max: 100, bipolar: true },
      { key: "offset", label: "Offset", min: -100, max: 100, bipolar: true },
    ],
  },
  creative: {
    title: "Creative adjustments",
    sliders: [
      { key: "bloom", label: "Bloom", min: 0, max: 100, suffix: "%" },
      { key: "halation", label: "Halation", min: 0, max: 100, suffix: "%" },
      { key: "grain", label: "Film grain", min: 0, max: 100, suffix: "%" },
      { key: "vignette", label: "Vignette", min: -100, max: 100, bipolar: true },
      { key: "fade", label: "Fade", min: 0, max: 100, suffix: "%" },
    ],
  },
};

export interface ColorAdjustmentsDialogProps {
  group: ColorAdjustmentGroup;
  open: boolean;
  trigger: ReactElement;
  onClose: () => void;
  /** When false the controls render disabled (Color section toggle is off). */
  enabled?: boolean;
}

const ROW_LABEL = "w-[84px] shrink-0 text-[11px] leading-[16px] font-[450] text-c-text-secondary";

function SliderRow({ control, disabled }: { control: ColorAdjustmentControl; disabled: boolean }) {
  const mid = control.bipolar ? 0 : Math.round((control.min + control.max) / 2);
  return (
    <div className="flex min-h-[32px] items-center gap-[8px]">
      <span className={ROW_LABEL}>{control.label}</span>
      <div className="min-w-0 flex-1">
        <Slider
          defaultValue={control.bipolar ? 0 : mid}
          min={control.min}
          max={control.max}
          step={control.step ?? 1}
          disabled={disabled}
          showDelta={control.bipolar}
          handleVariant={control.bipolar ? "stroke" : "fill"}
        />
      </div>
    </div>
  );
}

export function ColorAdjustmentsDialog({
  group,
  open,
  trigger,
  onClose,
  enabled = true,
}: ColorAdjustmentsDialogProps) {
  const spec = COLOR_ADJUSTMENT_GROUPS[group];
  const disabled = !enabled;

  return (
    <InspectorDialog
      open={open}
      onClose={onClose}
      trigger={trigger}
      ariaLabel={spec.title}
      width={COMPACT_INSPECTOR_DIALOG_WIDTH}
      elevation={400}
      triggerClassName="shrink-0"
    >
      <div className="flex h-[40px] items-center border-b border-c-border pl-[16px] pr-[8px]">
        <span className="flex-1 text-[11px] font-[550] text-c-text">{spec.title}</span>
        <button type="button" aria-label="Close" onClick={onClose}
          className="flex size-[24px] items-center justify-center rounded-c-md text-c-icon-secondary hover:bg-c-bg-hover">
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex flex-col gap-[4px] p-[12px]">
        {spec.sliders.map(control => (
          <SliderRow key={control.key} control={control} disabled={disabled} />
        ))}

        {spec.dials && (
          <div className="flex flex-wrap justify-between gap-y-[8px] pt-[4px]">
            {spec.dials.map(control => (
              <Dial
                key={control.key}
                size="small"
                label={control.label}
                defaultValue={0}
                min={control.min}
                max={control.max}
                step={control.step ?? 1}
                suffix={control.suffix}
                disabled={disabled}
              />
            ))}
          </div>
        )}

        {disabled && (
          <p className="pt-[4px] text-[11px] leading-[16px] text-c-text-tertiary">
            Turn on Color to edit these adjustments.
          </p>
        )}
      </div>
    </InspectorDialog>
  );
}
