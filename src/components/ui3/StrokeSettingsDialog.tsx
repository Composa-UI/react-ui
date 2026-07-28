import { FlipHorizontal, X } from "lucide-react";
import { type ReactElement, type ReactNode } from "react";
import { Dropdown } from "./Dropdown";
import {
  COMPACT_INSPECTOR_DIALOG_WIDTH,
  InspectorDialog,
  STROKE_SETTINGS_INSPECTOR_SIDE_OFFSET,
} from "./InspectorDialog";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { SegmentedControlGroup, SegmentedControlItem } from "./SegmentedControl";
import { Tooltip } from "./Tooltip";

export type StrokeStyle = "solid" | "dashed" | "dotted";
export type StrokeJoin = "miter" | "round" | "bevel";
export type StrokeCap = "none" | "round" | "square";

export interface StrokeSettingsValue {
  style: StrokeStyle;
  join: StrokeJoin;
  cap: StrokeCap;
  styleMixed?: boolean;
  joinMixed?: boolean;
  capMixed?: boolean;
}

export interface StrokeSettingsDialogProps {
  open: boolean;
  trigger: ReactElement;
  value: StrokeSettingsValue;
  readOnly?: boolean;
  onChange?: (patch: Partial<Pick<StrokeSettingsValue, "style" | "join" | "cap">>) => void;
  onClose: () => void;
}

const STYLE_LABELS: Record<StrokeStyle, string> = {
  solid: "Solid",
  dashed: "Dashed",
  dotted: "Dotted",
};
const STYLE_OPTIONS = Object.keys(STYLE_LABELS) as StrokeStyle[];

const JOIN_LABELS: Record<StrokeJoin, string> = {
  miter: "Miter",
  round: "Round",
  bevel: "Bevel",
};
const JOIN_OPTIONS = Object.keys(JOIN_LABELS) as StrokeJoin[];

const CAP_LABELS: Record<StrokeCap, string> = {
  none: "None",
  round: "Round",
  square: "Square",
};
const CAP_OPTIONS = Object.keys(CAP_LABELS) as StrokeCap[];

const LABEL = "w-[72px] shrink-0 text-[11px] leading-[16px] font-[450] text-c-text-secondary";
const DISABLED_TAB_EXPLANATIONS = {
  Dynamic: "Dynamic stroke behavior needs an approved engine and persistence contract.",
  Brush: "Brush strokes need an approved engine and persistence contract.",
} as const;
const PROFILE_EXPLANATION = "Width profiles and profile flipping are not supported by the current document model.";
const MITER_EXPLANATION = "Editable miter angle is not supported by the current document model.";

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex min-h-[32px] items-center gap-[8px]">
    <span className={LABEL}>{label}</span>
    <div className="min-w-0 flex-1">{children}</div>
  </div>;
}

function StrokeStylePreview({ style }: { style: StrokeStyle }) {
  const dash = style === "solid" ? undefined : style === "dashed" ? "5 3" : "1 3";
  return <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap={style === "dotted" ? "round" : "butt"} strokeDasharray={dash} />
  </svg>;
}

function JoinPreview({ join }: { join: StrokeJoin }) {
  return <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
    <polyline points="2,13 8,5 14,13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="butt" strokeLinejoin={join} />
  </svg>;
}

function CapPreview({ cap }: { cap: StrokeCap }) {
  return <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 8h8" stroke="currentColor" strokeWidth="3" strokeLinecap={cap === "none" ? "butt" : cap} />
    <path d="M4 4v8M12 4v8" stroke="currentColor" strokeWidth=".75" strokeOpacity=".35" />
  </svg>;
}

function ChoiceGroup<T extends string>({
  ariaLabel,
  options,
  labels,
  value,
  mixed,
  disabled,
  preview,
  onChange,
}: {
  ariaLabel: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  mixed?: boolean;
  disabled?: boolean;
  preview: (option: T) => ReactNode;
  onChange: (option: T) => void;
}) {
  return <SegmentedControlGroup role="group" aria-label={`${ariaLabel}: ${mixed ? "Mixed" : labels[value]}`} className="w-full p-[1px]">
    {options.map(option => <SegmentedControlItem
      key={option}
      selected={!mixed && option === value}
      disabled={disabled}
      aria-label={labels[option]}
      aria-pressed={!mixed && option === value}
      icon={preview(option)}
      onClick={() => onChange(option)}
    />)}
  </SegmentedControlGroup>;
}

function DisabledTab({ label }: { label: keyof typeof DISABLED_TAB_EXPLANATIONS }) {
  const explanation = DISABLED_TAB_EXPLANATIONS[label];
  return <Tooltip label={explanation} direction="TopCenter">
    <span className="flex flex-1" title={explanation}>
      <SegmentedControlItem className="w-full" selected={false} disabled label={label} aria-label={`${label}: unavailable`} />
    </span>
  </Tooltip>;
}

