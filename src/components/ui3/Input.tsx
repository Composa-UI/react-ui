import { useState, useId, useRef, useCallback, useEffect, type ReactNode } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import { Chit, type ChitType } from "./Chit";
import { ChipVariable } from "./ChipVariable";

export type InputSize = "small" | "medium" | "large";
export type InputVariant = "default" | "error" | "success" | "warning";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const H: Record<InputSize, string> = {
  small:  "h-[20px]",
  medium: "h-[24px]",
  large:  "h-[32px]",
};

const T: Record<InputSize, string> = {
  small:  "text-[9px] leading-[14px]",
  medium: "text-[11px] leading-[16px]",
  large:  "text-[13px] leading-[22px]",
};

const FONT = "font-[family-name:var(--composa-font-family)] font-[450] tracking-[0.005em]";

function ringColor(focused: boolean, disabled: boolean, variant: InputVariant) {
  if (disabled) return "ring-c-border-disabled";
  if (!focused)  return "ring-c-border-translucent";
  return variant === "error"   ? "ring-c-border-danger"   :
         variant === "success" ? "ring-c-border-success"  :
         variant === "warning" ? "ring-c-border-warning"  :
         "ring-c-focus-ring";
}

// ─── FieldShell ───────────────────────────────────────────────────────────────

interface ShellProps {
  focused: boolean;
  disabled?: boolean;
  variant?: InputVariant;
  size?: InputSize;
  children: ReactNode;
  className?: string;
}

export function FieldShell({ focused, disabled = false, variant = "default", size = "medium", children, className }: ShellProps) {
  return (
    <div className={clsx(
      "relative flex items-center w-full rounded-c-md overflow-hidden",
      "bg-c-bg-secondary transition-shadow duration-100",
      H[size],
      // No resting border (Figma fields have none) — ring only on focus / non-default variant.
      (focused || variant !== "default") && clsx("ring-1 ring-inset", ringColor(focused, disabled, variant)),
      disabled && "opacity-60 cursor-not-allowed",
      className,
    )}>
      {children}
    </div>
  );
}

// ─── InputField (TextInput) ───────────────────────────────────────────────────

