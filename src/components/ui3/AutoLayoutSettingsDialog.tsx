import { Check, Minus, X } from "lucide-react";
import { type ReactElement } from "react";
import { AlignmentControl, type AlignmentValue } from "./AlignmentControl";
import { Dropdown } from "./Dropdown";
import {
  AUTO_LAYOUT_SETTINGS_INSPECTOR_SIDE_OFFSET,
  COMPACT_INSPECTOR_DIALOG_WIDTH,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR,
  InspectorDialog,
} from "./InspectorDialog";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { SegmentedControl } from "./SegmentedControl";
import { Tooltip } from "./Tooltip";
import type { ElementGridSettings, GridContentAlign } from "./PropertyPanel";

export interface AutoLayoutSettingsValue {
  mode: "none" | "horizontal" | "vertical" | "grid";
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
  grid?: ElementGridSettings;
  onGridChange?: (patch: Partial<ElementGridSettings>) => void;
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
  grid,
  onGridChange,
  onChange,
  onClose,
}: AutoLayoutSettingsDialogProps) {
  const baselineApplicable = value.baselineApplicable ?? value.mode === "horizontal";
  const strokeLabel = value.strokeSizing === "mixed" ? "Mixed" : value.strokeSizing === "included" ? "Included" : "Excluded";
  const stackingLabel = value.canvasStacking === "mixed" ? "Mixed" : value.canvasStacking === "first-on-top" ? "First on top" : "Last on top";
  const gridContentCode = (gridValue: ElementGridSettings): AlignmentValue => {
    const horizontal = gridValue.justifyContent === "center" ? "c" : gridValue.justifyContent === "end" ? "r" : "l";
    const vertical = gridValue.alignContent === "center" ? "m" : gridValue.alignContent === "end" ? "b" : "t";
    return `${vertical}${horizontal}` as AlignmentValue;
  };
  const codeToGridContent = (code: AlignmentValue) => ({
    justifyContent: (code[1] === "c" ? "center" : code[1] === "r" ? "end" : "start") as GridContentAlign,
    alignContent: (code[0] === "m" ? "center" : code[0] === "b" ? "end" : "start") as GridContentAlign,
  });
  return (
    <InspectorDialog
      open={open}
      onClose={onClose}
      trigger={trigger}
      ariaLabel="Auto layout settings"
      // Same 240px compact width, 8px surface-anchored gutter and elevation as
      // every other inspector dialog (Type / Stroke / Effects / Export). This
      // one was 288px wide and passed no anchor at all, so it read as a
      // different, wider dialog that opened over the panel (Composa#661).
      width={COMPACT_INSPECTOR_DIALOG_WIDTH}
      sideOffset={AUTO_LAYOUT_SETTINGS_INSPECTOR_SIDE_OFFSET}
      anchorSurfaceSelector={COMPOSA_INSPECTOR_SURFACE_SELECTOR}
      elevation={400}
      triggerClassName="inline-flex"
    >
      <div className="flex h-[40px] items-center border-b border-c-border px-[12px]">
        <h2 className="m-0 flex-1 font-[family-name:var(--composa-font-family)] text-[11px] font-[550] leading-[16px] text-c-text">
          Auto layout settings
        </h2>
        <button
          type="button"
          aria-label="Close Auto layout settings"
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
            <span className="inline-flex w-full">
              <SegmentedControl
                ariaLabel="Align text baseline"
                segments={[
                  { value: "off", ariaLabel: "Do not align text baseline", icon: <Minus size={16} strokeWidth={1.5} /> },
                  { value: "on", ariaLabel: "Align text baseline", icon: <Check size={16} strokeWidth={1.5} /> },
                ]}
                value={value.textBaseline === true ? "on" : "off"}
                onChange={next => onChange?.({ textBaseline: next === "on" })}
                disabled={disabled || !baselineApplicable}
                className="w-full"
              />
            </span>
          </Tooltip>
        </SettingRow>
        {grid && <div className="pt-[4px]">
          <div className="mb-[3px] text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary">Grid content alignment</div>
          <AlignmentControl ariaLabel="Grid content alignment" value={gridContentCode(grid)} onChange={code => onGridChange?.(codeToGridContent(code))} />
        </div>}
      </div>
    </InspectorDialog>
  );
}
