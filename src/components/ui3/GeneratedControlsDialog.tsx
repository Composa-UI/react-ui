import { ChevronRight, X } from "lucide-react";
import { type ReactElement } from "react";
import { Button } from "./Button";
import { Dropdown } from "./Dropdown";
import { ColorInput, InputField, NumericInput } from "./Input";
import {
  COMPACT_INSPECTOR_DIALOG_WIDTH,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR,
  InspectorDialog,
} from "./InspectorDialog";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { PanelSection } from "./Panel";
import { Switch } from "./Switch";

export interface GeneratedControlKeyframe {
  active: boolean;
  onToggle: () => void;
}

interface GeneratedControlBase {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  keyframe?: GeneratedControlKeyframe;
}

export type GeneratedControlSetting =
  | (GeneratedControlBase & { kind: "number"; value: number; min?: number; max?: number; step?: number; unit?: string })
  | (GeneratedControlBase & { kind: "color"; value: string })
  | (GeneratedControlBase & { kind: "text"; value: string; multiline?: boolean })
  | (GeneratedControlBase & { kind: "boolean"; value: boolean })
  | (GeneratedControlBase & { kind: "enum"; value: string; options: Array<{ value: string; label: string }> })
  | (GeneratedControlBase & { kind: "asset"; value: string; displayValue?: string });

export interface GeneratedControlsValue {
  id: string;
  title: string;
  controls: GeneratedControlSetting[];
}

export interface GeneratedControlsDialogProps {
  value: GeneratedControlsValue;
  open: boolean;
  readOnly?: boolean;
  trigger: ReactElement;
  onChange?: (controlId: string, value: number | string | boolean) => void;
  onChooseAsset?: (controlId: string) => void;
  onClose: () => void;
}

const LABEL = "w-[88px] shrink-0 text-[11px] font-[450] leading-[16px] text-c-text-secondary";

function ControlRow({
  control,
  readOnly,
  onChange,
  onChooseAsset,
}: {
  control: GeneratedControlSetting;
  readOnly: boolean;
  onChange?: GeneratedControlsDialogProps["onChange"];
  onChooseAsset?: GeneratedControlsDialogProps["onChooseAsset"];
}) {
  const disabled = readOnly || control.disabled === true;
  const field = (() => {
    if (control.kind === "number") return <NumericInput ariaLabel={control.label} value={control.value}
      min={control.min} max={control.max} step={control.step} suffix={control.unit} disabled={disabled}
      keyframe={disabled ? undefined : control.keyframe} onChange={value => onChange?.(control.id, value)} />;
    if (control.kind === "color") return <ColorInput ariaLabel={control.label} color={control.value} showOpacity={false}
      fullWidth disabled={disabled} colorKeyframe={disabled ? undefined : control.keyframe}
      onColorChange={value => onChange?.(control.id, value)} />;
    if (control.kind === "text") return <InputField value={control.value} multiline={control.multiline} disabled={disabled}
      onChange={value => onChange?.(control.id, value)} />;
    if (control.kind === "boolean") return <div className="flex h-[24px] items-center justify-end"><Switch checked={control.value}
      disabled={disabled} size="compact" label={control.label} onCheckedChange={value => onChange?.(control.id, value)} /></div>;
    if (control.kind === "enum") {
      const label = control.options.find(option => option.value === control.value)?.label ?? control.value;
      return <PopoverMenu align="left" trigger={<Dropdown ariaLabel={control.label} value={label} disabled={disabled} fullWidth />}>
        {close => <Menu>{control.options.map(option => <MenuRow key={option.value} type="checkmark" selectionRole="radio"
          label={option.label} checked={option.value === control.value} disabled={disabled}
          onClick={() => { onChange?.(control.id, option.value); close(); }} />)}</Menu>}
      </PopoverMenu>;
    }
    return <Button variant="Secondary" size="wide" label={control.displayValue || "Choose asset"} disabled={disabled}
      onClick={() => onChooseAsset?.(control.id)} />;
  })();
  return <div className="flex min-h-[32px] items-center gap-[8px]" title={control.description}>
    <span className={LABEL}>{control.label}</span>
    <div className="min-w-0 flex-1">{field}</div>
  </div>;
}

export function GeneratedControlsDialog({ value, open, readOnly = false, trigger, onChange, onChooseAsset, onClose }: GeneratedControlsDialogProps) {
  return <InspectorDialog open={open} onClose={onClose} trigger={trigger} ariaLabel={value.title}
    width={COMPACT_INSPECTOR_DIALOG_WIDTH} anchorSurfaceSelector={COMPOSA_INSPECTOR_SURFACE_SELECTOR}
    elevation={400} triggerClassName="block w-full">
    <div className="flex h-[40px] items-center border-b border-c-border px-[12px]">
      <h2 className="m-0 flex-1 font-[family-name:var(--composa-font-family)] text-[11px] font-[550] leading-[16px] text-c-text">{value.title}</h2>
      <button type="button" aria-label={`Close ${value.title}`} onClick={onClose}
        className="flex size-[24px] items-center justify-center rounded-c-sm text-c-icon-secondary outline-none hover:bg-c-bg-hover focus-visible:ring-1 focus-visible:ring-c-focus-ring">
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
    <div className="flex flex-col gap-[4px] p-[12px]">
      {value.controls.map(control => <ControlRow key={control.id} control={control} readOnly={readOnly}
        onChange={onChange} onChooseAsset={onChooseAsset} />)}
    </div>
  </InspectorDialog>;
}

export function GeneratedControlsSection({ value, open, readOnly = false, onOpenChange, onChange, onChooseAsset }: {
  value: GeneratedControlsValue;
  open: boolean;
  readOnly?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange?: GeneratedControlsDialogProps["onChange"];
  onChooseAsset?: GeneratedControlsDialogProps["onChooseAsset"];
}) {
  const trigger = <button type="button" aria-label={`Open ${value.title}`} onClick={() => onOpenChange(true)}
    className="flex h-[32px] w-full items-center gap-[8px] px-[16px] text-left text-[11px] font-[450] text-c-text outline-none hover:bg-c-bg-hover focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-c-focus-ring">
    <span className="min-w-0 flex-1 truncate">{value.title}</span>
    <span className="text-c-icon-secondary"><ChevronRight size={14} strokeWidth={1.5} /></span>
  </button>;
  return <PanelSection title="Properties" landmark>
    <GeneratedControlsDialog value={value} open={open} readOnly={readOnly} trigger={trigger}
      onChange={onChange} onChooseAsset={onChooseAsset} onClose={() => onOpenChange(false)} />
  </PanelSection>;
}