export function StrokeSettingsDialog({
  open,
  trigger,
  value,
  readOnly = false,
  onChange,
  onClose,
}: StrokeSettingsDialogProps) {
  const editDisabled = readOnly || !onChange;
  const readOnlyExplanation = "Unlock the selection to edit stroke settings.";

  return <InspectorDialog
    open={open}
    onClose={onClose}
    trigger={trigger}
    ariaLabel="Stroke settings"
    width={COMPACT_INSPECTOR_DIALOG_WIDTH}
    sideOffset={STROKE_SETTINGS_INSPECTOR_SIDE_OFFSET}
    elevation={400}
    // The trigger is a 24px icon button that sits inline in the Stroke row next to
    // the flex-1 "Position"/"Weight" columns. InspectorDialog's default trigger
    // wrapper is `block w-full`, which gives this wrapper a full-width flex-basis and
    // starves the flex-1 columns down to 0 (the align dropdown rendered 0-width).
    // Keep the wrapper shrink-wrapped to the icon so the columns keep their share.
    triggerClassName="shrink-0"
  >
    <div className="flex h-[40px] items-center border-b border-c-border pl-[16px] pr-[8px]">
      <span className="flex-1 text-[11px] font-[550] text-c-text">Stroke settings</span>
      <button type="button" aria-label="Close" onClick={onClose}
        className="flex size-[24px] items-center justify-center rounded-c-md text-c-icon-secondary hover:bg-c-bg-hover">
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>

    <div className="px-[16px] pt-[12px]">
      <SegmentedControlGroup role="tablist" aria-label="Stroke settings tabs" className="w-full p-[1px]">
        <SegmentedControlItem role="tab" aria-selected selected label="Basic" />
        <DisabledTab label="Dynamic" />
        <DisabledTab label="Brush" />
      </SegmentedControlGroup>
    </div>

    <div className="flex flex-col gap-[4px] p-[12px]">
      <FieldRow label="Style">
        <PopoverMenu directTrigger align="right" className="w-full" trigger={
          <Dropdown
            aria-haspopup="menu"
            ariaLabel={`Style: ${value.styleMixed ? "Mixed" : STYLE_LABELS[value.style]}`}
            value={STYLE_LABELS[value.style]}
            mixed={value.styleMixed}
            disabled={editDisabled}
            leadingIcon={<StrokeStylePreview style={value.style} />}
            fullWidth
          />
        }>
          {close => <Menu minWidth={160}>{STYLE_OPTIONS.map(style => <MenuRow
            key={style}
            type="checkmark"
            selectionRole="radio"
            checked={!value.styleMixed && value.style === style}
            leading={<StrokeStylePreview style={style} />}
            label={STYLE_LABELS[style]}
            onClick={() => { onChange?.({ style }); close(); }}
          />)}</Menu>}
        </PopoverMenu>
      </FieldRow>

      <FieldRow label="Width profile">
        <Tooltip label={PROFILE_EXPLANATION} direction="TopCenter">
          <div className="flex min-w-0 gap-[4px]" title={PROFILE_EXPLANATION}>
            <Dropdown ariaLabel="Width profile: unavailable" value="Uniform" disabled fullWidth />
            <button type="button" aria-label="Flip width profile: unavailable" disabled
              className="flex size-[24px] shrink-0 items-center justify-center rounded-c-md text-c-icon-tertiary">
              <FlipHorizontal size={16} strokeWidth={1.5} />
            </button>
          </div>
        </Tooltip>
      </FieldRow>

      <FieldRow label="Join">
        <ChoiceGroup ariaLabel="Join" options={JOIN_OPTIONS} labels={JOIN_LABELS} value={value.join}
          mixed={value.joinMixed} disabled={editDisabled} preview={join => <JoinPreview join={join} />}
          onChange={join => onChange?.({ join })} />
      </FieldRow>

      {value.join === "miter" && !value.joinMixed && <FieldRow label="Miter angle">
        <Tooltip label={MITER_EXPLANATION} direction="TopCenter">
          <div title={MITER_EXPLANATION}><Dropdown ariaLabel="Miter angle: unavailable" value="Not supported" disabled fullWidth /></div>
        </Tooltip>
      </FieldRow>}

      <FieldRow label="Cap">
        <ChoiceGroup ariaLabel="Cap" options={CAP_OPTIONS} labels={CAP_LABELS} value={value.cap}
          mixed={value.capMixed} disabled={editDisabled} preview={cap => <CapPreview cap={cap} />}
          onChange={cap => onChange?.({ cap })} />
      </FieldRow>

      {readOnly && <p className="sr-only" aria-live="polite">{readOnlyExplanation}</p>}
    </div>
  </InspectorDialog>;
}
