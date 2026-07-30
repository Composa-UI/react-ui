import { X } from "lucide-react";
import { type ReactElement } from "react";
import { Checkbox } from "./Checkbox";
import { Dropdown } from "./Dropdown";
import { InspectorDialog } from "./InspectorDialog";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { Tooltip } from "./Tooltip";

export interface AutoLayoutSettingsValue {
  mode: "none" | "horizontal" | "vertical";
  textBaseline: boolean | "mixed";
  strokeSizing: "excluded" | "included" | "mixed";
  canvasStacking: "first-on-top" | "last-on-top" | "mixed";
  baselineApplicable?: boolean;
}

export interface AutoLayoutSettingsDialogProps {
  open: boolean;
  value: AutoLayoutSettingsValue;
  trigger: ReactElement;
  disabled?: boolean;
  onChange?: (patch: {
    textBaseline?: boolean;
    strokeSizing?: "excluded" | "included";
    canvasStacking?: "first-on-top" | "last-on-top";
  }) => void;
  onClose: () => void;
}

const LABEL = "w-[104px] shrink-0 text-[11px] font-[450] leading-[16px] text-c-text-secondary";

function SettingRow({ label, children }: { label: string; children: ReactElement }) {
  return (
    <div className="flex min-h-[32px] items-center gap-[8px]">
      <span className={LABEL}>{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function AutoLayoutSettingsDialog({
  open,
  value,
  trigger,
  disabled = false,
  onChange,
  onClose,
}: AutoLayoutSettingsDialogProps) {
  const baselineApplicable = value.baselineApplicable ?? value.mode === "horizontal";
  const strokeLabel = value.strokeSizing === "mixed" ? "Mixed" : value.strokeSizing === "included" ? "Included" : "Excluded";
  const stackingLabel = value.canvasStacking === "mixed" ? "Mixed" : value.canvasStacking === "first-on-top" ? "First on top" : "Last on top";
  return (
    <InspectorDialog
      open={open}
      onClose={onClose}
      trigger={trigger}
      ariaLabel="Auto Layout Settings"
      width={288}
      triggerClassName="inline-flex"
    >
      <div className="flex h-[40px] items-center border-b border-c-border px-[12px]">
        <h2 className="m-0 flex-1 font-[family-name:var(--composa-font-family)] text-[11px] font-[550] leading-[16px] text-c-text">
          Auto Layout Settings
        </h2>
        <button
          type="button"
          aria-label="Close Auto Layout Settings"
          onClick={onClose}
          className="flex size-[24px] items-center justify-center rounded-c-sm text-c-icon-secondary outline-none hover:bg-c-bg-hover focus-visible:ring-1 focus-visible:ring-c-focus-ring"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex flex-col gap-[4px] p-[12px]">
        <SettingRow label="Strokes">
          <PopoverMenu
            align="left"
            trigger={<Dropdown ariaLabel={`Stroke inclusion: ${strokeLabel}`} value={strokeLabel} mixed={value.strokeSizing === "mixed"} disabled={disabled} fullWidth />}
          >
            {close => (
              <Menu>
                <MenuRow type="checkmark" selectionRole="radio" label="Excluded" checked={value.strokeSizing === "excluded"} disabled={disabled} onClick={() => { onChange?.({ strokeSizing: "excluded" }); close(); }} />
                <MenuRow type="checkmark" selectionRole="radio" label="Included" checked={value.strokeSizing === "included"} disabled={disabled} onClick={() => { onChange?.({ strokeSizing: "included" }); close(); }} />
              </Menu>
            )}
          </PopoverMenu>
        </SettingRow>
        <SettingRow label="Canvas stacking">
          <PopoverMenu
            align="left"
            trigger={<Dropdown ariaLabel={`Canvas stacking: ${stackingLabel}`} value={stackingLabel} mixed={value.canvasStacking === "mixed"} disabled={disabled} fullWidth />}
          >
            {close => (
              <Menu>
                <MenuRow type="checkmark" selectionRole="radio" label="First on top" checked={value.canvasStacking === "first-on-top"} disabled={disabled} onClick={() => { onChange?.({ canvasStacking: "first-on-top" }); close(); }} />
                <MenuRow type="checkmark" selectionRole="radio" label="Last on top" checked={value.canvasStacking === "last-on-top"} disabled={disabled} onClick={() => { onChange?.({ canvasStacking: "last-on-top" }); close(); }} />
              </Menu>
            )}
          </PopoverMenu>
        </SettingRow>
        <SettingRow label="Text baseline">
          <Tooltip
            label="Only applicable for horizontal layouts"
            direction="Left"
            disabled={baselineApplicable || disabled}
          >
            <span className="inline-flex">
              <Checkbox
                checked={value.textBaseline}
                disabled={disabled || !baselineApplicable}
                label="Align text baseline"
                onChange={textBaseline => onChange?.({ textBaseline })}
              />
            </span>
          </Tooltip>
        </SettingRow>
      </div>
    </InspectorDialog>
  );
}
