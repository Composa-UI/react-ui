import { createContext, useContext, useState, useId, useRef, useCallback, useEffect, type ReactNode } from "react";
import { clsx } from "clsx";
import { ChevronDown, Diamond } from "lucide-react";
import { Chit, type ChitType } from "./Chit";
import { ChipVariable } from "./ChipVariable";
import { PopoverMenu } from "./Menu";

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

export interface NumericEditSessionCallbacks {
  onEditStart?: () => void;
  onEditCommit?: () => void;
  onEditCancel?: () => void;
}

const NumericEditSessionContext = createContext<NumericEditSessionCallbacks>({});

/** Supplies one host-owned history transaction contract to nested numeric controls. */
export function NumericEditSessionProvider({ children, ...callbacks }: NumericEditSessionCallbacks & { children: ReactNode }) {
  return <NumericEditSessionContext.Provider value={callbacks}>{children}</NumericEditSessionContext.Provider>;
}

/** Formats presentation only. Stored and emitted numeric precision is untouched. */
export function formatNumericDisplay(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round((value + Math.sign(value) * Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

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
  numeric?: boolean;
  /**
   * This shell is the leading segment in a joined field/action control. The
   * shell owns the radius change so wrapper layout classes cannot leave a
   * rounded seam between the editable field and its following action/menu.
   */
  joined?: boolean;
}

export function FieldShell({ focused, disabled = false, variant = "default", size = "medium", children, className, numeric = false, joined = false }: ShellProps) {
  return (
    <div data-composa-numeric-input={numeric ? "" : undefined} className={clsx(
      "relative flex items-center w-full rounded-c-md overflow-hidden",
      "bg-c-bg-secondary transition-shadow duration-100",
      H[size],
      joined && "!rounded-r-none",
      // No resting border (Figma fields have none) — ring only on focus / non-default variant.
      (focused || variant !== "default") && clsx("ring-1 ring-inset", ringColor(focused, disabled, variant)),
      disabled && "opacity-60 cursor-not-allowed",
      className,
    )}>
      {children}
    </div>
  );
}

/** Joins an editable value and its trailing actions into one combo field. */
function SeparatedFieldActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div data-composa-separated-field-actions className={clsx("flex min-w-0 w-full items-center gap-px", className)}>{children}</div>;
}

function FieldAction({
  ariaLabel,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  ariaLabel: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return <button
    type="button"
    data-composa-field-action=""
    aria-label={ariaLabel}
    aria-pressed={active}
    disabled={disabled}
    onClick={event => { event.stopPropagation(); if (!disabled) onClick(); }}
    className={clsx(
      "size-[24px] shrink-0 rounded-none last:rounded-r-c-md bg-c-bg-secondary flex items-center justify-center",
      "hover:bg-c-bg-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-c-focus-ring",
      active && "bg-c-bg-selected text-c-text-brand",
      !active && "text-c-icon-secondary",
      disabled && "cursor-not-allowed opacity-60 hover:bg-c-bg-secondary",
    )}
  >{children}</button>;
}

/** A fixed-size host for an externally supplied trailing action. */
function FieldActionSlot({ children }: { children: ReactNode }) {
  return <span data-composa-field-action="" className="size-[24px] shrink-0 rounded-none last:rounded-r-c-md bg-c-bg-secondary flex items-center justify-center [&>button]:size-full [&>button]:rounded-none [&>button]:bg-c-bg-secondary [&>button:hover]:bg-c-bg-hover [&>button:focus-visible]:outline-none [&>button:focus-visible]:ring-1 [&>button:focus-visible]:ring-c-focus-ring">{children}</span>;
}

// ─── InputField (TextInput) ───────────────────────────────────────────────────

interface InputFieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  variant?: InputVariant;
  size?: InputSize;
  /** Typography scale when it intentionally differs from the field geometry. */
  textSize?: InputSize;
  disabled?: boolean;
  readOnly?: boolean;
  /** Focus the field on mount (native autofocus). */
  autoFocus?: boolean;
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
  textSize = size,
  disabled = false,
  readOnly = false,
  autoFocus = false,
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
    FONT, T[textSize],
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
              FONT, T[textSize],
              "text-c-text placeholder:text-c-text-tertiary",
              disabled && "cursor-not-allowed",
            )}
          />
        </div>
      ) : (
        <FieldShell
          focused={focused}
          disabled={disabled}
          variant={variant}
          size={size}
          // For an autofocused field (default variant), drive the focus ring from
          // real DOM focus via CSS. Radix's dialog FocusScope can leave the input
          // focused without a clean React onFocus, so the JS `focused` state is
          // unreliable on open; :focus-within is deterministic and self-clearing.
          className={clsx(autoFocus && variant === "default" &&
            "focus-within:ring-1 focus-within:ring-inset focus-within:ring-c-focus-ring")}
        >
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
            autoFocus={autoFocus}
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

export interface NumericInputProps extends NumericEditSessionCallbacks {
  ariaLabel?: string;
  iconLead?: ReactNode;       // scrubber label (e.g. "W", "X", or an icon)
  /** Keep the canonical 24px leading-icon column even when no glyph is shown. */
  reserveLeadingSlot?: boolean;
  /** Make the whole field a horizontal drag-scrub surface (same ew-resize idiom,
   *  sensitivity, step + clamp as the iconLead scrub). For compact fields with no
   *  leading glyph — e.g. the Dial's value row — where the input itself is the grab
   *  target. A plain click still focuses for typing; a horizontal drag scrubs. */
  scrub?: boolean;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  size?: InputSize;
  disabled?: boolean;
  dropdown?: boolean;         // show chevron on right
  /** Motion-mode keyframe affordance: a trailing diamond segment (in place of the
   *  combo chevron). Filled = keyframe at the current playhead; click toggles. */
  keyframe?: { active: boolean; onToggle: () => void };
  mixed?: boolean;            // multi-select with differing values — shows "Mixed", edits commit to all (v5 §7)
  variableValue?: string;     // if set, shows ChipVariable instead of raw number
  onVariableDetach?: () => void;
  onChange?: (value: number) => void;
  /** Buffer typed edits and emit once on blur/Enter. Scrub and arrow changes remain immediate. */
  commitOnBlur?: boolean;
  /** This editor is followed by a separate action/menu segment in a joined control. */
  joined?: boolean;
  className?: string;
}

export function NumericInput({
  ariaLabel,
  iconLead,
  reserveLeadingSlot = false,
  scrub = false,
  value,
  defaultValue = 0,
  min,
  max,
  step = 1,
  suffix,
  size = "medium",
  disabled = false,
  dropdown = false,
  keyframe,
  mixed = false,
  variableValue,
  onVariableDetach,
  onChange,
  onEditStart,
  onEditCommit,
  onEditCancel,
  commitOnBlur = false,
  joined = false,
  className,
}: NumericInputProps) {
  const inheritedSession = useContext(NumericEditSessionContext);
  const startSession = onEditStart ?? inheritedSession.onEditStart;
  const commitSession = onEditCommit ?? inheritedSession.onEditCommit;
  const cancelSession = onEditCancel ?? inheritedSession.onEditCancel;
  const sessionControlled = !!(startSession || commitSession || cancelSession);
  const [focused, setFocused] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const scrubStart = useRef<{ x: number; value: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelBlurCommit = useRef(false);
  const sessionStart = useRef<number | null>(null);
  const lastEmitted = useRef<number | null>(null);
  const cancelSessionRef = useRef(cancelSession);
  cancelSessionRef.current = cancelSession;

  // A controlled host can replace this field with another mode while it owns
  // a live edit transaction. Close that lease exactly once on unmount so a
  // selection/context/collaboration update cannot strand document history.
  useEffect(() => () => {
    if (sessionStart.current === null) return;
    sessionStart.current = null;
    cancelSessionRef.current?.();
  }, []);

  const current = value !== undefined ? value : internal;
  // The draft is what the user sees and edits, so it is seeded at display
  // precision everywhere. Seeding it with String(current) leaked the raw float
  // ("758.4596697032626") the moment the field was focused, even though the
  // idle field read "758.46". Emitted values are still whatever the user typed.
  const [draft, setDraft] = useState(formatNumericDisplay(current));
  useEffect(() => { if (!focused && !scrubbing) setDraft(formatNumericDisplay(current)); }, [current, focused, scrubbing]);
  useEffect(() => {
    if (!focused || lastEmitted.current === null) return;
    if (current !== lastEmitted.current) setDraft(formatNumericDisplay(current));
    lastEmitted.current = null;
  }, [current, focused]);
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
    else lastEmitted.current = final;
    onChange?.(final);
  }, [clampVal, value, onChange]);

  const beginSession = useCallback(() => {
    if (!sessionControlled || sessionStart.current !== null) return;
    sessionStart.current = current;
    startSession?.();
  }, [current, sessionControlled, startSession]);
  const finishSession = useCallback((cancelled: boolean) => {
    if (sessionStart.current === null) return;
    const start = sessionStart.current;
    sessionStart.current = null;
    if (cancelled) {
      setDraft(formatNumericDisplay(start));
      if (value === undefined) setInternal(start);
      cancelSession?.();
    } else commitSession?.();
  }, [cancelSession, commitSession, value]);

  const onLabelPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    beginSession();
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
    else finishSession(false);
  };
  const cancelScrub = useCallback(() => {
    if (!scrubStart.current) return;
    scrubStart.current = null;
    setScrubbing(false);
    finishSession(true);
  }, [finishSession]);

  // Whole-field scrub (opt-in). Same idiom as the iconLead handle, applied to the
  // input itself for compact fields with no leading glyph (e.g. the Dial). We
  // preventDefault to keep focus off the input so the value updates live while
  // scrubbing; onLabelPointerUp then focuses on a no-move click so typing works.
  const onInputPointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    if (disabled || focused) return; // already typing → leave caret/selection alone
    e.preventDefault();
    beginSession();
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubStart.current = { x: e.clientX, value: current };
    setScrubbing(true);
  };
  useEffect(() => {
    if (!scrubbing || typeof document === "undefined") return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      cancelScrub();
    };
    document.addEventListener("keydown", onEscape, true);
    return () => document.removeEventListener("keydown", onEscape, true);
  }, [cancelScrub, scrubbing]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const mult = e.shiftKey ? 10 : 1;
    if (e.key === "Enter" && (commitOnBlur || sessionControlled)) { e.preventDefault(); e.currentTarget.blur(); return; }
    if (e.key === "Escape" && (commitOnBlur || sessionControlled)) {
      e.preventDefault();
      cancelBlurCommit.current = true;
      if (sessionControlled) finishSession(true);
      else setDraft(formatNumericDisplay(current));
      e.currentTarget.blur();
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const base = (commitOnBlur || sessionControlled) && Number.isFinite(Number(draft)) ? Number(draft) : current;
      const next = clampVal(base + (e.key === "ArrowUp" ? step : -step) * mult);
      if (commitOnBlur && !sessionControlled) setDraft(formatNumericDisplay(next));
      else { beginSession(); setDraft(formatNumericDisplay(next)); set(next); }
    }
  };
  const commitDraft = () => {
    // An untouched draft is the rounded display string, so committing it would
    // silently quantise the stored value on a bare focus/blur. Leave it alone.
    if (draft === formatNumericDisplay(current)) return;
    const parsed = Number(draft);
    if (draft.trim() !== "" && Number.isFinite(parsed)) set(parsed);
    else setDraft(formatNumericDisplay(current));
  };

  return (
    <SeparatedFieldActions className={className}>
      <FieldShell focused={focused || scrubbing} disabled={disabled} size={size} joined={joined || Boolean(keyframe)} className="flex-1 min-w-0" numeric>
      {/* scrubber label */}
      {iconLead && (
        <span
          onPointerDown={onLabelPointerDown}
          onPointerMove={onLabelPointerMove}
          onPointerUp={onLabelPointerUp}
          onPointerCancel={cancelScrub}
          onLostPointerCapture={cancelScrub}
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
          aria-label={ariaLabel}
          ref={inputRef}
          type="text"
          role="spinbutton"
          inputMode="decimal"
          value={displayMixed ? "" : focused || sessionControlled && sessionStart.current !== null || commitOnBlur ? draft : formatNumericDisplay(current)}
          placeholder={mixed ? "Mixed" : undefined}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={e => {
            const nextDraft = e.target.value;
            setDraft(nextDraft);
            if (commitOnBlur && !sessionControlled) return;
            const parsed = Number(nextDraft);
            if (nextDraft.trim() !== "" && Number.isFinite(parsed)) {
              beginSession();
              const clamped = clampVal(parsed);
              if (clamped !== parsed) setDraft(formatNumericDisplay(clamped));
              set(clamped);
            }
          }}
          onKeyDown={onKeyDown}
          {...(scrub && {
            onPointerDown: onInputPointerDown,
            onPointerMove: onLabelPointerMove,
            onPointerUp: onLabelPointerUp,
            onPointerCancel: cancelScrub,
            onLostPointerCapture: cancelScrub,
          })}
          onFocus={e => { setDraft(formatNumericDisplay(current)); beginSession(); setFocused(true); e.target.select(); }}
          onBlur={() => {
            if (cancelBlurCommit.current) cancelBlurCommit.current = false;
            else {
              if (commitOnBlur && !sessionControlled) commitDraft();
              finishSession(false);
            }
            setFocused(false);
          }}
          className={clsx(
            "flex-1 min-w-0 h-full bg-transparent outline-none text-left",
            FONT, T[size], "text-c-text",
            "placeholder:text-c-text-tertiary",
            !focused && "truncate",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            iconLead || reserveLeadingSlot ? "pl-[26px]" : "pl-[8px]",
            (suffix || dropdown) ? "pr-[2px]" : "pr-[8px]",
            scrub && !disabled && !focused && "cursor-ew-resize touch-none select-none",
            disabled && "cursor-not-allowed",
          )}
        />
      )}

      {suffix && !variableValue && (
        <span className={clsx("shrink-0 pr-[6px] text-c-text-secondary", T[size], FONT)}>
          {suffix}
        </span>
      )}

      {dropdown && !keyframe && (
        <span className="shrink-0 flex items-center justify-center size-[24px] text-c-icon-secondary">
          <ChevronDown size={10} strokeWidth={2} />
        </span>
      )}

      </FieldShell>
      {/* Motion-mode keyframe diamond — a separate 24px action surface. */}
      {keyframe && <FieldAction
        ariaLabel={ariaLabel ? `${ariaLabel} keyframe` : "Toggle keyframe"}
        active={keyframe.active}
        disabled={disabled}
        onClick={keyframe.onToggle}
      >
        <Diamond size={11} strokeWidth={1.5} className={clsx(keyframe.active && "fill-current")} />
      </FieldAction>}
    </SeparatedFieldActions>
  );
}