interface InputFieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  variant?: InputVariant;
  size?: InputSize;
  disabled?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  inlineLabel?: ReactNode;
  /** Inline dropdown pill rendered inside the field on the right.
   *  Background: bg-c-bg, border, value text + chevron.
   *  Matches Figma TextInput "can view / can edit" embedded pill pattern. */
  inlineDropdown?: { value: string; onClick?: () => void };
  hint?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function InputField({
  label,
  placeholder = "Placeholder",
  value,
  defaultValue,
  variant = "default",
  size = "medium",
  disabled = false,
  readOnly = false,
  multiline = false,
  leadingIcon,
  trailingIcon,
  inlineLabel,
  inlineDropdown,
  hint,
  onChange,
  className,
}: InputFieldProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);

  const hintColor =
    variant === "error"   ? "text-c-text-danger"  :
    variant === "success" ? "text-c-text-success" :
    variant === "warning" ? "text-c-text-warning" :
    "text-c-text-tertiary";

  const inputClass = clsx(
    inlineDropdown ? "flex-1 min-w-0" : "w-full",
    "h-full bg-transparent outline-none",
    FONT, T[size],
    "text-c-text placeholder:text-c-text-tertiary",
    leadingIcon || inlineLabel ? "pl-[24px]" : "pl-[8px]",
    inlineDropdown ? "pr-[4px]" : trailingIcon ? "pr-[24px]" : "pr-[8px]",
    (disabled || readOnly) && "cursor-not-allowed",
  );

  return (
    <div className={clsx("flex flex-col gap-[4px]", className)}>
      {label && (
        <label htmlFor={id} className="text-[11px] font-[550] leading-[16px] tracking-[0.005em] text-c-text select-none">
          {label}
        </label>
      )}

      {multiline ? (
        <div className={clsx(
          "relative w-full rounded-c-md overflow-hidden",
          "bg-c-bg-secondary ring-1 ring-inset transition-shadow duration-100",
          ringColor(focused, disabled, variant),
          disabled && "opacity-60 cursor-not-allowed",
        )}>
          <textarea
            id={id}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            rows={3}
            onChange={e => onChange?.(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={clsx(
              "w-full bg-transparent outline-none resize-none px-[8px] py-[6px]",
              FONT, T[size],
              "text-c-text placeholder:text-c-text-tertiary",
              disabled && "cursor-not-allowed",
            )}
          />
        </div>
      ) : (
        <FieldShell focused={focused} disabled={disabled} variant={variant} size={size}>
          {leadingIcon && (
            <span className="absolute left-0 flex items-center justify-center size-[24px] shrink-0 text-c-icon-secondary pointer-events-none">
              {leadingIcon}
            </span>
          )}
          {inlineLabel && !leadingIcon && (
            <span className="absolute left-0 flex items-center justify-center size-[24px] shrink-0 text-c-text-secondary pointer-events-none">
              {inlineLabel}
            </span>
          )}
          <input
            id={id}
            type="text"
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            onChange={e => onChange?.(e.target.value)}
            onFocus={e => { setFocused(true); e.target.select(); }}
            onBlur={() => setFocused(false)}
            className={inputClass}
          />
          {trailingIcon && !inlineDropdown && (
            <span className="absolute right-0 flex items-center justify-center size-[24px] shrink-0 text-c-icon-secondary pointer-events-none">
              {trailingIcon}
            </span>
          )}
          {/* Inline dropdown pill — bg-c-bg white pill with border, hugs content */}
          {inlineDropdown && (
            <button
              type="button"
              onClick={inlineDropdown.onClick}
              disabled={disabled}
              className={clsx(
                "shrink-0 flex items-center bg-c-bg rounded-c-sm mr-[4px]",
                "ring-1 ring-inset ring-c-border h-[24px] pl-[8px]",
                "hover:ring-c-border-selected transition-shadow duration-100",
                disabled && "opacity-60 cursor-not-allowed",
              )}
            >
              <span className={clsx(FONT, "text-[11px] text-c-text whitespace-nowrap")}>
                {inlineDropdown.value}
              </span>
              <span className="flex items-center justify-center size-[24px]">
                <ChevronDown size={10} strokeWidth={2} className="text-c-icon-secondary" />
              </span>
            </button>
          )}
        </FieldShell>
      )}

      {hint && <p className={clsx("text-[11px] leading-[16px] tracking-[0.005em]", hintColor)}>{hint}</p>}
    </div>
  );
}

// ─── NumericInput ─────────────────────────────────────────────────────────────

interface NumericInputProps {
  iconLead?: ReactNode;       // scrubber label (e.g. "W", "X", or an icon)
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  size?: InputSize;
  disabled?: boolean;
  dropdown?: boolean;         // show chevron on right
  mixed?: boolean;            // multi-select with differing values — shows "Mixed", edits commit to all (v5 §7)
  variableValue?: string;     // if set, shows ChipVariable instead of raw number
  onVariableDetach?: () => void;
  onChange?: (value: number) => void;
  /** Buffer typed edits and emit once on blur/Enter. Scrub and arrow changes remain immediate. */
  commitOnBlur?: boolean;
  className?: string;
}

export function NumericInput({
  iconLead,
  value,
  defaultValue = 0,
  min,
  max,
  step = 1,
  suffix,
  size = "medium",
  disabled = false,
  dropdown = false,
  mixed = false,
  variableValue,
  onVariableDetach,
  onChange,
  commitOnBlur = false,
  className,
}: NumericInputProps) {
  const [focused, setFocused] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const scrubStart = useRef<{ x: number; value: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelBlurCommit = useRef(false);

  const current = value !== undefined ? value : internal;
  const [draft, setDraft] = useState(String(current));
  useEffect(() => { if (!focused) setDraft(String(current)); }, [current, focused]);
  // Mixed (v5 §7): multi-select with differing values shows "Mixed" until focused; typing commits to all.
  const displayMixed = mixed && !focused && !scrubbing;

  const clampVal = useCallback((n: number) => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  }, [min, max]);

  const set = useCallback((n: number) => {
    const final = clampVal(n);
    if (value === undefined) setInternal(final);
    onChange?.(final);
  }, [clampVal, value, onChange]);

  const onLabelPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubStart.current = { x: e.clientX, value: current };
    setScrubbing(true);
  };

  const onLabelPointerMove = (e: React.PointerEvent) => {
    if (!scrubStart.current) return;
    const delta = e.clientX - scrubStart.current.x;
    const mult = e.shiftKey ? 10 : 1;
    set(scrubStart.current.value + Math.round(delta / 2) * step * mult);
  };

  const onLabelPointerUp = (e: React.PointerEvent) => {
    if (!scrubStart.current) return;
    const moved = Math.abs(e.clientX - scrubStart.current.x) > 2;
    scrubStart.current = null;
    setScrubbing(false);
    if (!moved && !variableValue) inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const mult = e.shiftKey ? 10 : 1;
    if (e.key === "Enter" && commitOnBlur) { e.preventDefault(); e.currentTarget.blur(); return; }
    if (e.key === "Escape" && commitOnBlur) { e.preventDefault(); cancelBlurCommit.current = true; setDraft(String(current)); e.currentTarget.blur(); return; }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const base = commitOnBlur && Number.isFinite(Number(draft)) ? Number(draft) : current;
      const next = clampVal(base + (e.key === "ArrowUp" ? step : -step) * mult);
      if (commitOnBlur) setDraft(String(next)); else set(next);
    }
  };
  const commitDraft = () => {
    const parsed = Number(draft);
    if (draft.trim() !== "" && Number.isFinite(parsed)) set(parsed);
    else setDraft(String(current));
  };

  return (
    <FieldShell focused={focused || scrubbing} disabled={disabled} size={size} className={className}>
      {/* scrubber label */}
      {iconLead && (
        <span
          onPointerDown={onLabelPointerDown}
          onPointerMove={onLabelPointerMove}
          onPointerUp={onLabelPointerUp}
          className={clsx(
            "absolute left-0 flex items-center justify-center size-[24px] shrink-0 select-none",
            FONT, T[size], "text-c-text-secondary",
            !disabled && "cursor-ew-resize hover:text-c-text",
            disabled && "cursor-not-allowed",
          )}
        >
          {iconLead}
        </span>
      )}

      {/* variable pill — replaces numeric input */}
      {variableValue ? (
        <div className={clsx("flex items-center px-[2px]", iconLead ? "pl-[26px]" : "pl-[4px]", "pr-[4px]", "w-full")}>
          <ChipVariable
            value={variableValue}
            state={focused ? "Selected" : "Default"}
            onDetach={onVariableDetach}
          />
        </div>
      ) : (
        <input
          ref={inputRef}
          type="number"
          value={displayMixed ? "" : commitOnBlur ? draft : current}
          placeholder={mixed ? "Mixed" : undefined}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={e => commitOnBlur ? setDraft(e.target.value) : set(parseFloat(e.target.value) || 0)}
          onKeyDown={onKeyDown}
          onFocus={e => { setFocused(true); e.target.select(); }}
          onBlur={() => {
            if (cancelBlurCommit.current) cancelBlurCommit.current = false;
            else if (commitOnBlur) commitDraft();
            setFocused(false);
          }}
          className={clsx(
            "flex-1 min-w-0 h-full bg-transparent outline-none text-left",
            FONT, T[size], "text-c-text",
            "placeholder:text-c-text-tertiary",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            iconLead ? "pl-[26px]" : "pl-[8px]",
            (suffix || dropdown) ? "pr-[2px]" : "pr-[8px]",
            disabled && "cursor-not-allowed",
          )}
        />
      )}

      {suffix && !variableValue && (
        <span className={clsx("shrink-0 pr-[6px] text-c-text-secondary", T[size], FONT)}>
          {suffix}
        </span>
      )}

      {dropdown && (
        <span className="shrink-0 flex items-center justify-center size-[24px] text-c-icon-secondary">
          <ChevronDown size={10} strokeWidth={2} />
        </span>
      )}
    </FieldShell>
  );
}

