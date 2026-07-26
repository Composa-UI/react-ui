import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Strikethrough,
  Underline,
  X,
} from "lucide-react";
import { type ReactElement, type ReactNode } from "react";
import {
  COMPACT_INSPECTOR_DIALOG_WIDTH,
  EFFECTS_INSPECTOR_DIALOG_SIDE_OFFSET,
  InspectorDialog,
} from "./InspectorDialog";
import { SegmentedControlGroup, SegmentedControlItem } from "./SegmentedControl";

export type TypeSettingsAlignment = "left" | "center" | "right" | "justify";
export type TypeSettingsDecoration = "none" | "underline" | "strikethrough";
export type TypeSettingsCase = "none" | "upper" | "lower" | "title";

export interface TypeSettingsValue {
  alignment: TypeSettingsAlignment;
  decoration: TypeSettingsDecoration;
  textCase: TypeSettingsCase;
  alignmentMixed?: boolean;
  decorationMixed?: boolean;
  textCaseMixed?: boolean;
}

export interface TypeSettingsDialogProps {
  open: boolean;
  trigger: ReactElement;
  value: TypeSettingsValue;
  readOnly?: boolean;
  onChange?: (patch: Partial<Pick<TypeSettingsValue, "alignment" | "decoration" | "textCase">>) => void;
  onClose: () => void;
}

const LABEL = "w-[72px] shrink-0 text-[11px] leading-[16px] font-[450] text-c-text-secondary";

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex min-h-[32px] items-center gap-[8px]">
    <span className={LABEL}>{label}</span>
    <div className="min-w-0 flex-1">{children}</div>
  </div>;
}

function ChoiceGroup<T extends string>({
  ariaLabel,
  value,
  mixed,
  options,
  disabled,
  onChange,
}: {
  ariaLabel: string;
  value: T;
  mixed?: boolean;
  options: readonly { value: T; label: string; ariaLabel?: string; icon?: ReactNode }[];
  disabled: boolean;
  onChange: (value: T) => void;
}) {
  return <SegmentedControlGroup
    role="group"
    aria-label={`${ariaLabel}: ${mixed ? "Mixed" : options.find(option => option.value === value)?.label}`}
    className="w-full p-[1px]"
  >
    {options.map(option => <SegmentedControlItem
      key={option.value}
      selected={!mixed && option.value === value}
      disabled={disabled}
      aria-label={option.ariaLabel ?? option.label}
      aria-pressed={!mixed && option.value === value}
      icon={option.icon}
      label={option.icon ? undefined : option.label}
      className="px-[4px]"
      onClick={() => onChange(option.value)}
    />)}
  </SegmentedControlGroup>;
}

const ALIGNMENT_OPTIONS = [
  { value: "left", label: "Align left", icon: <AlignLeft size={16} strokeWidth={1.5} /> },
  { value: "center", label: "Align center", icon: <AlignCenter size={16} strokeWidth={1.5} /> },
  { value: "right", label: "Align right", icon: <AlignRight size={16} strokeWidth={1.5} /> },
  { value: "justify", label: "Justify", icon: <AlignJustify size={16} strokeWidth={1.5} /> },
] as const;

const DECORATION_OPTIONS = [
  { value: "none", label: "None", icon: <span aria-hidden className="text-[14px] leading-none">−</span> },
  { value: "underline", label: "Underline", icon: <Underline size={16} strokeWidth={1.5} /> },
  { value: "strikethrough", label: "Strikethrough", icon: <Strikethrough size={16} strokeWidth={1.5} /> },
] as const;

const CASE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "upper", label: "AG", ariaLabel: "Uppercase" },
  { value: "lower", label: "ag", ariaLabel: "Lowercase" },
  { value: "title", label: "Ag", ariaLabel: "Title case" },
] as const;

export function TypeSettingsDialog({
  open,
  trigger,
  value,
  readOnly = false,
  onChange,
  onClose,
}: TypeSettingsDialogProps) {
  const disabled = readOnly || !onChange;
  return <InspectorDialog
    open={open}
    onClose={onClose}
    trigger={trigger}
    ariaLabel="Type settings"
    width={COMPACT_INSPECTOR_DIALOG_WIDTH}
    sideOffset={EFFECTS_INSPECTOR_DIALOG_SIDE_OFFSET}
    elevation={400}
  >
    <div className="flex h-[40px] items-center border-b border-c-border pl-[16px] pr-[8px]">
      <span className="flex-1 text-[11px] font-[550] text-c-text">Type settings</span>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex size-[24px] items-center justify-center rounded-c-md text-c-icon-secondary hover:bg-c-bg-hover"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
    <div className="flex flex-col gap-[4px] p-[12px]">
      <FieldRow label="Alignment">
        <ChoiceGroup
          ariaLabel="Alignment"
          value={value.alignment}
          mixed={value.alignmentMixed}
          options={ALIGNMENT_OPTIONS}
          disabled={disabled}
          onChange={alignment => onChange?.({ alignment })}
        />
      </FieldRow>
      <FieldRow label="Decoration">
        <ChoiceGroup
          ariaLabel="Decoration"
          value={value.decoration}
          mixed={value.decorationMixed}
          options={DECORATION_OPTIONS}
          disabled={disabled}
          onChange={decoration => onChange?.({ decoration })}
        />
      </FieldRow>
      <FieldRow label="Case">
        <ChoiceGroup
          ariaLabel="Case"
          value={value.textCase}
          mixed={value.textCaseMixed}
          options={CASE_OPTIONS}
          disabled={disabled}
          onChange={textCase => onChange?.({ textCase })}
        />
      </FieldRow>
      {readOnly && <p className="px-[2px] pt-[4px] text-[10px] text-c-text-tertiary">
        Unlock the selection to edit type settings.
      </p>}
    </div>
  </InspectorDialog>;
}