// ─── NumericPairInput ───────────────────────────────────────────────────────
// One combo field holding two numeric segments (e.g. X | Y) separated by a
// hairline, with an optional trailing keyframe diamond and/or trailing action
// (e.g. aspect-lock). Matches Figma's Motion Position/Scale rows: [X | Y | ◇ (| ⊡)].

export interface NumericPairSegment {
  ariaLabel: string;
  iconLead: ReactNode;
  value: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  defaultValue?: number;
  step?: number;
  /** Multi-select with differing values — shows "Mixed", edits commit to all (v5 §7). */
  mixed?: boolean;
}

interface NumericPairInputProps {
  a: NumericPairSegment;
  b: NumericPairSegment;
  /** Trailing keyframe diamond cell (motion mode). */
  keyframe?: { active: boolean; onToggle: () => void };
  /** Trailing action cell, e.g. an aspect-ratio lock button. */
  trailing?: ReactNode;
  ariaLabel?: string;
  size?: InputSize;
  disabled?: boolean;
  className?: string;
}

function PairSegment({ seg, size, isLast, disabled = false, onFocusChange }: {
  seg: NumericPairSegment; size: InputSize; isLast: boolean; disabled?: boolean; onFocusChange: (focused: boolean) => void;
}) {
  const { min, max, step = 1, defaultValue = 0 } = seg;
  const session = useContext(NumericEditSessionContext);
  const [focused, setFocused] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const current = seg.value !== undefined ? seg.value : internal;
  // Same rule as NumericInput: the draft is a display string, never the raw float.
  const [draft, setDraft] = useState(formatNumericDisplay(current));
  const scrubStart = useRef<{ x: number; value: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionOpen = useRef(false);

  useEffect(() => { if (!focused && !scrubbing) setDraft(formatNumericDisplay(current)); }, [current, focused, scrubbing]);
  useEffect(() => () => { if (sessionOpen.current) { sessionOpen.current = false; session.onEditCancel?.(); } }, [session]);

  const clampVal = (n: number) => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };
  const set = (n: number) => { const f = clampVal(n); if (seg.value === undefined) setInternal(f); seg.onChange?.(f); };
  const begin = () => { if (!sessionOpen.current) { sessionOpen.current = true; session.onEditStart?.(); } };
  const finish = (cancelled: boolean) => { if (!sessionOpen.current) return; sessionOpen.current = false; cancelled ? session.onEditCancel?.() : session.onEditCommit?.(); };
  const setFocus = (value: boolean) => { setFocused(value); onFocusChange(value); };
  // Mixed (v5 §7): a multi-select with differing values shows "Mixed" until focused; typing commits to all.
  const displayMixed = seg.mixed && !focused && !scrubbing;

  return (
    <div className={clsx("relative flex-1 min-w-0 h-full flex items-center", !isLast && "border-r border-c-bg")}>
      <span
        onPointerDown={e => { if (disabled) return; begin(); e.currentTarget.setPointerCapture(e.pointerId); scrubStart.current = { x: e.clientX, value: current }; setScrubbing(true); }}
        onPointerMove={e => { if (!scrubStart.current) return; const mult = e.shiftKey ? 10 : 1; set(scrubStart.current.value + Math.round((e.clientX - scrubStart.current.x) / 2) * step * mult); }}
        onPointerUp={e => { if (!scrubStart.current) return; const moved = Math.abs(e.clientX - scrubStart.current.x) > 2; scrubStart.current = null; setScrubbing(false); moved ? finish(false) : inputRef.current?.focus(); }}
        onPointerCancel={() => { if (!scrubStart.current) return; scrubStart.current = null; setScrubbing(false); finish(true); }}
        className={clsx("absolute left-0 flex items-center justify-center size-[24px] shrink-0 select-none text-c-text-secondary", !disabled && "cursor-ew-resize hover:text-c-text", disabled && "cursor-not-allowed", FONT, T[size])}
      >
        {seg.iconLead}
      </span>
      <input
        ref={inputRef}
        aria-label={seg.ariaLabel}
        type="text"
        role="spinbutton"
        inputMode="decimal"
        value={focused || scrubbing ? draft : formatNumericDisplay(current)}
        disabled={disabled}
        onChange={e => { const nd = e.target.value; setDraft(nd); const p = Number(nd); if (nd.trim() !== "" && Number.isFinite(p)) { begin(); const c = clampVal(p); if (c !== p) setDraft(formatNumericDisplay(c)); set(c); } }}
        onKeyDown={e => {
          const mult = e.shiftKey ? 10 : 1;
          if (e.key === "Enter") { e.currentTarget.blur(); }
          else if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); begin(); const n = clampVal(current + (e.key === "ArrowUp" ? step : -step) * mult); setDraft(formatNumericDisplay(n)); set(n); }
        }}
        onFocus={e => { setDraft(formatNumericDisplay(current)); begin(); setFocus(true); e.target.select(); }}
        onBlur={() => { finish(false); setFocus(false); }}
        className={clsx("w-full h-full bg-transparent outline-none text-left pl-[26px]", seg.suffix ? "pr-[2px]" : "pr-[6px]", FONT, T[size], "text-c-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", disabled && "cursor-not-allowed")}
      />
      {seg.suffix && <span className={clsx("shrink-0 pr-[6px] text-c-text-secondary", T[size], FONT)}>{seg.suffix}</span>}
    </div>
  );
}