// ─── NumericInputMulti ────────────────────────────────────────────────────────
// 4-value shorthand field (border-radius, padding, etc.)
// Each cell supports scrub-drag and keyboard arrows, same as NumericInput.

interface MultiValue {
  value: number;
  onChange?: (v: number) => void;
  disabled?: boolean;
}

interface NumericInputMultiProps {
  iconLead?: ReactNode;
  values: [MultiValue, MultiValue, MultiValue, MultiValue];
  step?: number;
  size?: InputSize;
  disabled?: boolean;
  className?: string;
}

function MultiCell({
  v, step, size, globalDisabled, isLast,
  onFocus, onBlur,
}: {
  v: MultiValue;
  step: number;
  size: InputSize;
  globalDisabled: boolean;
  isLast: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrubStart = useRef<{ x: number; value: number } | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const isDisabled = globalDisabled || !!v.disabled;

  const set = (n: number) => v.onChange?.(n);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubStart.current = { x: e.clientX, value: v.value };
    setScrubbing(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubStart.current) return;
    const mult = e.shiftKey ? 10 : 1;
    set(scrubStart.current.value + Math.round((e.clientX - scrubStart.current.x) / 2) * step * mult);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubStart.current) return;
    const moved = Math.abs(e.clientX - scrubStart.current.x) > 2;
    scrubStart.current = null;
    setScrubbing(false);
    if (!moved) inputRef.current?.focus();
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={clsx(
        "flex-1 min-w-0 h-full flex items-center relative",
        !isLast && "border-r border-c-bg",
        !isDisabled && (scrubbing ? "cursor-ew-resize" : "cursor-ew-resize"),
      )}
    >
      <input
        ref={inputRef}
        type="number"
        value={v.value}
        step={step}
        disabled={isDisabled}
        onChange={e => set(parseFloat(e.target.value) || 0)}
        onKeyDown={e => {
          const mult = e.shiftKey ? 10 : 1;
          if (e.key === "ArrowUp")   { e.preventDefault(); set(v.value + step * mult); }
          if (e.key === "ArrowDown") { e.preventDefault(); set(v.value - step * mult); }
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        className={clsx(
          "w-full h-full bg-transparent outline-none text-center select-none",
          FONT, T[size],
          isDisabled ? "text-c-text-disabled cursor-not-allowed" : "text-c-text",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
        )}
      />
    </div>
  );
}

export function NumericInputMulti({ iconLead, values, step = 1, size = "medium", disabled = false, className }: NumericInputMultiProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  return (
    <FieldShell focused={focusedIndex !== null} disabled={disabled} size={size} className={className}>
      {iconLead && (
        <span className="shrink-0 flex items-center justify-center size-[24px] text-c-icon-secondary pointer-events-none">
          {iconLead}
        </span>
      )}
      {values.map((v, i) => (
        <MultiCell
          key={i}
          v={v}
          step={step}
          size={size}
          globalDisabled={disabled}
          isLast={i === values.length - 1}
          onFocus={() => setFocusedIndex(i)}
          onBlur={() => setFocusedIndex(null)}
        />
      ))}
    </FieldShell>
  );
}

// ─── ColorInput ───────────────────────────────────────────────────────────────

export type ColorFillType = "Fill" | "Opacity" | "Gradient" | "Image" | "Variable";

interface ColorInputProps {
  label?: string;
  color?: string;
  opacity?: number;
  fillType?: ColorFillType;
  fillLabel?: string;         // for Gradient/Image/Variable — replaces hex
  variableValue?: string;     // when fillType=Variable
  size?: InputSize;
  disabled?: boolean;
  fullWidth?: boolean;        // fluid — fill the container instead of the fixed 144px
  /** When set, the swatch opens this (e.g. the Fill/Color dialog) instead of the native color picker. */
  onSwatchClick?: () => void;
  onColorChange?: (hex: string) => void;
  onOpacityChange?: (pct: number) => void;
  className?: string;
}

export function ColorInput({
  label,
  color = "#ff24bd",
  opacity = 100,
  fillType = "Fill",
  fillLabel,
  variableValue,
  size = "medium",
  disabled = false,
  fullWidth = false,
  onSwatchClick,
  onColorChange,
  onOpacityChange,
  className,
}: ColorInputProps) {
  const [focusedHex, setFocusedHex] = useState(false);
  const [focusedOpacity, setFocusedOpacity] = useState(false);
  const focused = focusedHex || focusedOpacity;

  const hex = color.replace("#", "").toUpperCase();
  const isVariable = fillType === "Variable";
  const isTextLabel = fillType === "Gradient" || fillType === "Image" || isVariable;

  // chit type mapping
  const chitType = fillType === "Variable" ? "Fill" : fillType as ChitType;

  const midText = isVariable
    ? variableValue ?? "bg-assistive"
    : isTextLabel
      ? fillLabel ?? (fillType === "Gradient" ? "Angular" : "Image")
      : hex;

  return (
    <div className={clsx("flex flex-col gap-[4px]", className)}>
      {label && (
        <span className="text-[11px] font-[550] leading-[16px] tracking-[0.005em] text-c-text select-none">
          {label}
        </span>
      )}

      <div className={clsx(
        "relative flex items-center rounded-c-md overflow-hidden",
        "bg-c-bg-secondary transition-shadow duration-100",
        H[size],
        focused && "ring-1 ring-inset ring-c-focus-ring",
        disabled && "opacity-60",
        isVariable || fullWidth ? "w-full" : "w-[144px]",
      )}>
        {/* chit */}
        {!isVariable && (
          <label className="relative shrink-0 flex items-center justify-center size-[24px] cursor-pointer">
            <Chit color={color} type={chitType} />
            {onSwatchClick ? (
              <button
                type="button"
                aria-label="Edit color"
                disabled={disabled}
                onClick={onSwatchClick}
                className="absolute inset-0 w-full h-full cursor-pointer"
              />
            ) : fillType === "Fill" ? (
              <input
                type="color"
                value={color}
                disabled={disabled}
                onChange={e => onColorChange?.(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            ) : null}
          </label>
        )}

        {/* hex / label */}
        <div className={clsx(
          "flex-1 min-w-0 h-full flex items-center overflow-hidden",
          isVariable ? "pl-[8px]" : "pl-[2px]",
        )}>
          {isTextLabel ? (
            <span className={clsx(
              "overflow-hidden text-ellipsis whitespace-nowrap",
              FONT, T[size],
              disabled ? "text-c-text-disabled" : "text-c-text",
            )}>
              {midText}
            </span>
          ) : (
            <input
              type="text"
              value={hex}
              disabled={disabled}
              maxLength={6}
              onChange={e => onColorChange?.(`#${e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6)}`)}
              onFocus={() => setFocusedHex(true)}
              onBlur={() => setFocusedHex(false)}
              className={clsx(
                "w-full h-full bg-transparent outline-none uppercase",
                FONT, T[size], "text-c-text",
                disabled && "cursor-not-allowed",
              )}
            />
          )}
        </div>

        {/* opacity section — hidden for Variable fill */}
        {!isVariable && (
          <div className="flex items-center shrink-0 self-stretch border-l border-c-bg w-[53px]">
            <input
              type="number"
              value={opacity}
              min={0}
              max={100}
              disabled={disabled}
              onChange={e => onOpacityChange?.(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              onFocus={() => setFocusedOpacity(true)}
              onBlur={() => setFocusedOpacity(false)}
              className={clsx(
                "flex-1 min-w-0 h-full bg-transparent outline-none pl-[6px]",
                FONT, T[size], "text-c-text",
                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                disabled && "cursor-not-allowed",
              )}
            />
            <span className={clsx("pr-[6px] shrink-0 text-c-text-secondary", T[size], FONT)}>%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ComboInput ───────────────────────────────────────────────────────────────
// Input field + split chevron dropdown button

type ComboInputState = "default" | "hover" | "selectedInput" | "selectedChevron";

interface ComboInputProps {
  value?: string;
  defaultValue?: string;
  iconLead?: ReactNode;
  variableValue?: string;
  size?: InputSize;
  disabled?: boolean;
  state?: ComboInputState;
  onInputChange?: (v: string) => void;
  onDropdownClick?: () => void;
  className?: string;
}

export function ComboInput({
  value,
  defaultValue,
  iconLead,
  variableValue,
  size = "medium",
  disabled = false,
  state = "default",
  onInputChange,
  onDropdownClick,
  className,
}: ComboInputProps) {
  const [internalFocused, setInternalFocused] = useState(false);
  const inputFocused = state === "selectedInput" || internalFocused;
  const chevronFocused = state === "selectedChevron";

  const inputRing = inputFocused ? "ring-c-focus-ring" : state === "hover" ? "ring-c-border" : "ring-transparent";
  const chevronBg = chevronFocused ? "bg-c-bg-selected" : state === "hover" ? "bg-c-bg-tertiary" : "bg-c-bg-secondary";
  const chevronRing = (inputFocused || chevronFocused || state === "hover") ? "ring-c-focus-ring" : "ring-transparent";

  return (
    <div className={clsx("flex gap-px items-start", className)}>
      {/* input half */}
      <div className={clsx(
        "flex-1 min-w-0 relative flex items-center rounded-l-c-md overflow-hidden",
        "bg-c-bg-secondary ring-1 ring-inset transition-shadow duration-100",
        H[size],
        inputRing,
        disabled && "opacity-60",
      )}>
        {/* T[size] here matters: a plain-text iconLead (e.g. "W"/"H") sets no
            font-size of its own, so it inherits from this wrapper — without it,
            it falls back to the browser default (16px) instead of the field's
            actual text size. (NumericInput's equivalent wrapper already has this.) */}
        {iconLead && (
          <span className={clsx("absolute left-0 flex items-center justify-center size-[24px] shrink-0 text-c-icon-secondary pointer-events-none", FONT, T[size])}>
            {iconLead}
          </span>
        )}
        {variableValue ? (
          <div className={clsx("flex items-center h-full px-[4px]", iconLead && "pl-[26px]")}>
            <ChipVariable value={variableValue} state={inputFocused ? "OnSelected" : "Default"} />
          </div>
        ) : (
          <input
            type="text"
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            onChange={e => onInputChange?.(e.target.value)}
            onFocus={() => setInternalFocused(true)}
            onBlur={() => setInternalFocused(false)}
            className={clsx(
              "w-full h-full bg-transparent outline-none",
              FONT, T[size], "text-c-text",
              iconLead ? "pl-[26px] pr-[6px]" : "pl-[8px] pr-[6px]",
              disabled && "cursor-not-allowed",
            )}
          />
        )}
      </div>

      {/* chevron half */}
      <button
        onClick={!disabled ? onDropdownClick : undefined}
        disabled={disabled}
        className={clsx(
          "shrink-0 flex items-center justify-center rounded-r-c-md",
          "ring-1 ring-inset transition-colors duration-100",
          H[size], "w-[24px]",
          chevronBg,
          chevronRing,
          disabled && "opacity-60 cursor-not-allowed",
        )}
      >
        <ChevronDown size={10} strokeWidth={2} className="text-c-icon-secondary" />
      </button>
    </div>
  );
}

// ─── ChitInput ────────────────────────────────────────────────────────────────
// A labeled chip used inside an input row (e.g. an instance/component reference)

interface ChitInputProps {
  label: string;
  leadingIcon?: ReactNode;
  closeButton?: boolean;
  focused?: boolean;
  onClose?: () => void;
  size?: InputSize;
  className?: string;
}

export function ChitInput({ label, leadingIcon, closeButton = false, focused = false, onClose, size = "medium", className }: ChitInputProps) {
  return (
    <div className={clsx(
      "inline-flex items-center rounded-c-md overflow-hidden ring-1 ring-inset transition-shadow",
      H[size],
      focused ? "bg-c-bg-selected ring-c-focus-ring" : "bg-c-bg ring-c-border",
      closeButton ? "pl-[8px]" : "pr-[8px]",
      className,
    )}>
      {!closeButton && leadingIcon && (
        <span className="flex items-center justify-center size-[24px] shrink-0 text-c-icon-secondary">
          {leadingIcon}
        </span>
      )}
      <span className={clsx("shrink-0 overflow-hidden text-ellipsis whitespace-nowrap", FONT, T[size], "text-c-text")}>
        {label}
      </span>
      {closeButton && (
        <button
          onClick={onClose}
          className="flex items-center justify-center size-[24px] shrink-0 text-c-icon-secondary hover:text-c-text transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 1L10 10M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
