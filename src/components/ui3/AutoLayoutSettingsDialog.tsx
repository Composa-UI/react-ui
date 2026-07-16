import { X } from "lucide-react";
import { type ReactElement } from "react";
import { Checkbox } from "./Checkbox";
import { Dropdown } from "./Dropdown";
import { InspectorDialog } from "./InspectorDialog";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { Tooltip } from "./Tooltip";

export interface AutoLayoutSettingsValue {
  mode: "none" | "horizontal" | "vertical" | "wrap";
  textBaseline: boolean;
  strokeSizing: "excluded" | "included";
  canvasStacking: "first-on-top" | "last-on-top";
}

export interface AutoLayoutSettingsDialogProps {
  open: boolean;
  value: AutoLayoutSettingsValue;
  trigger: ReactElement;
  onChange?: (patch: Partial<Omit<AutoLayoutSettingsValue, "mode">>) => void;
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
  onChange,
  onClose,
}: AutoLayoutSettingsDialogProps) {
  const baselineApplicable = value.mode === "horizontal";
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
            trigger={<Dropdown ariaLabel="Stroke inclusion" value={value.strokeSizing === "included" ? "Included" : "Excluded"} fullWidth />}
          >
            {close => (
              <Menu minWidth={156}>
                <MenuRow type="checkmark" label="Excluded" checked={value.strokeSizing === "excluded"} onClick={() => { onChange?.({ strokeSizing: "excluded" }); close(); }} />
                <MenuRow type="checkmark" label="Included" checked={value.strokeSizing === "included"} onClick={() => { onChange?.({ strokeSizing: "included" }); close(); }} />
              </Menu>
            )}
          </PopoverMenu>
        </SettingRow>
        <SettingRow label="Canvas stacking">
          <PopoverMenu
            align="left"
            trigger={<Dropdown ariaLabel="Canvas stacking" value={value.canvasStacking === "first-on-top" ? "First on top" : "Last on top"} fullWidth />}
          >
            {close => (
              <Menu minWidth={156}>
                <MenuRow type="checkmark" label="First on top" checked={value.canvasStacking === "first-on-top"} onClick={() => { onChange?.({ canvasStacking: "first-on-top" }); close(); }} />
                <MenuRow type="checkmark" label="Last on top" checked={value.canvasStacking === "last-on-top"} onClick={() => { onChange?.({ canvasStacking: "last-on-top" }); close(); }} />
              </Menu>
            )}
          </PopoverMenu>
        </SettingRow>
        <SettingRow label="Text baseline">
          <Tooltip
            label="Only applicable for horizontal layouts"
            direction="Left"
            disabled={baselineApplicable}
          >
            <span className="inline-flex">
              <Checkbox
                checked={value.textBaseline}
                disabled={!baselineApplicable}
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