export function NumericPairInput({ a, b, keyframe, trailing, size = "medium", disabled = false, className }: NumericPairInputProps) {
  const [focusCount, setFocusCount] = useState(0);
  const onFocusChange = (value: boolean) => setFocusCount(count => Math.max(0, count + (value ? 1 : -1)));
  return (
    <SeparatedFieldActions className={className}>
      <FieldShell focused={focusCount > 0} disabled={disabled} size={size} joined={Boolean(keyframe || trailing)} className="flex-1 min-w-0" numeric>
        <PairSegment seg={a} size={size} isLast={false} disabled={disabled} onFocusChange={onFocusChange} />
        <PairSegment seg={b} size={size} isLast={true} disabled={disabled} onFocusChange={onFocusChange} />
      </FieldShell>
      {keyframe && <FieldAction
        ariaLabel={`${a.ariaLabel}/${b.ariaLabel} keyframe`}
        active={keyframe.active}
        disabled={disabled}
        onClick={keyframe.onToggle}
      >
        <Diamond size={11} strokeWidth={1.5} className={clsx(keyframe.active && "fill-current")} />
      </FieldAction>}
      {trailing && <FieldActionSlot>{trailing}</FieldActionSlot>}
    </SeparatedFieldActions>
  );
}

// ─── NumericComboInput ───────────────────────────────────────────────────────
// NumericInput + an actual anchored menu trigger. The numeric half retains the
// shared host-owned edit-session contract; choosing a relative mode is a
// discrete controlled action owned by the host.

