import type { ReactElement, ReactNode } from "react";
import {
  AlignJustify,
  CaseLower,
  CaseSensitive,
  CaseUpper,
  Minus,
  Strikethrough,
  Underline,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { InspectorDialog, COMPACT_INSPECTOR_DIALOG_WIDTH } from "./InspectorDialog";
import { NumericInput } from "./Input";
import { SegmentedControlGroup, SegmentedControlItem } from "./SegmentedControl";
import { Slider } from "./Slider";
import { iconForSemantic } from "./IconSemantics";

const FONT = "font-[family-name:var(--composa-font-family)]";

const LineHeightIcon = iconForSemantic("line-height");
const LetterSpacingIcon = iconForSemantic("letter-spacing");
// Horizontal text axis — paragraph text-align glyphs (align text within its
// box). Wired to the canonical `text-align-*` semantics (#495) instead of the
// object-align box glyphs.
const HorizontalLeftIcon = iconForSemantic("text-align-left");
const HorizontalCenterIcon = iconForSemantic("text-align-center-x");
const HorizontalRightIcon = iconForSemantic("text-align-right");
// Vertical text axis — reuse the canonical vertical align semantics so the
// "Vertical trim" row is wired to the CORRECT (vertical) axis with the CORRECT
// icons (see #495: the inspector row's vertical group wrongly fired the
// horizontal axis and used the wrong glyphs).
const VerticalTopIcon = iconForSemantic("text-align-top");
const VerticalCenterIcon = iconForSemantic("text-align-center");
const VerticalBottomIcon = iconForSemantic("text-align-bottom");

/* ─── Value contract ─────────────────────────────────────────────────────── */

export type TextHorizontalAlign = "left" | "center" | "right" | "justify";
export type TextVerticalAlign = "top" | "middle" | "bottom";
export type TextDecoration = "none" | "underline" | "strikethrough";
export type TextCase = "none" | "upper" | "lower" | "title";

/** 100–900 stepped variable-weight axis. */
export const WEIGHT_MIN = 100;
export const WEIGHT_MAX = 900;
export const WEIGHT_STEP = 100;
/** Named weights the document model exposes: regular 400 · medium 500 · bold 700. */
export const NAMED_WEIGHTS = { regular: 400, medium: 500, bold: 700 } as const;

export interface TypeSettingsValue {
  lineHeight: number;
  letterSpacing: number;
  align: TextHorizontalAlign;
  verticalAlign: TextVerticalAlign;
  decoration?: TextDecoration;
  textCase?: TextCase;
  /** Variable-font weight (100–900). Falls back to regular (400) when absent. */
  weight?: number;
  /** Font family used only to render the preview sample. */
  fontFamily?: string;
  // Mixed-selection truth: a control shows no concrete active value when its
  // field differs across the selection, rather than fabricating one.
  lineHeightMixed?: boolean;
  letterSpacingMixed?: boolean;
  alignMixed?: boolean;
  verticalAlignMixed?: boolean;
  decorationMixed?: boolean;
  textCaseMixed?: boolean;
  weightMixed?: boolean;
}

export type TypeSettingsPatch = Partial<
  Pick<
    TypeSettingsValue,
    "lineHeight" | "letterSpacing" | "align" | "verticalAlign" | "decoration" | "textCase" | "weight"
  >
>;

export interface TypeSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  trigger: ReactElement;
  value: TypeSettingsValue;
  /** Locked / inherited-lock selection: values stay readable but mutation is disabled. */
  readOnly?: boolean;
  /** Whether the document model supports justified alignment. Default true. */
  justifySupported?: boolean;
  onChange?: (patch: TypeSettingsPatch) => void;
}

/* ─── Shared field primitives ────────────────────────────────────────────── */

const ROW_LABEL = clsx(FONT, "w-[72px] shrink-0 text-[11px] leading-[16px] font-[450] text-c-text-secondary");

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[32px] items-center gap-[8px]">
      <span className={ROW_LABEL}>{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  disabledExplanation?: string;
}

/**
 * A single-select segmented toggle group wired to one axis. Mixed selections
 * render with no active segment (`selected=false` everywhere) and announce
 * "Mixed" through the group aria-label instead of lying about a concrete value.
 */