export interface NumericComboInputProps extends Omit<NumericInputProps, "dropdown"> {
  dropdownAriaLabel: string;
  /** Replaces the numeric editor for relative/non-numeric modes such as Auto. */
  readOnlyLabel?: string;
  /**
   * Covers the resolved numeric value while idle, then reveals that value on
   * focus so typing can atomically convert a relative sizing mode. Mere hover
   * must never replace the authored Hug/Fill label with a resolved number.
   */
  idleLabel?: string;
  /** Optional visible state in the menu segment (for example Hug, Fill or Mixed). */
  triggerLabel?: string;
  menu: (close: () => void) => ReactNode;
  menuAlign?: "left" | "right";
  dataMode?: string;
}

export function NumericComboInput({
  dropdownAriaLabel,
  readOnlyLabel,
  idleLabel,
  triggerLabel,
  menu,
  menuAlign = "right",
  dataMode,
  iconLead,
  size = "medium",
  disabled = false,
  className,
  ...numericProps
}: NumericComboInputProps) {
  return (
    <div data-composa-numeric-combo={dataMode ?? "fixed"} className={clsx("flex items-start gap-px", className)}>
      <div className="group relative flex-1 min-w-0">
        {readOnlyLabel !== undefined ? (
          <FieldShell focused={false} disabled={disabled} size={size} numeric joined>
            {iconLead && (
              <span className={clsx("absolute left-0 flex items-center justify-center size-[24px] text-c-text-secondary pointer-events-none", FONT, T[size])}>
                {iconLead}
              </span>
            )}
            <span className={clsx("min-w-0 truncate text-c-text", FONT, T[size], iconLead ? "pl-[26px]" : "pl-[8px]")}>{readOnlyLabel}</span>
          </FieldShell>
        ) : (
          <NumericInput
            {...numericProps}
            iconLead={iconLead}
            size={size}
            disabled={disabled}
            joined
            className={clsx(
              idleLabel && "[&_input]:text-transparent group-focus-within:[&_input]:text-c-text",
            )}
          />
        )}
        {idleLabel && readOnlyLabel === undefined && (
          <span
            data-composa-relative-mode-label
            aria-hidden="true"
            className={clsx(
              "pointer-events-none absolute inset-y-0 right-0 flex min-w-0 items-center truncate pr-[4px] text-c-text",
              FONT,
              T[size],
              iconLead ? "left-[26px]" : "left-[8px]",
              "group-focus-within:hidden",
            )}
          >
            {idleLabel}
          </span>
        )}
      </div>
      <PopoverMenu
        directTrigger
        align={menuAlign}
        className="shrink-0"
        trigger={(
          <button
            type="button"
            aria-label={dropdownAriaLabel}
            aria-haspopup="menu"
            disabled={disabled}
            className={clsx(
              "flex items-center justify-center min-w-[24px] px-[6px] gap-[3px] rounded-r-c-md bg-c-bg-secondary",
              H[size], "text-c-icon-secondary hover:bg-c-bg-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-c-focus-ring",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          >
            {triggerLabel && <span className={clsx(FONT, T[size], "text-c-text truncate max-w-[38px]")}>{triggerLabel}</span>}
            <ChevronDown size={10} strokeWidth={2} />
          </button>
        )}
      >
        {menu}
      </PopoverMenu>
    </div>
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

export type ColorFillType = "Fill" | "Opacity" | "Gradient" | "Image" | "Video" | "Variable";

interface ColorInputProps {
  ariaLabel?: string;
  label?: string;
  color?: string;
  /** Exact authored gradient CSS for Gradient chits. */
  gradient?: string;
  opacity?: number;
  fillType?: ColorFillType;
  fillLabel?: string;         // for Gradient/Image/Variable — replaces hex
  variableValue?: string;     // when fillType=Variable
  size?: InputSize;
  disabled?: boolean;
  fullWidth?: boolean;        // fluid — fill the container instead of the fixed 144px
  /** Hide the combined opacity segment when opacity is authored in its own truthful row. */
  showOpacity?: boolean;
  /** Optional motion binding for the color value itself. */
  keyframe?: { active: boolean; onToggle: () => void };
  /** When set, the swatch opens this (e.g. the Fill/Color dialog) instead of the native color picker. */
  onSwatchClick?: () => void;
  onColorChange?: (hex: string) => void;
  onOpacityChange?: (pct: number) => void;
  /** Host-owned motion controls. Omit for paints without a real evaluator. */
  colorKeyframe?: { active: boolean; onToggle: () => void };
  opacityKeyframe?: { active: boolean; onToggle: () => void };
  className?: string;
}

function ColorKeyframeButton({ label, control, disabled = false }: { label: string; control: { active: boolean; onToggle: () => void }; disabled?: boolean }) {
  return <FieldAction ariaLabel={`${label} keyframe`} active={control.active} disabled={disabled} onClick={control.onToggle}>
    <Diamond size={11} strokeWidth={1.5} className={clsx(control.active && "fill-current")} />
  </FieldAction>;
}

export function ColorInput({
  ariaLabel,
  label,
  color = "#ff24bd",
  gradient,
  opacity = 100,
  fillType = "Fill",
  fillLabel,
  variableValue,
  size = "medium",
  disabled = false,
  fullWidth = false,
  showOpacity = true,
  keyframe,
  onSwatchClick,
  onColorChange,
  onOpacityChange,
  colorKeyframe,
  opacityKeyframe,
  className,
}: ColorInputProps) {
  const [focusedHex, setFocusedHex] = useState(false);
  const [focusedOpacity, setFocusedOpacity] = useState(false);
  const cancelHexRef = useRef(false);
  const focused = focusedHex || focusedOpacity;

  const hex = color.replace(/^#/, "").toUpperCase();
  const [hexDraft, setHexDraft] = useState(hex);
  useEffect(() => { if (!focusedHex) setHexDraft(hex); }, [hex, focusedHex]);
  const commitHex = () => {
    const next = hexDraft.toUpperCase();
    if (/^[0-9A-F]{6}$/.test(next)) {
      setHexDraft(next);
      if (next !== hex) onColorChange?.(`#${next}`);
    } else {
      setHexDraft(hex);
    }
  };
  const isVariable = fillType === "Variable";
  const isTextLabel = fillType === "Gradient" || fillType === "Image" || fillType === "Video" || isVariable;

  // chit type mapping
  const chitType = fillType === "Variable" || fillType === "Video" ? "Fill" : fillType as ChitType;

  const midText = isVariable
    ? variableValue ?? "bg-assistive"
    : isTextLabel
      ? fillLabel ?? (fillType === "Gradient" ? "Angular" : fillType)
      : hex;

  return (
    <div className={clsx("flex flex-col gap-[4px]", fullWidth && "w-full min-w-0", className)}>
      {label && (
        <span className="text-[11px] font-[550] leading-[16px] tracking-[0.005em] text-c-text select-none">
          {label}
        </span>
      )}

      <SeparatedFieldActions className={clsx(isVariable || fullWidth ? "w-full" : "w-[144px]")}>
        <FieldShell
          focused={focused}
          disabled={disabled}
          size={size}
          joined={!isVariable && Boolean(colorKeyframe || keyframe || showOpacity && opacityKeyframe)}
          className="flex-1 min-w-0"
        >
        {/* chit */}
        {!isVariable && (
          <label className="relative shrink-0 flex items-center justify-center size-[24px] cursor-pointer">
            <Chit color={color} gradient={gradient} type={chitType} />
            {onSwatchClick ? (
              <button
                type="button"
                aria-label={`Edit ${ariaLabel ?? label ?? "color"}`}
                disabled={disabled}
                onClick={onSwatchClick}
                className="absolute inset-0 w-full h-full cursor-pointer"
              />
            ) : fillType === "Fill" ? (
              <input
                aria-label={`Edit ${ariaLabel ?? label ?? "color"}`}
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
              aria-label={`${ariaLabel ?? label ?? "Color"} hex`}
              type="text"
              value={focusedHex ? hexDraft : hex}
              disabled={disabled}
              maxLength={6}
              onChange={e => setHexDraft(e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase())}
              onFocus={event => { cancelHexRef.current = false; setHexDraft(hex); setFocusedHex(true); event.currentTarget.select(); }}
              onKeyDown={event => {
                if (event.key === "Enter") event.currentTarget.blur();
                else if (event.key === "Escape") { cancelHexRef.current = true; setHexDraft(hex); event.currentTarget.blur(); }
              }}
              onBlur={() => {
                if (cancelHexRef.current) cancelHexRef.current = false;
                else commitHex();
                setFocusedHex(false);
              }}
              className={clsx(
                "w-full h-full bg-transparent outline-none uppercase",
                FONT, T[size], "text-c-text",
                disabled && "cursor-not-allowed",
              )}
            />
          )}
        </div>

        {/* opacity section — hidden for Variable fill */}
        {!isVariable && showOpacity && (
          <div className="flex items-center shrink-0 self-stretch border-l border-c-bg w-[53px]">
            <input
              aria-label={`${ariaLabel ?? label ?? "Color"} opacity`}
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
        </FieldShell>
        {colorKeyframe && !isVariable && <ColorKeyframeButton label={`${ariaLabel ?? label ?? "Color"} color`} control={colorKeyframe} disabled={disabled} />}
        {keyframe && <ColorKeyframeButton label={ariaLabel ?? label ?? "Color"} control={keyframe} disabled={disabled} />}
        {opacityKeyframe && !isVariable && showOpacity && <ColorKeyframeButton label={`${ariaLabel ?? label ?? "Color"} opacity`} control={opacityKeyframe} disabled={disabled} />}
      </SeparatedFieldActions>
    </div>
  );
}

// ─── ComboInput ───────────────────────────────────────────────────────────────
// Input field + split chevron dropdown button.
// The chevron only renders when the consumer gives it something to do — either
// an anchored `menu` or an `onDropdownClick`. A chevron with neither is an inert
// control that still advertises a dropdown (Composa#661: the font-size chevron
// shipped that way and nothing dropped down), so it is omitted instead.

type ComboInputState = "default" | "hover" | "selectedInput" | "selectedChevron";

interface ComboInputProps {
  value?: string;
  defaultValue?: string;
  ariaLabel?: string;
  iconLead?: ReactNode;
  variableValue?: string;
  size?: InputSize;
  disabled?: boolean;
  state?: ComboInputState;
  /**
   * Selects the editable value when focus first enters the input. Because this
   * runs only on focus, a deliberate second pointer click keeps the browser's
   * native caret-placement behavior.
   */
  selectAllOnFocus?: boolean;
  onInputChange?: (v: string) => void;
  /**
   * Renders the chevron half as an anchored menu trigger. Takes precedence over
   * `onDropdownClick`; receives `close` so a chosen row can dismiss the popover.
   */
  menu?: (close: () => void) => ReactNode;
  /** Names the chevron half for assistive tech, e.g. "Font size presets". */
  dropdownAriaLabel?: string;
  onDropdownClick?: () => void;
  /** Host-owned motion binding for the numeric value. Kept independent from the
   * preset menu so a font-size field can expose both truthful actions. */
  keyframe?: { active: boolean; onToggle: () => void };
  className?: string;
}

export function ComboInput({
  value,
  defaultValue,
  ariaLabel,
  iconLead,
  variableValue,
  size = "medium",
  disabled = false,
  state = "default",
  selectAllOnFocus = false,
  onInputChange,
  menu,
  dropdownAriaLabel,
  onDropdownClick,
  keyframe,
  className,
}: ComboInputProps) {
  const [internalFocused, setInternalFocused] = useState(false);
  const inputFocused = state === "selectedInput" || internalFocused;
  const chevronFocused = state === "selectedChevron";

  const inputRing = inputFocused ? "ring-c-focus-ring" : state === "hover" ? "ring-c-border" : "ring-transparent";
  const chevronBg = chevronFocused ? "bg-c-bg-selected" : state === "hover" ? "bg-c-bg-tertiary" : "bg-c-bg-secondary";
  const chevronRing = (inputFocused || chevronFocused || state === "hover") ? "ring-c-focus-ring" : "ring-transparent";

  const chevron = (
    <button
      type="button"
      aria-label={dropdownAriaLabel}
      aria-haspopup={menu ? "menu" : undefined}
      onClick={!disabled && !menu ? onDropdownClick : undefined}
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
  );

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
            aria-label={ariaLabel}
            type="text"
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            onChange={e => onInputChange?.(e.target.value)}
            onFocus={event => {
              setInternalFocused(true);
              if (selectAllOnFocus) event.currentTarget.select();
            }}
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

      {keyframe && (
        <button
          type="button"
          aria-label={ariaLabel ? `${ariaLabel} keyframe` : "Toggle keyframe"}
          aria-pressed={keyframe.active}
          disabled={disabled}
          onClick={event => { event.stopPropagation(); if (!disabled) keyframe.onToggle(); }}
          className={clsx(
            "shrink-0 flex items-center justify-center size-[24px] bg-c-bg-secondary hover:bg-c-bg-hover",
            keyframe.active && "bg-c-bg-selected",
            disabled && "cursor-not-allowed opacity-60 hover:bg-c-bg-secondary",
          )}
        >
          <Diamond size={11} strokeWidth={1.5} className={clsx(keyframe.active ? "fill-current text-c-text-brand" : "text-c-icon-secondary")} />
        </button>
      )}

      {/* chevron half — omitted entirely when it would do nothing */}
      {menu
        ? <PopoverMenu directTrigger align="right" className="shrink-0" trigger={chevron}>{menu}</PopoverMenu>
        : onDropdownClick ? chevron : null}
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