function ChoiceGroup<T extends string>({
  ariaLabel,
  value,
  options,
  mixed,
  disabled,
  onChange,
}: {
  ariaLabel: string;
  value: T;
  options: ReadonlyArray<ChoiceOption<T>>;
  mixed?: boolean;
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  const active = options.find(option => option.value === value);
  return (
    <SegmentedControlGroup
      role="radiogroup"
      aria-label={`${ariaLabel}: ${mixed ? "Mixed" : active?.label ?? "None"}`}
      className="w-full p-[1px]"
    >
      {options.map(option => (
        <SegmentedControlItem
          key={option.value}
          role="radio"
          selected={!mixed && option.value === value}
          aria-checked={!mixed && option.value === value}
          aria-label={option.disabled && option.disabledExplanation ? `${option.label}: unavailable` : option.label}
          title={option.disabled ? option.disabledExplanation : undefined}
          disabled={disabled || option.disabled}
          icon={option.icon}
          onClick={() => !(disabled || option.disabled) && onChange(option.value)}
        />
      ))}
    </SegmentedControlGroup>
  );
}

/* ─── Preview ────────────────────────────────────────────────────────────── */

const CASE_TRANSFORM: Record<TextCase, string> = {
  none: "none",
  upper: "uppercase",
  lower: "lowercase",
  title: "capitalize",
};

function PreviewBox({ value }: { value: TypeSettingsValue }) {
  const decoration = value.decoration ?? "none";
  const textCase = value.textCase ?? "none";
  const weight = value.weight ?? NAMED_WEIGHTS.regular;
  const textAlign = value.align === "justify" ? "justify" : value.align;
  return (
    <div
      aria-hidden
      className="flex h-[72px] items-center rounded-c-md bg-c-bg-secondary px-[12px]"
      style={{ justifyContent: value.align === "center" ? "center" : value.align === "right" ? "flex-end" : "flex-start" }}
    >
      <span
        className="truncate text-c-text-secondary"
        style={{
          fontFamily: value.fontFamily ? `'${value.fontFamily}', sans-serif` : undefined,
          fontWeight: weight,
          fontSize: 16,
          lineHeight: value.lineHeight ? `${value.lineHeight}px` : undefined,
          letterSpacing: value.letterSpacing ? `${value.letterSpacing / 100}em` : undefined,
          textAlign,
          textTransform: CASE_TRANSFORM[textCase] as never,
          textDecorationLine:
            decoration === "underline" ? "underline" : decoration === "strikethrough" ? "line-through" : "none",
        }}
      >
        Preview
      </span>
    </div>
  );
}

/* ─── Dialog ─────────────────────────────────────────────────────────────── */

const ICON = { size: 16, strokeWidth: 1.5 } as const;

/**
 * Anchored, non-modal typography settings surface. Adapted from the owner's
 * reference export (Basics + Variable panels) into canonical @composa/ui
 * primitives + tokens. It exposes only host-backed properties; every enabled
 * control mutates through the supplied `onChange` adapter and participates in
 * the app's undo/redo + persistence. Unsupported reference fields (list style,
 * paragraph spacing, truncation, OpenType/details, small-caps) are omitted per
 * the #431 capability boundary rather than shipped inert.
 */
export function TypeSettingsDialog({
  open,
  onClose,
  trigger,
  value,
  readOnly = false,
  justifySupported = true,
  onChange,
}: TypeSettingsDialogProps) {
  const editDisabled = readOnly || !onChange;
  const weight = value.weight ?? NAMED_WEIGHTS.regular;

  const alignOptions: ReadonlyArray<ChoiceOption<TextHorizontalAlign>> = [
    { value: "left", label: "Align left", icon: <HorizontalLeftIcon data-icon-semantic="text-align-left" {...ICON} /> },
    { value: "center", label: "Align center", icon: <HorizontalCenterIcon data-icon-semantic="text-align-center-x" {...ICON} /> },
    { value: "right", label: "Align right", icon: <HorizontalRightIcon data-icon-semantic="text-align-right" {...ICON} /> },
    {
      value: "justify",
      label: "Justify",
      icon: <AlignJustify {...ICON} />,
      disabled: !justifySupported,
      disabledExplanation: "Justified alignment is not supported by the current document model.",
    },
  ];

  const verticalOptions: ReadonlyArray<ChoiceOption<TextVerticalAlign>> = [
    { value: "top", label: "Align top", icon: <VerticalTopIcon data-icon-semantic="text-align-top" {...ICON} /> },
    { value: "middle", label: "Align middle", icon: <VerticalCenterIcon data-icon-semantic="text-align-center" {...ICON} /> },
    { value: "bottom", label: "Align bottom", icon: <VerticalBottomIcon data-icon-semantic="text-align-bottom" {...ICON} /> },
  ];

  const decorationOptions: ReadonlyArray<ChoiceOption<TextDecoration>> = [
    { value: "none", label: "No decoration", icon: <Minus {...ICON} /> },
    { value: "underline", label: "Underline", icon: <Underline {...ICON} /> },
    { value: "strikethrough", label: "Strikethrough", icon: <Strikethrough {...ICON} /> },
  ];

  const caseOptions: ReadonlyArray<ChoiceOption<TextCase>> = [
    { value: "none", label: "Original case", icon: <Minus {...ICON} /> },
    { value: "upper", label: "Uppercase", icon: <CaseUpper {...ICON} /> },
    { value: "lower", label: "Lowercase", icon: <CaseLower {...ICON} /> },
    { value: "title", label: "Title case", icon: <CaseSensitive {...ICON} /> },
  ];

  return (
    <InspectorDialog
      open={open}
      onClose={onClose}
      trigger={trigger}
      ariaLabel="Type settings"
      width={COMPACT_INSPECTOR_DIALOG_WIDTH}
      elevation={400}
    >
      <div className="flex h-[40px] items-center border-b border-c-border pl-[16px] pr-[8px]">
        <h2 className={clsx(FONT, "min-w-0 flex-1 truncate text-[11px] font-[550] text-c-text")}>Type settings</h2>
        <button
          type="button"
          aria-label="Close type settings"
          onClick={onClose}
          className="flex size-[24px] items-center justify-center rounded-c-md text-c-icon-secondary hover:bg-c-bg-hover"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Preview */}
      <div className="px-[12px] pt-[12px]">
        <PreviewBox value={value} />
      </div>

      {/* Alignment / vertical / decoration / case */}
      <div className="flex flex-col gap-[4px] border-b border-c-border p-[12px]">
        <FieldRow label="Alignment">
          <ChoiceGroup
            ariaLabel="Alignment"
            value={value.align}
            options={alignOptions}
            mixed={value.alignMixed}
            disabled={editDisabled}
            onChange={align => onChange?.({ align })}
          />
        </FieldRow>

        <FieldRow label="Vertical trim">
          <ChoiceGroup
            ariaLabel="Vertical trim"
            value={value.verticalAlign}
            options={verticalOptions}
            mixed={value.verticalAlignMixed}
            disabled={editDisabled}
            onChange={verticalAlign => onChange?.({ verticalAlign })}
          />
        </FieldRow>

        <FieldRow label="Decoration">
          <ChoiceGroup
            ariaLabel="Decoration"
            value={value.decoration ?? "none"}
            options={decorationOptions}
            mixed={value.decorationMixed}
            disabled={editDisabled}
            onChange={decoration => onChange?.({ decoration })}
          />
        </FieldRow>

        <FieldRow label="Case">
          <ChoiceGroup
            ariaLabel="Case"
            value={value.textCase ?? "none"}
            options={caseOptions}
            mixed={value.textCaseMixed}
            disabled={editDisabled}
            onChange={textCase => onChange?.({ textCase })}
          />
        </FieldRow>
      </div>

      {/* Weight */}
      <div className="flex flex-col gap-[8px] border-b border-c-border p-[12px]">
        <FieldRow label="Weight">
          <NumericInput
            ariaLabel="Font weight"
            value={weight}
            min={WEIGHT_MIN}
            max={WEIGHT_MAX}
            step={WEIGHT_STEP}
            mixed={value.weightMixed}
            disabled={editDisabled}
            onChange={next =>
              onChange?.({ weight: Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, Math.round(next / WEIGHT_STEP) * WEIGHT_STEP)) })
            }
          />
        </FieldRow>
        <div className="px-[2px]">
          <Slider
            value={weight}
            min={WEIGHT_MIN}
            max={WEIGHT_MAX}
            step={WEIGHT_STEP}
            showSteps
            disabled={editDisabled}
            handleVariant={value.weightMixed ? "stroke" : "fill"}
            onChange={next => onChange?.({ weight: next })}
          />
        </div>
      </div>

      {/* Metrics: line height + letter spacing */}
      <div className="p-[12px]">
        <div className="flex items-end gap-[8px]">
          <div className="min-w-0 flex-1">
            <div className={clsx(FONT, "mb-[3px] text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary")}>
              Line height
            </div>
            <NumericInput
              ariaLabel="Type settings line height"
              iconLead={<LineHeightIcon data-icon-semantic="line-height" size={16} strokeWidth={1.5} />}
              value={value.lineHeight}
              min={0}
              mixed={value.lineHeightMixed}
              disabled={editDisabled}
              onChange={lineHeight => onChange?.({ lineHeight })}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className={clsx(FONT, "mb-[3px] text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary")}>
              Letter spacing
            </div>
            <NumericInput
              ariaLabel="Type settings letter spacing"
              iconLead={<LetterSpacingIcon data-icon-semantic="letter-spacing" size={16} strokeWidth={1.5} />}
              value={value.letterSpacing}
              suffix="%"
              mixed={value.letterSpacingMixed}
              disabled={editDisabled}
              onChange={letterSpacing => onChange?.({ letterSpacing })}
            />
          </div>
        </div>
      </div>

      {readOnly && (
        <p className="sr-only" aria-live="polite">
          Unlock the selection to edit type settings.
        </p>
      )}
    </InspectorDialog>
  );
}
